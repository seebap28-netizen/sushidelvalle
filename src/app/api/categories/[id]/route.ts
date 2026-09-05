import { NextResponse } from "next/server";
import { deleteCategory, readMenu, upsertCategory } from "@/lib/db";
import { slugify } from "@/lib/format";
import type { CategoryKind } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
  const { id } = await params;
  const current = readMenu().categories.find((item) => item.id === id);
  if (!current) {
    return NextResponse.json({ error: "Categoría no encontrada." }, { status: 404 });
  }

  const body = await request.json();
  const name = String(body.name || current.name).trim();
  if (!name) {
    return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  }

  return NextResponse.json(
    upsertCategory({
      ...current,
      name,
      slug: slugify(body.slug || name),
      description: String(body.description ?? current.description),
      note: String(body.note ?? current.note),
      kind: (body.kind || current.kind) as CategoryKind,
      order: Number(body.order ?? current.order),
    })
  );
}

export async function DELETE(_: Request, { params }: Ctx) {
  const { id } = await params;
  deleteCategory(id);
  return NextResponse.json({ ok: true });
}
