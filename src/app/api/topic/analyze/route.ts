import { NextRequest, NextResponse } from "next/server";
import {
  analyzeTopic,
  AIError,
  AIAPIError,
  AIRequestError,
} from "@/lib/ai";

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

  const { content } = body as { content?: unknown };

  if (typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json(
      { error: "content must be a non-empty string" },
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const result = await analyzeTopic(content);
    return NextResponse.json(result, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    if (err instanceof AIRequestError) {
      return NextResponse.json(
        { error: err.message },
        { status: 504, headers: { "Content-Type": "application/json" } },
      );
    }
    if (err instanceof AIAPIError) {
      return NextResponse.json(
        { error: err.message },
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }
    if (err instanceof AIError) {
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
