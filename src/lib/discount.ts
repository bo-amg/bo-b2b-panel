import { prisma } from "./prisma";
import type { Decimal } from "@prisma/client/runtime/library";

interface DiscountResult {
  percent: number;
  source: "dealer-product" | "dealer-category" | "dealer" | "product" | "category" | "global";
}

/**
 * İskonto hiyerarşisi (6 seviye, en spesifik kazanır):
 * 1. Bayi-Ürün iskontosu (DealerProductDiscount)
 * 2. Bayi-Kategori iskontosu (DealerCategoryDiscount)
 * 3. Bayi Genel iskontosu (User.discountPercent)
 * 4. Global Ürün iskontosu (ProductDiscount)
 * 5. Global Kategori iskontosu (CategoryDiscount)
 * 6. Global varsayılan (Settings.discountPercent = %20)
 */
export async function getDiscountForProduct(
  shopifyProductId: string,
  collectionIds: string[],
  dealerId: string | null,
  dealerGlobalDiscountPercent: Decimal | null
): Promise<DiscountResult> {
  // 1. Bayi-Ürün iskontosu
  if (dealerId) {
    const dealerProduct = await prisma.dealerProductDiscount.findUnique({
      where: { dealerId_shopifyProductId: { dealerId, shopifyProductId } },
    });
    if (dealerProduct) {
      return { percent: Number(dealerProduct.discountPercent), source: "dealer-product" };
    }

    // 2. Bayi-Kategori iskontosu
    if (collectionIds.length > 0) {
      const dealerCategories = await prisma.dealerCategoryDiscount.findMany({
        where: { dealerId, shopifyCollectionId: { in: collectionIds } },
      });
      if (dealerCategories.length > 0) {
        const highest = dealerCategories.reduce((max, dc) =>
          Number(dc.discountPercent) > Number(max.discountPercent) ? dc : max
        );
        return { percent: Number(highest.discountPercent), source: "dealer-category" };
      }
    }
  }

  // 3. Bayi Genel iskontosu
  if (dealerGlobalDiscountPercent !== null) {
    return { percent: Number(dealerGlobalDiscountPercent), source: "dealer" };
  }

  // 4. Global Ürün iskontosu
  const productDiscount = await prisma.productDiscount.findUnique({
    where: { shopifyProductId },
  });
  if (productDiscount) {
    return { percent: Number(productDiscount.discountPercent), source: "product" };
  }

  // 5. Global Kategori iskontosu
  if (collectionIds.length > 0) {
    const categoryDiscounts = await prisma.categoryDiscount.findMany({
      where: { shopifyCollectionId: { in: collectionIds } },
    });
    if (categoryDiscounts.length > 0) {
      const highest = categoryDiscounts.reduce((max, cd) =>
        Number(cd.discountPercent) > Number(max.discountPercent) ? cd : max
      );
      return { percent: Number(highest.discountPercent), source: "category" };
    }
  }

  // 6. Global varsayılan
  const settings = await prisma.settings.findUnique({ where: { id: "global" } });
  return { percent: settings ? Number(settings.discountPercent) : 20, source: "global" };
}

/**
 * Toplu iskonto hesaplama (ürün listesi için) - batch optimized
 */
export async function getDiscountsForProducts(
  products: Array<{
    shopifyProductId: string;
    collectionIds: string[];
  }>,
  dealerId: string | null,
  dealerGlobalDiscountPercent: Decimal | null
): Promise<Map<string, DiscountResult>> {
  const productIds = products.map((p) => p.shopifyProductId);
  const allCollectionIds = [...new Set(products.flatMap((p) => p.collectionIds))];

  // Bayi-özel iskontolar (varsa)
  let dealerProductMap = new Map<string, number>();
  let dealerCategoryMap = new Map<string, number>();

  if (dealerId) {
    const dealerProducts = await prisma.dealerProductDiscount.findMany({
      where: { dealerId, shopifyProductId: { in: productIds } },
    });
    dealerProductMap = new Map(
      dealerProducts.map((dp) => [dp.shopifyProductId, Number(dp.discountPercent)])
    );

    if (allCollectionIds.length > 0) {
      const dealerCategories = await prisma.dealerCategoryDiscount.findMany({
        where: { dealerId, shopifyCollectionId: { in: allCollectionIds } },
      });
      dealerCategoryMap = new Map(
        dealerCategories.map((dc) => [dc.shopifyCollectionId, Number(dc.discountPercent)])
      );
    }
  }

  // Global ürün iskontolarını tek sorguda çek
  const productDiscounts = await prisma.productDiscount.findMany({
    where: { shopifyProductId: { in: productIds } },
  });
  const productDiscountMap = new Map(
    productDiscounts.map((pd) => [pd.shopifyProductId, Number(pd.discountPercent)])
  );

  // Global kategori iskontolarını tek sorguda çek
  const categoryDiscounts = await prisma.categoryDiscount.findMany({
    where: { shopifyCollectionId: { in: allCollectionIds } },
  });
  const categoryDiscountMap = new Map(
    categoryDiscounts.map((cd) => [cd.shopifyCollectionId, Number(cd.discountPercent)])
  );

  // Global varsayılan iskonto
  const settings = await prisma.settings.findUnique({ where: { id: "global" } });
  const globalDiscount = settings ? Number(settings.discountPercent) : 20;

  // Her ürün için 6 seviyeli hiyerarşi uygula
  const result = new Map<string, DiscountResult>();
  for (const product of products) {
    // 1. Bayi-Ürün iskontosu
    const dp = dealerProductMap.get(product.shopifyProductId);
    if (dp !== undefined) {
      result.set(product.shopifyProductId, { percent: dp, source: "dealer-product" });
      continue;
    }

    // 2. Bayi-Kategori iskontosu (en yüksek)
    let maxDealerCat = 0;
    let hasDealerCat = false;
    for (const cid of product.collectionIds) {
      const dc = dealerCategoryMap.get(cid);
      if (dc !== undefined && dc > maxDealerCat) {
        maxDealerCat = dc;
        hasDealerCat = true;
      }
    }
    if (hasDealerCat) {
      result.set(product.shopifyProductId, { percent: maxDealerCat, source: "dealer-category" });
      continue;
    }

    // 3. Bayi Genel iskontosu
    if (dealerGlobalDiscountPercent !== null) {
      result.set(product.shopifyProductId, {
        percent: Number(dealerGlobalDiscountPercent),
        source: "dealer",
      });
      continue;
    }

    // 4. Global Ürün iskontosu
    const pd = productDiscountMap.get(product.shopifyProductId);
    if (pd !== undefined) {
      result.set(product.shopifyProductId, { percent: pd, source: "product" });
      continue;
    }

    // 5. Global Kategori iskontosu (en yüksek)
    let maxCat = 0;
    let hasCat = false;
    for (const cid of product.collectionIds) {
      const cd = categoryDiscountMap.get(cid);
      if (cd !== undefined && cd > maxCat) {
        maxCat = cd;
        hasCat = true;
      }
    }
    if (hasCat) {
      result.set(product.shopifyProductId, { percent: maxCat, source: "category" });
      continue;
    }

    // 6. Global varsayılan
    result.set(product.shopifyProductId, { percent: globalDiscount, source: "global" });
  }

  return result;
}
