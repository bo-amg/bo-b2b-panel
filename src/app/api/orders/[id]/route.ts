import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Sipariş detayı
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      dealer: {
        select: {
          companyName: true,
          contactName: true,
          email: true,
          phone: true,
          taxId: true,
          taxOffice: true,
          address: true,
          city: true,
        },
      },
      items: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
  }

  // Bayi sadece kendi siparişini görebilir
  if (session.user.role === "DEALER" && order.dealerId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Bayi adminNotes'u göremez
  if (session.user.role === "DEALER") {
    const { adminNotes, ...safeOrder } = order;
    return NextResponse.json(safeOrder);
  }

  return NextResponse.json(order);
}

// Sipariş güncelle (admin only)
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
  const { status, adminNotes, rejectionReason, trackingNumber, shippingMethod } =
    body;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
  }

  // Durum güncelleme kuralları
  const validTransitions: Record<string, string[]> = {
    PENDING: ["APPROVED", "REJECTED", "CANCELLED"],
    APPROVED: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED"],
    REJECTED: [],
    DELIVERED: [],
    CANCELLED: [],
  };

  if (status && !validTransitions[order.status]?.includes(status)) {
    return NextResponse.json(
      { error: `${order.status} durumundan ${status} durumuna geçilemez` },
      { status: 400 }
    );
  }

  const updateData: any = {};
  if (status) updateData.status = status;
  if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
  if (rejectionReason) updateData.rejectionReason = rejectionReason;
  if (trackingNumber) updateData.trackingNumber = trackingNumber;
  if (shippingMethod) updateData.shippingMethod = shippingMethod;

  // Onaylandığında vade tarihi hesapla
  if (status === "APPROVED") {
    const settings = await prisma.settings.findUnique({
      where: { id: "global" },
    });
    const dueDays = settings?.defaultDueDays ?? 30;
    updateData.dueDate = new Date(
      Date.now() + dueDays * 24 * 60 * 60 * 1000
    );
  }

  const updated = await prisma.order.update({
    where: { id },
    data: updateData,
    include: {
      dealer: {
        select: { companyName: true, contactName: true, email: true },
      },
      items: true,
    },
  });

  return NextResponse.json(updated);
}
