import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncProducts } from "@/lib/shopify-sync";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncProducts();
    return NextResponse.json({
      success: true,
      message: `${result.totalSynced} ürün senkronize edildi`,
    });
  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Sync başarısız: " + error.message },
      { status: 500 }
    );
  }
}
