import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? "SET (" + process.env.DATABASE_URL.substring(0, 30) + "...)" : "NOT SET",
      DIRECT_URL: process.env.DIRECT_URL ? "SET" : "NOT SET",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "SET" : "NOT SET",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || "NOT SET",
      SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN || "NOT SET",
    },
  };

  // Test Prisma connection
  try {
    const { prisma } = await import("@/lib/prisma");
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    checks.database = { status: "connected", result };
  } catch (error: any) {
    checks.database = {
      status: "error",
      message: error.message,
      code: error.code,
    };
  }

  return NextResponse.json(checks, {
    status: checks.database?.status === "connected" ? 200 : 500,
  });
}
