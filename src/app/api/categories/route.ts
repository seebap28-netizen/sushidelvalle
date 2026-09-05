import { NextResponse } from "next/server";
import { readMenu, upsertCategory } from "@/lib/db";
import { createId, slugify } from "@/lib/format";
import type { Category, CategoryKind } from "@/lib/types";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(readMenu().categories);
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  }

  const category: Category = {
    id: createId(),
    name,
    slug: slugify(body.slug || name),
    description: String(body.description || ""),
    note: String(body.note || ""),
    kind: (body.kind || "menu") as CategoryKind,
    order: Number(body.order) || readMenu().categories.length + 1,
  };

  return NextResponse.json(upsertCategory(category), { status: 201 });
}
