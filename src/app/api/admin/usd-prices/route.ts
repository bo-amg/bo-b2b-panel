import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get USD prices for a product
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const product = await prisma.productCache.findUnique({
    where: { id: productId },
    select: { usdPrices: true, variants: true, title: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({
    title: product.title,
    usdPrices: (product.usdPrices as Record<string, number>) || {},
    variants: product.variants,
  });
}

// Set USD prices for a product
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { productId, usdPrices } = body;

  if (!productId || !usdPrices || typeof usdPrices !== "object") {
    return NextResponse.json(
      { error: "productId and usdPrices required" },
      { status: 400 }
    );
  }

  // Validate all values are positive numbers or null
  // null means "remove price", filter them out before saving
  const cleanPrices: Record<string, number> = {};
  for (const [key, value] of Object.entries(usdPrices)) {
    if (value === null || value === undefined) continue; // skip null — means no USD price
    if (typeof value !== "number" || value < 0) {
      return NextResponse.json(
        { error: `Invalid price for variant ${key}` },
        { status: 400 }
      );
    }
    cleanPrices[key] = value;
  }

  const updated = await prisma.productCache.update({
    where: { id: productId },
    data: { usdPrices: cleanPrices },
    select: { id: true, title: true, usdPrices: true },
  });

  return NextResponse.json(updated);
}
