import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Bayi listele
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dealers = await prisma.user.findMany({
    where: { role: "DEALER" },
    select: {
      id: true,
      email: true,
      companyName: true,
      contactName: true,
      phone: true,
      taxId: true,
      city: true,
      discountPercent: true,
      isActive: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(dealers);
}

// Yeni bayi oluştur
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    email,
    password,
    companyName,
    contactName,
    phone,
    taxId,
    taxOffice,
    address,
    city,
    discountPercent,
    language,
    currency,
  } = body;

  if (!email || !password || !companyName || !contactName) {
    return NextResponse.json(
      { error: "Email, şifre, firma adı ve yetkili adı zorunludur" },
      { status: 400 }
    );
  }

  // Email kontrolü
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Bu email adresi zaten kullanılıyor" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const dealer = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "DEALER",
      companyName,
      contactName,
      phone,
      taxId,
      taxOffice,
      address,
      city,
      discountPercent: discountPercent ? parseFloat(discountPercent) : null,
    },
  });

  return NextResponse.json(
    { id: dealer.id, email: dealer.email, companyName: dealer.companyName },
    { status: 201 }
  );
}
