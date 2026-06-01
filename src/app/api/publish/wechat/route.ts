import { NextRequest, NextResponse } from "next/server";
import {
  publishToWeChat,
  PublishError,
  PublishAPIError,
} from "@/lib/api-clients";
import { getDb } from "@/lib/db";

interface PublishRequestBody {
  contentId?: unknown;
  wechatAppid?: unknown;
  title?: unknown;
  content?: unknown;
  contentFormat?: unknown;
  articleType?: unknown;
}

export async function POST(request: NextRequest) {
  let body: PublishRequestBody;

  try {
    body = (await request.json()) as PublishRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const {
    contentId,
    wechatAppid,
    title,
    content,
    contentFormat,
    articleType,
  } = body;

  // Validate required fields
  if (typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json(
      { error: "title must be a non-empty string" },
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (typeof content !== "string") {
    return NextResponse.json(
      { error: "content must be a string" },
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const db = getDb();
  let publishHistoryId: number | null = null;

  try {
    // Insert pending publish record
    if (typeof contentId === "number") {
      const result = db
        .prepare(
          `INSERT INTO publish_history (content_id, platform, status)
           VALUES (?, 'wechat', 'pending')`
        )
        .run(contentId);
      publishHistoryId = Number(result.lastInsertRowid);
    }

    // Call the WeChat publish API
    const publishResult = await publishToWeChat({
      wechatAppid: typeof wechatAppid === "string" ? wechatAppid : undefined,
      title: title.trim(),
      content,
      contentFormat:
        typeof contentFormat === "string" ? contentFormat : "markdown",
      articleType: typeof articleType === "string" ? articleType : "news",
    });

    // Update publish history with success
    if (publishHistoryId !== null) {
      db.prepare(
        `UPDATE publish_history
         SET status = 'success',
             external_id = ?,
             url = ?,
             response = ?
         WHERE id = ?`
      ).run(
        publishResult.externalId ?? null,
        publishResult.url ?? null,
        JSON.stringify(publishResult),
        publishHistoryId,
      );
    }

    return NextResponse.json(
      {
        success: true,
        externalId: publishResult.externalId,
        url: publishResult.url,
      },
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    // Update publish history with failure
    if (publishHistoryId !== null) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      db.prepare(
        `UPDATE publish_history
         SET status = 'failed',
             response = ?
         WHERE id = ?`
      ).run(JSON.stringify({ error: errorMessage }), publishHistoryId);
    }

    if (err instanceof PublishAPIError) {
      return NextResponse.json(
        { error: err.message },
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }
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
