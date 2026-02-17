import { NextRequest, NextResponse } from "next/server";
import { syncProducts } from "@/lib/shopify-sync";

export async function POST(req: NextRequest) {
  // Vercel Cron veya secret ile korunan endpoint
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncProducts();
    return NextResponse.json({
      success: true,
      message: `${result.totalSynced} ürün senkronize edildi`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Cron sync error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
