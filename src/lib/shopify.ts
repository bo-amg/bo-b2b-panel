const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN!;
const API_VERSION = process.env.SHOPIFY_API_VERSION || "2026-01";

// Client Credentials token cache
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Shopify 2026 Dev Dashboard: Client Credentials Grant
 * Token 24 saatte bir yenilenir, otomatik cache'lenir.
 */
async function getAccessToken(): Promise<string> {
  // Eğer eski usul shpat_ token varsa direkt kullan
  const staticToken = process.env.SHOPIFY_ADMIN_API_TOKEN;
  if (staticToken && staticToken.startsWith("shpat_")) {
    return staticToken;
  }

  // Cache'deki token hala geçerliyse kullan (5 dk margin)
  if (cachedToken && Date.now() < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedToken;
  }

  // Client Credentials Grant ile yeni token al
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "SHOPIFY_CLIENT_ID ve SHOPIFY_CLIENT_SECRET environment variable'ları gerekli. " +
      "Shopify Dev Dashboard > App > Ayarlar'dan alabilirsiniz."
    );
  }

  const response = await fetch(
    `https://${SHOPIFY_STORE}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Shopify token alınamadı (${response.status}): ${errorText}`
    );
  }

  const data = await response.json();
  cachedToken = data.access_token;
  // expires_in saniye cinsinden (genelde 86399 = ~24 saat)
  tokenExpiresAt = Date.now() + (data.expires_in || 86000) * 1000;

  console.log(
    `[Shopify] Yeni access token alındı, ${Math.round((data.expires_in || 86000) / 3600)} saat geçerli`
  );

  return cachedToken!;
}

interface ShopifyGraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
  extensions?: {
    cost: {
      requestedQueryCost: number;
      actualQueryCost: number;
      throttleStatus: {
        maximumAvailable: number;
        currentlyAvailable: number;
        restoreRate: number;
      };
    };
  };
}

export async function shopifyGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const token = await getAccessToken();

  const response = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  if (!response.ok) {
    // Token expired olabilir, cache'i temizle ve tekrar dene
    if (response.status === 401) {
      cachedToken = null;
      tokenExpiresAt = 0;
      const retryToken = await getAccessToken();
      const retryResponse = await fetch(
        `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": retryToken,
          },
          body: JSON.stringify({ query, variables }),
        }
      );
      if (!retryResponse.ok) {
        throw new Error(`Shopify API error: ${retryResponse.status} ${retryResponse.statusText}`);
      }
      const retryJson: ShopifyGraphQLResponse<T> = await retryResponse.json();
      if (retryJson.errors) {
        throw new Error(`Shopify GraphQL error: ${retryJson.errors.map((e) => e.message).join(", ")}`);
      }
      return retryJson.data;
    }
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }

  const json: ShopifyGraphQLResponse<T> = await response.json();

  if (json.errors) {
    throw new Error(`Shopify GraphQL error: ${json.errors.map((e) => e.message).join(", ")}`);
  }

  return json.data;
}

// Ürünleri sayfalı olarak çek
export async function fetchAllProducts(cursor?: string) {
  const query = `
    query GetProducts($cursor: String) {
      products(first: 50, after: $cursor, query: "status:active") {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            title
            handle
            vendor
            productType
            status
            tags
            images(first: 5) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            variants(first: 100) {
              edges {
                node {
                  id
                  title
                  sku
                  price
                  inventoryQuantity
                }
              }
            }
            collections(first: 20) {
              edges {
                node {
                  id
                  title
                }
              }
            }
          }
        }
      }
    }
  `;

  return shopifyGraphQL<{
    products: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      edges: Array<{
        node: {
          id: string;
          title: string;
          handle: string;
          vendor: string;
          productType: string;
          status: string;
          tags: string[];
          images: { edges: Array<{ node: { url: string; altText: string | null } }> };
          variants: {
            edges: Array<{
              node: {
                id: string;
                title: string;
                sku: string;
                price: string;
                inventoryQuantity: number;
              };
            }>;
          };
          collections: {
            edges: Array<{ node: { id: string; title: string } }>;
          };
        };
      }>;
    };
  }>(query, { cursor });
}

// Belirli varyantların stok durumunu kontrol et
export async function checkInventory(variantIds: string[]) {
  const query = `
    query CheckInventory($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on ProductVariant {
          id
          inventoryQuantity
          price
        }
      }
    }
  `;

  return shopifyGraphQL<{
    nodes: Array<{
      id: string;
      inventoryQuantity: number;
      price: string;
    }>;
  }>(query, { ids: variantIds });
}
