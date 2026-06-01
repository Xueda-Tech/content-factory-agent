import { NextRequest, NextResponse } from "next/server";
import {
  logPublishAttempt,
  updatePublishStatus,
  getPublishRecord,
  deletePublishRecord,
  PublishError,
  PublishNotFoundError,
  PublishStatusError,
} from "@/lib/publish";
import type { PublishPlatform, PublishStatus } from "@/lib/publish";

/**
 * POST /api/publish/status
 *
 * Actions:
 * - { action: "log", contentId, platform } → log a new pending attempt
 * - { action: "update", id, status, externalId?, url?, response? } → update status
 * - { action: "delete", id } → delete a record
 */
export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { action } = body as { action?: unknown };

  if (typeof action !== "string") {
    return NextResponse.json(
      { error: "action is required (log | update | delete)" },
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    switch (action) {
      case "log": {
        const { contentId, platform } = body as {
          contentId?: unknown;
          platform?: unknown;
        };
        if (typeof contentId !== "number" || contentId <= 0) {
          return NextResponse.json(
            { error: "contentId must be a positive number" },
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }
        if (typeof platform !== "string") {
          return NextResponse.json(
            { error: "platform must be a string" },
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }
        const record = logPublishAttempt({
          contentId,
          platform: platform as PublishPlatform,
        });
        return NextResponse.json(record, {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }

      case "update": {
        const { id, status, externalId, url, response } = body as {
          id?: unknown;
          status?: unknown;
          externalId?: unknown;
          url?: unknown;
          response?: unknown;
        };
        if (typeof id !== "number" || id <= 0) {
          return NextResponse.json(
            { error: "id must be a positive number" },
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }
        if (typeof status !== "string") {
          return NextResponse.json(
            { error: "status must be a string" },
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        const updateInput: {
          id: number;
          status: PublishStatus;
          externalId?: string;
          url?: string;
          response?: string;
        } = { id, status: status as PublishStatus };

        if (typeof externalId === "string") updateInput.externalId = externalId;
        if (typeof url === "string") updateInput.url = url;
        if (typeof response === "string") updateInput.response = response;

        const record = updatePublishStatus(updateInput);
        return NextResponse.json(record, {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      case "delete": {
        const { id } = body as { id?: unknown };
        if (typeof id !== "number" || id <= 0) {
          return NextResponse.json(
            { error: "id must be a positive number" },
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }
        const deleted = deletePublishRecord(id);
        return NextResponse.json(
          { deleted },
          { status: deleted ? 200 : 404, headers: { "Content-Type": "application/json" } },
        );
      }

      default:
        return NextResponse.json(
          { error: `Unknown action "${action}". Use: log, update, delete` },
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
    }
  } catch (err) {
    if (err instanceof PublishNotFoundError) {
      return NextResponse.json(
        { error: err.message },
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }
    if (err instanceof PublishStatusError) {
      return NextResponse.json(
        { error: err.message },
        { status: 409, headers: { "Content-Type": "application/json" } },
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

/**
 * GET /api/publish/status?id=123
 *
 * Fetch a single publish record by ID.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const idRaw = searchParams.get("id");

  if (!idRaw) {
    return NextResponse.json(
      { error: "id query parameter is required" },
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { error: "id must be a positive integer" },
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const record = getPublishRecord(id);
    return NextResponse.json(record, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    if (err instanceof PublishNotFoundError) {
      return NextResponse.json(
        { error: err.message },
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
