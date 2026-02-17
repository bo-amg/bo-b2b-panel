import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const discounts = await prisma.categoryDiscount.findMany({
    orderBy: { collectionTitle: "asc" },
  });

  return NextResponse.json(discounts);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { shopifyCollectionId, collectionTitle, discountPercent } = body;

  if (!shopifyCollectionId || !collectionTitle || discountPercent === undefined) {
    return NextResponse.json(
      { error: "Koleksiyon ve iskonto oranı zorunludur" },
      { status: 400 }
    );
  }

  const discount = await prisma.categoryDiscount.upsert({
    where: { shopifyCollectionId },
    create: {
      shopifyCollectionId,
      collectionTitle,
      discountPercent: parseFloat(discountPercent),
    },
    update: {
      collectionTitle,
      discountPercent: parseFloat(discountPercent),
    },
  });

  return NextResponse.json(discount, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID zorunludur" }, { status: 400 });
  }

  await prisma.categoryDiscount.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
