import { NextResponse } from "next/server";
import { persistFailResponse, readMenu, resetMenu } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await readMenu());
}

export async function POST() {
  try {
    return NextResponse.json(await resetMenu());
  } catch (error) {
    return NextResponse.json(persistFailResponse(error), { status: 500 });
  }
}
