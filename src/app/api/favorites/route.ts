import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Kullanıcının favori ürünlerini getir
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json([], { status: 401 });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: (session.user as any).id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(favorites);
}

// POST - Favori ekle
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productCacheId } = await req.json();
  if (!productCacheId) {
    return NextResponse.json({ error: "productCacheId gerekli" }, { status: 400 });
  }

  try {
    const favorite = await prisma.favorite.create({
      data: {
        userId: (session.user as any).id,
        productCacheId,
      },
    });
    return NextResponse.json(favorite, { status: 201 });
  } catch (err: any) {
    // Zaten favoride
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Zaten favorilerde" }, { status: 409 });
    }
    throw err;
  }
}

// DELETE - Favori kaldır
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const productCacheId = req.nextUrl.searchParams.get("productCacheId");
  if (!productCacheId) {
    return NextResponse.json({ error: "productCacheId gerekli" }, { status: 400 });
  }

  await prisma.favorite.deleteMany({
    where: {
      userId: (session.user as any).id,
      productCacheId,
    },
  });

  return NextResponse.json({ success: true });
}
