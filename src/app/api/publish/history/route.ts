import { NextRequest, NextResponse } from "next/server";
import {
  getPublishHistory,
  PublishError,
} from "@/lib/publish";
import type { PublishPlatform, PublishStatus } from "@/lib/publish";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const contentIdRaw = searchParams.get("contentId");
  const platform = searchParams.get("platform") as PublishPlatform | null;
  const status = searchParams.get("status") as PublishStatus | null;
  const limitRaw = searchParams.get("limit");
  const offsetRaw = searchParams.get("offset");

  try {
    const filter: {
      contentId?: number;
      platform?: PublishPlatform;
      status?: PublishStatus;
      limit?: number;
      offset?: number;
    } = {};

    if (contentIdRaw !== null) {
      const parsed = Number(contentIdRaw);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        return NextResponse.json(
          { error: "contentId must be a positive integer" },
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
      filter.contentId = parsed;
    }

    if (platform) filter.platform = platform;
    if (status) filter.status = status;
    if (limitRaw) filter.limit = Math.min(Number(limitRaw), 200);
    if (offsetRaw) filter.offset = Number(offsetRaw);

    const records = getPublishHistory(filter);
    return NextResponse.json(records, {
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
