import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const pin = String(body.pin || "").trim();
  const expected = process.env.ADMIN_PIN || "delvalle";

  if (!pin || pin !== expected) {
    return NextResponse.json({ error: "Clave incorrecta." }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
