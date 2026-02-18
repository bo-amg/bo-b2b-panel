import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Bayi detay
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const dealer = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      companyName: true,
      contactName: true,
      phone: true,
      taxId: true,
      taxOffice: true,
      address: true,
      city: true,
      discountPercent: true,
      language: true,
      currency: true,
      allowedCollections: true,
      allowedVendors: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!dealer) {
    return NextResponse.json({ error: "Bayi bulunamadı" }, { status: 404 });
  }

  return NextResponse.json(dealer);
}

// Bayi güncelle
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const updateData: any = {};

  if (body.companyName) updateData.companyName = body.companyName;
  if (body.contactName) updateData.contactName = body.contactName;
  if (body.phone !== undefined) updateData.phone = body.phone;
  if (body.taxId !== undefined) updateData.taxId = body.taxId;
  if (body.taxOffice !== undefined) updateData.taxOffice = body.taxOffice;
  if (body.address !== undefined) updateData.address = body.address;
  if (body.city !== undefined) updateData.city = body.city;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;
  if (body.discountPercent !== undefined) {
    updateData.discountPercent =
      body.discountPercent === null || body.discountPercent === ""
        ? null
        : parseFloat(body.discountPercent);
  }

  // Dil ve para birimi
  if (body.language !== undefined && ["TR", "EN"].includes(body.language)) {
    updateData.language = body.language;
  }
  if (body.currency !== undefined && ["TRY", "USD"].includes(body.currency)) {
    updateData.currency = body.currency;
  }

  // Görünürlük ayarları
  if (body.allowedCollections !== undefined) {
    updateData.allowedCollections = body.allowedCollections;
  }
  if (body.allowedVendors !== undefined) {
    updateData.allowedVendors = body.allowedVendors;
  }

  // Şifre değişikliği
  if (body.password) {
    updateData.passwordHash = await bcrypt.hash(body.password, 12);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      companyName: true,
      contactName: true,
      isActive: true,
      discountPercent: true,
    },
  });

  return NextResponse.json(updated);
}
