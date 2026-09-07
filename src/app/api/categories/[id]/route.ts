import { NextResponse } from "next/server";
import { deleteCategory, persistFailResponse, readMenu, upsertCategory } from "@/lib/db";
import { slugify } from "@/lib/format";
import type { CategoryKind } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const current = (await readMenu()).categories.find((item) => item.id === id);
    if (!current) {
      return NextResponse.json({ error: "Categoría no encontrada." }, { status: 404 });
    }

    const body = await request.json();
    const name = String(body.name || current.name).trim();
    if (!name) {
      return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
    }

    return NextResponse.json(
      await upsertCategory({
        ...current,
        name,
        slug: slugify(body.slug || name),
        description: String(body.description ?? current.description),
        note: String(body.note ?? current.note),
        kind: (body.kind || current.kind) as CategoryKind,
        order: Number(body.order ?? current.order),
      })
    );
  } catch (error) {
    return NextResponse.json(persistFailResponse(error), { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await deleteCategory(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(persistFailResponse(error), { status: 500 });
  }
}
