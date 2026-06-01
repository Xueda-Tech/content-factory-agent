import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();

  const contents = db
    .prepare(
      `SELECT id, title, platform, status, body, created_at
       FROM content_pieces
       ORDER BY created_at DESC`
    )
    .all();

  return NextResponse.json(
    { contents },
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
