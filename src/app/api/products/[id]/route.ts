import { NextResponse } from "next/server";
import { deleteProduct, readMenu, upsertProduct } from "@/lib/db";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function parseDetails(value: unknown, fallback: string[]) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return fallback;
}

export async function PUT(request: Request, { params }: Ctx) {
  const { id } = await params;
  const current = readMenu().products.find((item) => item.id === id);
  if (!current) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  const body = await request.json();
  const name = String(body.name || current.name).trim();
  if (!name) {
    return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  }

  return NextResponse.json(
    upsertProduct({
      ...current,
      name,
      categoryId: String(body.categoryId || current.categoryId),
      description: String(body.description ?? current.description),
      price: Number(body.price ?? current.price),
      extraPrice: Number(body.extraPrice ?? current.extraPrice),
      details: parseDetails(body.details, current.details),
      available: body.available ?? current.available,
      featured: body.featured ?? current.featured,
      order: Number(body.order ?? current.order),
      image: String(body.image ?? current.image ?? ""),
    })
  );
}

export async function DELETE(_: Request, { params }: Ctx) {
  const { id } = await params;
  deleteProduct(id);
  return NextResponse.json({ ok: true });
}
