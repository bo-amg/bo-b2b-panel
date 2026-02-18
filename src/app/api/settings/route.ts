import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "global";
  const settingsId = type === "global_dealer" ? "global_dealer" : "global";

  let settings = await prisma.settings.findUnique({
    where: { id: settingsId },
  });

  if (!settings) {
    settings = await prisma.settings.create({
      data: { id: settingsId },
    });
  }

  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { settingsType, ...data } = body;
  const settingsId = settingsType === "global_dealer" ? "global_dealer" : "global";

  const settings = await prisma.settings.upsert({
    where: { id: settingsId },
    create: { id: settingsId, ...data },
    update: data,
  });

  return NextResponse.json(settings);
}
