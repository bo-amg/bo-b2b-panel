import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDiscountsForProducts } from "@/lib/discount";
import { calculateWholesalePrice } from "@/lib/utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allProducts = await prisma.productCache.findMany({
    where: { status: "ACTIVE" },
    orderBy: { title: "asc" },
  });

  // Yedek parça koleksiyonlarını filtrele
  let products = allProducts.filter((p) => {
    const collections = (p.collections as any[]) || [];
    return !collections.some((c: any) =>
      c.title?.toLowerCase().includes("yedek parça")
    );
  });

  // Bayi görünürlük filtresi (koleksiyon + marka kısıtlaması)
  if (session.user.role === "DEALER") {
    const dealer = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { allowedCollections: true, allowedVendors: true, currency: true },
    });

    const allowedCols = (dealer?.allowedCollections as string[]) || [];
    const allowedVends = (dealer?.allowedVendors as string[]) || [];

    if (allowedCols.length > 0) {
      products = products.filter((p) => {
        const colIds = ((p.collections as any[]) || []).map((c: any) => c.id);
        return colIds.some((id) => allowedCols.includes(id));
      });
    }

    if (allowedVends.length > 0) {
      products = products.filter((p) =>
        p.vendor ? allowedVends.includes(p.vendor) : false
      );
    }
  }

  // İskonto hesapla
  const productInputs = products.map((p) => ({
    shopifyProductId: p.shopifyProductId,
    collectionIds: ((p.collections as any[]) || []).map((c: any) => c.id),
  }));

  const dealerDiscountPercent =
    session.user.role === "DEALER" ? (session.user.discountPercent as any) : null;
  const dealerId =
    session.user.role === "DEALER" ? (session.user as any).id : null;

  const discountMap = await getDiscountsForProducts(
    productInputs,
    dealerId,
    dealerDiscountPercent
  );

  // Kademeli iskonto tier'larını çek (product + category + global)
  const allProductIds = products.map((p) => p.shopifyProductId);
  const allCollectionIds = [
    ...new Set(
      products.flatMap((p) =>
        ((p.collections as any[]) || []).map((c: any) => c.id)
      )
    ),
  ];

  const allTiers = await prisma.discountTier.findMany({
    where: {
      OR: [
        { discountType: "product", referenceId: { in: allProductIds } },
        { discountType: "category", referenceId: { in: allCollectionIds } },
        { discountType: "global", referenceId: "global" },
      ],
    },
    orderBy: { minQuantity: "asc" },
  });

  // Tier'ları ürüne göre grupla
  const globalTiers = allTiers
    .filter((t) => t.discountType === "global")
    .map((t) => ({ minQuantity: t.minQuantity, discountPercent: Number(t.discountPercent) }));

  const categoryTierMap = new Map<string, Array<{ minQuantity: number; discountPercent: number }>>();
  allTiers
    .filter((t) => t.discountType === "category")
    .forEach((t) => {
      const arr = categoryTierMap.get(t.referenceId) || [];
      arr.push({ minQuantity: t.minQuantity, discountPercent: Number(t.discountPercent) });
      categoryTierMap.set(t.referenceId, arr);
    });

  const productTierMap = new Map<string, Array<{ minQuantity: number; discountPercent: number }>>();
  allTiers
    .filter((t) => t.discountType === "product")
    .forEach((t) => {
      const arr = productTierMap.get(t.referenceId) || [];
      arr.push({ minQuantity: t.minQuantity, discountPercent: Number(t.discountPercent) });
      productTierMap.set(t.referenceId, arr);
    });

  // Dealer currency check
  let dealerCurrency = "TRY";
  if (session.user.role === "DEALER") {
    const dealerInfo = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { currency: true },
    });
    dealerCurrency = dealerInfo?.currency || "TRY";
  }
  const isUSD = dealerCurrency === "USD";

  const productsWithPricing = products.map((p) => {
    const discount = discountMap.get(p.shopifyProductId);
    const usdPrices = (p.usdPrices as Record<string, number>) || {};

    const variants = (p.variants as any[]).map((v: any) => {
      const basePrice = isUSD ? (usdPrices[v.id] || 0) : parseFloat(v.price);
      return {
        ...v,
        retailPrice: basePrice,
        wholesalePrice: calculateWholesalePrice(
          basePrice,
          discount?.percent ?? 20
        ),
        hasUsdPrice: isUSD ? (usdPrices[v.id] || 0) > 0 : true,
      };
    });

    // Ürüne uygun tier'ları bul (öncelik: product > category > global)
    let tiers = productTierMap.get(p.shopifyProductId);
    if (!tiers || tiers.length === 0) {
      const collectionIds = ((p.collections as any[]) || []).map((c: any) => c.id);
      for (const cid of collectionIds) {
        const catTiers = categoryTierMap.get(cid);
        if (catTiers && catTiers.length > 0) {
          tiers = catTiers;
          break;
        }
      }
    }
    if (!tiers || tiers.length === 0) {
      tiers = globalTiers;
    }
    // Bayi-özel iskontosu varsa tier'ları gösterme
    if (discount?.source.startsWith("dealer")) {
      tiers = [];
    }

    return {
      ...p,
      variants,
      discountPercent: discount?.percent ?? 20,
      discountSource: discount?.source ?? "global",
      discountTiers: tiers.length > 0 ? tiers : undefined,
      currency: dealerCurrency,
    };
  });

  return NextResponse.json(productsWithPricing);
}
