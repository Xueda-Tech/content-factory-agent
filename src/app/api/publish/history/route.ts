import { NextRequest, NextResponse } from "next/server";
import { getPublishHistory } from "@/lib/publish";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 20;

  if (isNaN(limit) || limit < 1 || limit > 100) {
    return NextResponse.json(
      { error: "limit must be a number between 1 and 100" },
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const history = getPublishHistory(limit);

    return NextResponse.json(
      { history },
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch publish history" },
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
