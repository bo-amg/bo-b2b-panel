import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Public: aktif bannerları getir
export async function GET() {
  const banners = await prisma.banner.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(banners);
}

// POST - Admin: yeni banner ekle
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, imageUrl, linkUrl, isActive, sortOrder } = body;

  if (!title || !imageUrl) {
    return NextResponse.json(
      { error: "Başlık ve görsel URL zorunlu" },
      { status: 400 }
    );
  }

  const banner = await prisma.banner.create({
    data: {
      title,
      description: description || null,
      imageUrl,
      linkUrl: linkUrl || null,
      isActive: isActive !== false,
      sortOrder: sortOrder || 0,
    },
  });

  return NextResponse.json(banner, { status: 201 });
}

// DELETE - Admin: banner sil
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
  }

  await prisma.banner.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

// PATCH - Admin: banner güncelle
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, ...data } = body;

  if (!id) {
    return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
  }

  const banner = await prisma.banner.update({
    where: { id },
    data,
  });

  return NextResponse.json(banner);
}
