import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDiscountForProduct } from "@/lib/discount";
import { calculateWholesalePrice, generateOrderNumber } from "@/lib/utils";

// Sipariş listele
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where: any = {};

  // Bayiler sadece kendi siparişlerini görebilir
  if (session.user.role === "DEALER") {
    where.dealerId = session.user.id;
  }

  if (status) {
    where.status = status;
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      dealer: {
        select: { companyName: true, contactName: true, email: true },
      },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

// Yeni sipariş oluştur
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { items, notes, dealerId: bodyDealerId } = body;

  // Admin, bayi adına sipariş oluşturabilir
  const isAdmin = session.user.role === "ADMIN";
  const isDealer = session.user.role === "DEALER";

  if (!isAdmin && !isDealer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Admin ise body'den dealerId al, bayi ise kendi ID'sini kullan
  const targetDealerId = isAdmin ? bodyDealerId : session.user.id;

  if (!targetDealerId) {
    return NextResponse.json(
      { error: "Bayi seçimi zorunludur" },
      { status: 400 }
    );
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "Sepet boş olamaz" },
      { status: 400 }
    );
  }

  // Ürünleri cache'den doğrula
  const productIds = [...new Set(items.map((i: any) => i.shopifyProductId))];
  const cachedProducts = await prisma.productCache.findMany({
    where: { shopifyProductId: { in: productIds } },
  });

  const productMap = new Map(
    cachedProducts.map((p) => [p.shopifyProductId, p])
  );

  // Bayi bilgilerini çek
  const dealer = await prisma.user.findUnique({
    where: { id: targetDealerId },
  });

  if (!dealer || dealer.role !== "DEALER") {
    return NextResponse.json({ error: "Bayi bulunamadı" }, { status: 404 });
  }

  // Sipariş kalemlerini hazırla
  let subtotal = 0;
  const orderItems: any[] = [];

  for (const item of items) {
    const product = productMap.get(item.shopifyProductId);
    if (!product) {
      return NextResponse.json(
        { error: `Ürün bulunamadı: ${item.shopifyProductId}` },
        { status: 400 }
      );
    }

    const variants = product.variants as any[];
    const variant = variants.find(
      (v: any) => v.id === item.shopifyVariantId
    );

    if (!variant) {
      return NextResponse.json(
        { error: `Varyant bulunamadı: ${item.shopifyVariantId}` },
        { status: 400 }
      );
    }

    // Stok kontrolü (admin atlar)
    if (!isAdmin && variant.inventoryQuantity < item.quantity) {
      return NextResponse.json(
        {
          error: `Yetersiz stok: ${product.title} (Mevcut: ${variant.inventoryQuantity}, İstenen: ${item.quantity})`,
        },
        { status: 400 }
      );
    }

    const retailPrice = parseFloat(variant.price);
    let wholesalePrice: number;
    let discountPercent: number;

    // Admin özel fiyat girdiyse onu kullan
    if (isAdmin && item.customPrice != null && item.customPrice > 0) {
      wholesalePrice = item.customPrice;
      discountPercent = retailPrice > 0
        ? Math.round((1 - wholesalePrice / retailPrice) * 10000) / 100
        : 0;
    } else {
      // İskonto hesapla
      const collectionIds = ((product.collections as any[]) || []).map(
        (c: any) => c.id
      );
      const discount = await getDiscountForProduct(
        product.shopifyProductId,
        collectionIds,
        dealer?.id || null,
        dealer?.discountPercent ?? null
      );
      wholesalePrice = calculateWholesalePrice(retailPrice, discount.percent);
      discountPercent = discount.percent;
    }

    const lineTotal = wholesalePrice * item.quantity;
    subtotal += lineTotal;

    const images = product.images as any[];
    orderItems.push({
      shopifyProductId: product.shopifyProductId,
      shopifyVariantId: item.shopifyVariantId,
      title: product.title,
      variantTitle: variant.title !== "Default Title" ? variant.title : null,
      sku: variant.sku || null,
      imageUrl: images[0]?.url || null,
      quantity: item.quantity,
      retailPrice,
      wholesalePrice,
      discountPercent,
      lineTotal,
    });
  }

  // Ortalama iskonto hesapla (gösterim için)
  const avgDiscount =
    orderItems.reduce((sum: number, i: any) => sum + i.discountPercent, 0) /
    orderItems.length;

  // Vade tarihi hesapla
  const settings = await prisma.settings.findUnique({
    where: { id: "global" },
  });
  const dueDays = settings?.defaultDueDays ?? 30;
  const dueDate = new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000);

  // Sipariş oluştur
  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      dealerId: targetDealerId,
      status: isAdmin && body.status ? body.status : "PENDING",
      subtotal,
      discountPercent: avgDiscount,
      totalAmount: subtotal,
      notes,
      dueDate,
      items: {
        create: orderItems,
      },
    },
    include: { items: true },
  });

  return NextResponse.json(order, { status: 201 });
}
