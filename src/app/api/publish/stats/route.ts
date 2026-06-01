import { NextResponse } from "next/server";
import { getPublishStats, PublishError } from "@/lib/publish";

/**
 * GET /api/publish/stats
 *
 * Returns aggregate publish statistics by status and platform.
 */
export async function GET() {
  try {
    const stats = getPublishStats();
    return NextResponse.json(stats, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    if (err instanceof PublishError) {
      return NextResponse.json(
        { error: err.message },
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
