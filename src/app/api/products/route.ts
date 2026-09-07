import { NextResponse } from "next/server";
import { persistFailResponse, readMenu, upsertProduct } from "@/lib/db";
import { createId } from "@/lib/format";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json((await readMenu()).products);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const categoryId = String(body.categoryId || "");
    if (!name || !categoryId) {
      return NextResponse.json(
        { error: "Nombre y categoría son obligatorios." },
        { status: 400 }
      );
    }

    const menu = await readMenu();
    const product: Product = {
      id: createId(),
      categoryId,
      name,
      description: String(body.description || ""),
      price: Number(body.price) || 0,
      extraPrice: Number(body.extraPrice) || 0,
      details: Array.isArray(body.details)
        ? body.details.map((item: string) => String(item).trim()).filter(Boolean)
        : String(body.details || "")
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
      available: body.available !== false,
      featured: Boolean(body.featured),
      order: Number(body.order) || menu.products.length + 1,
      image: String(body.image || ""),
    };

    return NextResponse.json(await upsertProduct(product), { status: 201 });
  } catch (error) {
    return NextResponse.json(persistFailResponse(error), { status: 500 });
  }
}
