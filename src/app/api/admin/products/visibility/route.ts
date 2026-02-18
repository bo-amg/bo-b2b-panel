import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Toplu görünürlük güncelle
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { productIds, visibility } = body;

  if (
    !productIds ||
    !Array.isArray(productIds) ||
    productIds.length === 0 ||
    !["ALL", "TR_ONLY", "GLOBAL_ONLY"].includes(visibility)
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await prisma.productCache.updateMany({
    where: { id: { in: productIds } },
    data: { visibility },
  });

  return NextResponse.json({ updated: result.count, visibility });
}
