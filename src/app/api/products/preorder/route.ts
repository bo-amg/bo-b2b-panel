import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH - Admin: toplu ön sipariş durumu güncelle
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { productIds, isPreorder, preorderNote } = body;

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return NextResponse.json(
      { error: "Ürün ID listesi gerekli" },
      { status: 400 }
    );
  }

  // Toplu güncelleme
  const result = await prisma.productCache.updateMany({
    where: { id: { in: productIds } },
    data: {
      isPreorder: isPreorder === true,
      ...(preorderNote !== undefined && { preorderNote: preorderNote || null }),
    },
  });

  return NextResponse.json({
    success: true,
    updated: result.count,
    message: `${result.count} ürün güncellendi`,
  });
}

// GET - Admin: ön sipariş ürünlerini listele
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const preorderProducts = await prisma.productCache.findMany({
    where: { isPreorder: true },
    select: {
      id: true,
      title: true,
      handle: true,
      vendor: true,
      images: true,
      preorderNote: true,
      isPreorder: true,
    },
    orderBy: { title: "asc" },
  });

  return NextResponse.json(preorderProducts);
}
