import { NextResponse } from "next/server";
import { nextCategoryOrder } from "@/lib/categories";
import { persistFailResponse, readMenu, upsertCategory } from "@/lib/db";
import { createId, slugify } from "@/lib/format";
import type { Category, CategoryKind } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json((await readMenu()).categories);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
    }

    const menu = await readMenu();
    const kind = (body.kind || "menu") as CategoryKind;
    const slug = slugify(body.slug || name);
    const category: Category = {
      id: createId(),
      name,
      slug,
      description: String(body.description || ""),
      note: String(body.note || ""),
      kind,
      order: nextCategoryOrder(menu.categories, kind, name, slug),
    };

    return NextResponse.json(await upsertCategory(category), { status: 201 });
  } catch (error) {
    return NextResponse.json(persistFailResponse(error), { status: 500 });
  }
}
