import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Tier'ları getir (opsiyonel filtre: discountType, referenceId)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const discountType = searchParams.get("discountType");
  const referenceId = searchParams.get("referenceId");

  const where: any = {};
  if (discountType) where.discountType = discountType;
  if (referenceId) where.referenceId = referenceId;

  const tiers = await prisma.discountTier.findMany({
    where,
    orderBy: [{ discountType: "asc" }, { referenceId: "asc" }, { minQuantity: "asc" }],
  });

  return NextResponse.json(tiers);
}

// POST - Yeni tier ekle veya güncelle
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { discountType, referenceId, minQuantity, discountPercent } = await req.json();

  if (!discountType || !referenceId || !minQuantity || !discountPercent) {
    return NextResponse.json({ error: "Tüm alanlar zorunlu" }, { status: 400 });
  }

  const tier = await prisma.discountTier.upsert({
    where: {
      discountType_referenceId_minQuantity: {
        discountType,
        referenceId,
        minQuantity: Number(minQuantity),
      },
    },
    create: {
      discountType,
      referenceId,
      minQuantity: Number(minQuantity),
      discountPercent: Number(discountPercent),
    },
    update: {
      discountPercent: Number(discountPercent),
    },
  });

  return NextResponse.json(tier, { status: 201 });
}

// DELETE - Tier sil
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
  }

  await prisma.discountTier.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
