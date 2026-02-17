import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateProformaPDF } from "@/lib/pdf/generate-proforma";

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
      dealer: true,
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

  const settings = await prisma.settings.findUnique({
    where: { id: "global" },
  });

  if (!settings) {
    return NextResponse.json(
      { error: "Ayarlar bulunamadı" },
      { status: 500 }
    );
  }

  const pdfBuffer = await generateProformaPDF(order, order.dealer, settings, order.items);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="proforma-${order.orderNumber}.pdf"`,
    },
  });
}
