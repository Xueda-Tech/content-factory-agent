import { NextRequest, NextResponse } from "next/server";
import {
  generateContent,
  AIError,
  AIAPIError,
  AIRequestError,
  AIResponseError,
  type Platform,
  type GenerateOptions,
} from "@/lib/ai";

const VALID_PLATFORMS = new Set<string>(["wechat", "xiaohongshu", "twitter"]);

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

  const { topic, platform, options } = body as {
    topic?: unknown;
    platform?: unknown;
    options?: unknown;
  };

  if (typeof topic !== "string" || topic.trim().length === 0) {
    return NextResponse.json(
      { error: "topic must be a non-empty string" },
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (typeof platform !== "string" || !VALID_PLATFORMS.has(platform)) {
    return NextResponse.json(
      { error: 'platform must be one of "wechat", "xiaohongshu", or "twitter"' },
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const generateOptions: GenerateOptions = {};

  if (options !== undefined && options !== null) {
    if (typeof options !== "object" || Array.isArray(options)) {
      return NextResponse.json(
        { error: "options must be an object" },
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const opts = options as Record<string, unknown>;

    if (opts.wordCount !== undefined) {
      if (typeof opts.wordCount !== "number" || opts.wordCount <= 0) {
        return NextResponse.json(
          { error: "options.wordCount must be a positive number" },
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
      generateOptions.wordCount = opts.wordCount;
    }

    if (opts.tone !== undefined) {
      if (typeof opts.tone !== "string") {
        return NextResponse.json(
          { error: "options.tone must be a string" },
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
      generateOptions.tone = opts.tone;
    }

    if (opts.extraInstructions !== undefined) {
      if (typeof opts.extraInstructions !== "string") {
        return NextResponse.json(
          { error: "options.extraInstructions must be a string" },
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
      generateOptions.extraInstructions = opts.extraInstructions;
    }
  }

  try {
    const content = await generateContent(
      topic.trim(),
      platform as Platform,
      generateOptions,
    );

    return NextResponse.json(
      { content },
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
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
    if (err instanceof AIResponseError) {
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
