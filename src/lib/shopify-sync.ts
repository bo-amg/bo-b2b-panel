import { prisma } from "./prisma";
import { fetchAllProducts } from "./shopify";

export async function syncProducts() {
  let cursor: string | undefined = undefined;
  let totalSynced = 0;

  do {
    const data = await fetchAllProducts(cursor);
    const products = data.products.edges;

    for (const { node: product } of products) {
      const variants = product.variants.edges.map(({ node: v }) => ({
        id: v.id,
        title: v.title,
        sku: v.sku,
        price: v.price,
        inventoryQuantity: v.inventoryQuantity,
      }));

      const images = product.images.edges.map(({ node: img }) => ({
        url: img.url,
        altText: img.altText,
      }));

      const collections = product.collections.edges.map(({ node: c }) => ({
        id: c.id,
        title: c.title,
      }));

      // Shopify GID'den numeric ID çıkar
      const numericId = product.id.replace("gid://shopify/Product/", "");

      await prisma.productCache.upsert({
        where: { shopifyProductId: numericId },
        create: {
          id: product.id,
          shopifyProductId: numericId,
          title: product.title,
          handle: product.handle,
          vendor: product.vendor,
          productType: product.productType,
          status: product.status,
          variants: variants,
          images: images,
          tags: product.tags,
          collections: collections,
          syncedAt: new Date(),
        },
        update: {
          title: product.title,
          handle: product.handle,
          vendor: product.vendor,
          productType: product.productType,
          status: product.status,
          variants: variants,
          images: images,
          tags: product.tags,
          collections: collections,
          syncedAt: new Date(),
        },
      });

      totalSynced++;
    }

    cursor = data.products.pageInfo.hasNextPage
      ? (data.products.pageInfo.endCursor ?? undefined)
      : undefined;
  } while (cursor);

  // Shopify'da artık olmayan ürünleri temizle (optional)
  // Şimdilik sadece sync edilen ürünleri güncelliyoruz

  return { totalSynced };
}
