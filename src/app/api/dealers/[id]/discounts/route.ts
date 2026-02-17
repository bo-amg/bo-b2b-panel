import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Bayi için tüm özel iskontolar
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [categoryDiscounts, productDiscounts] = await Promise.all([
    prisma.dealerCategoryDiscount.findMany({
      where: { dealerId: id },
      orderBy: { collectionTitle: "asc" },
    }),
    prisma.dealerProductDiscount.findMany({
      where: { dealerId: id },
      orderBy: { productTitle: "asc" },
    }),
  ]);

  return NextResponse.json({ categoryDiscounts, productDiscounts });
}

// POST: Yeni iskonto ekle/güncelle (upsert)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: dealerId } = await params;
  const body = await req.json();
  const { type, shopifyId, title, discountPercent } = body;

  if (!type || !shopifyId || !title || discountPercent === undefined) {
    return NextResponse.json({ error: "Eksik alanlar" }, { status: 400 });
  }

  const percent = parseFloat(discountPercent);
  if (isNaN(percent) || percent < 0 || percent > 100) {
    return NextResponse.json({ error: "Geçersiz iskonto oranı" }, { status: 400 });
  }

  try {
    if (type === "category") {
      const result = await prisma.dealerCategoryDiscount.upsert({
        where: {
          dealerId_shopifyCollectionId: {
            dealerId,
            shopifyCollectionId: shopifyId,
          },
        },
        update: { discountPercent: percent, collectionTitle: title },
        create: {
          dealerId,
          shopifyCollectionId: shopifyId,
          collectionTitle: title,
          discountPercent: percent,
        },
      });
      return NextResponse.json(result, { status: 201 });
    } else if (type === "product") {
      const result = await prisma.dealerProductDiscount.upsert({
        where: {
          dealerId_shopifyProductId: {
            dealerId,
            shopifyProductId: shopifyId,
          },
        },
        update: { discountPercent: percent, productTitle: title },
        create: {
          dealerId,
          shopifyProductId: shopifyId,
          productTitle: title,
          discountPercent: percent,
        },
      });
      return NextResponse.json(result, { status: 201 });
    } else {
      return NextResponse.json({ error: "Geçersiz tip" }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: İskonto sil
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await params; // consume params
  const { searchParams } = new URL(req.url);
  const discountId = searchParams.get("discountId");
  const type = searchParams.get("type");

  if (!discountId || !type) {
    return NextResponse.json({ error: "Eksik parametreler" }, { status: 400 });
  }

  try {
    if (type === "category") {
      await prisma.dealerCategoryDiscount.delete({ where: { id: discountId } });
    } else if (type === "product") {
      await prisma.dealerProductDiscount.delete({ where: { id: discountId } });
    } else {
      return NextResponse.json({ error: "Geçersiz tip" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
