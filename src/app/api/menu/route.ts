import { NextResponse } from "next/server";
import { readMenu, resetMenu } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(readMenu());
}

export function POST() {
  return NextResponse.json(resetMenu());
}
