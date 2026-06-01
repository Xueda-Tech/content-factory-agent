import { NextRequest, NextResponse } from "next/server";
import {
  publishToXhs,
  getContentById,
  XhsPublishError,
  XhsPublishAPIError,
} from "@/lib/publish";
import { getDb } from "@/lib/db";

interface PublishXhsRequestBody {
  contentId?: unknown;
  title?: unknown;
  content?: unknown;
  images?: unknown;
}

export async function POST(request: NextRequest) {
  let body: PublishXhsRequestBody;

  try {
    body = (await request.json()) as PublishXhsRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { contentId, title, content, images } = body;

  // Validate title
  if (typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json(
      { error: "title must be a non-empty string" },
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // If content is empty or not provided, try to look it up by contentId
  let resolvedContent = typeof content === "string" ? content : "";
  let resolvedTitle = title.trim();

  if (!resolvedContent.trim() && typeof contentId === "number") {
    const contentPiece = getContentById(contentId);
    if (contentPiece) {
      resolvedContent = contentPiece.body ?? "";
      // Use the stored title if the provided title is generic
      if (contentPiece.title && resolvedTitle === contentPiece.title) {
        resolvedTitle = contentPiece.title;
      }
    }
  }

  if (!resolvedContent.trim()) {
    return NextResponse.json(
      {
        error:
          "content must be a non-empty string (or provide a valid contentId with stored content)",
      },
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Validate images
  const resolvedImages = Array.isArray(images)
    ? (images as unknown[]).filter((i): i is string => typeof i === "string")
    : [];

  const db = getDb();
  let publishHistoryId: number | null = null;

  try {
    // Insert pending publish record
    if (typeof contentId === "number") {
      const result = db
        .prepare(
          `INSERT INTO publish_history (content_id, platform, status)
           VALUES (?, 'xiaohongshu', 'pending')`,
        )
        .run(contentId);
      publishHistoryId = Number(result.lastInsertRowid);
    }

    // Call the XHS publish API
    const publishResult = await publishToXhs({
      title: resolvedTitle,
      content: resolvedContent,
      images: resolvedImages,
      contentId: typeof contentId === "number" ? contentId : undefined,
    });

    // Update publish history with success
    if (publishHistoryId !== null) {
      db.prepare(
        `UPDATE publish_history
         SET status = 'success',
             external_id = ?,
             url = ?,
             response = ?
         WHERE id = ?`,
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
         WHERE id = ?`,
      ).run(JSON.stringify({ error: errorMessage }), publishHistoryId);
    }

    if (err instanceof XhsPublishAPIError) {
      return NextResponse.json(
        { error: err.message },
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }
    if (err instanceof XhsPublishError) {
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
