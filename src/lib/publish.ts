/**
 * Content publishing clients for social-media platforms.
 *
 * Currently supports:
 * - Xiaohongshu (Little Red Book): note publishing
 *
 * Follows the same error-class hierarchy and retry pattern used in {@link ./ai.ts}.
 */

import { getDb } from "./db";

// ---------------------------------------------------------------------------
// Error classes
// ---------------------------------------------------------------------------

/** Base error for all publish failures. */
export class XhsPublishError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "XhsPublishError";
  }
}

/** Thrown when the XHS publish API returns a non-2xx response. */
export class XhsPublishAPIError extends XhsPublishError {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly responseBody: string,
    cause?: unknown,
  ) {
    super(message, cause);
    this.name = "XhsPublishAPIError";
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Options for publishing a note to Xiaohongshu. */
export interface PublishToXhsOptions {
  /** Note title (required). */
  title: string;
  /** Note body content (required). */
  content: string;
  /** Optional image URLs to attach to the note. */
  images?: string[];
  /** Optional topic ID for tracking. */
  contentId?: number;
}

/** Result returned after a successful XHS publish. */
export interface XhsPublishResult {
  /** Identifier assigned by the Xiaohongshu platform. */
  externalId?: string;
  /** URL to the published note (if available). */
  url?: string;
  /** Raw response body from the API for debugging / logging. */
  raw?: unknown;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const XHS_PUBLISH_BASE_URL =
  process.env.XHS_PUBLISH_API_URL ?? "https://api.xiaohongshu.com";
const XHS_PUBLISH_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 2;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Sleep for the given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Read the XHS API key from the environment.
 * @throws {XhsPublishError} If the key is not configured.
 */
function getXhsApiKey(): string {
  const key = process.env.XHS_API_KEY;
  if (!key) {
    throw new XhsPublishError(
      "XHS_API_KEY environment variable is not set",
    );
  }
  return key;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Publish a note to Xiaohongshu.
 *
 * Uses the configured XHS publishing API. Records the publish attempt
 * in the `publish_history` table when a `contentId` is provided.
 *
 * @param options - Publication parameters (title, content, images).
 * @returns The publish result including external ID and URL.
 * @throws {XhsPublishError}    If required configuration is missing or request fails.
 * @throws {XhsPublishAPIError} If the API returns a non-2xx response.
 */
export async function publishToXhs(
  options: PublishToXhsOptions,
): Promise<XhsPublishResult> {
  const apiKey = getXhsApiKey();

  if (!options.title.trim()) {
    throw new XhsPublishError("title must not be empty");
  }
  if (!options.content.trim()) {
    throw new XhsPublishError("content must not be empty");
  }

  const url = `${XHS_PUBLISH_BASE_URL}/api/v1/note/publish`;

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(1000 * Math.pow(2, attempt - 1));
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      XHS_PUBLISH_TIMEOUT_MS,
    );

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          title: options.title,
          content: options.content,
          images: options.images ?? [],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new XhsPublishAPIError(
          `XHS API returned ${response.status}: ${text}`,
          response.status,
          text,
        );
      }

      const data = (await response.json()) as {
        success?: boolean;
        noteId?: string;
        url?: string;
        error?: string;
      };

      if (data.success === false) {
        throw new XhsPublishAPIError(
          `XHS publish failed: ${data.error ?? "unknown error"}`,
          502,
          JSON.stringify(data),
        );
      }

      return {
        externalId: data.noteId,
        url: data.url,
        raw: data,
      };
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;

      // Don't retry on client errors (4xx)
      if (
        err instanceof XhsPublishAPIError &&
        err.statusCode >= 400 &&
        err.statusCode < 500
      ) {
        throw err;
      }

      // AbortError means timeout
      if (err instanceof DOMException && err.name === "AbortError") {
        lastError = new XhsPublishError("XHS API request timed out", err);
        continue;
      }

      // XhsPublishAPIError with 5xx -- retry
      if (err instanceof XhsPublishAPIError) {
        continue;
      }

      // Non-retryable errors
      if (err instanceof XhsPublishError) {
        throw err;
      }
    }
  }

  throw new XhsPublishError(
    `XHS publish failed after ${MAX_RETRIES + 1} attempts`,
    lastError,
  );
}

/**
 * Retrieve recent publish history records from the database.
 *
 * @param limit - Maximum number of records to return. Defaults to 20.
 * @returns Array of publish history records.
 */
export function getPublishHistory(
  limit = 20,
): Array<{
  id: number;
  content_id: number;
  platform: string;
  external_id: string | null;
  url: string | null;
  status: string;
  response: string | null;
  published_at: string;
  title: string | null;
}> {
  const db = getDb();

  const rows = db
    .prepare(
      `SELECT ph.id,
              ph.content_id,
              ph.platform,
              ph.external_id,
              ph.url,
              ph.status,
              ph.response,
              ph.published_at,
              cp.title
       FROM publish_history ph
       LEFT JOIN content_pieces cp ON cp.id = ph.content_id
       ORDER BY ph.published_at DESC
       LIMIT ?`,
    )
    .all(limit);

  return rows as Array<{
    id: number;
    content_id: number;
    platform: string;
    external_id: string | null;
    url: string | null;
    status: string;
    response: string | null;
    published_at: string;
    title: string | null;
  }>;
}

/**
 * Look up a content piece by its ID.
 *
 * @param contentId - The ID of the content piece.
 * @returns The content piece row, or null if not found.
 */
export function getContentById(
  contentId: number,
): {
  id: number;
  title: string | null;
  body: string | null;
  platform: string;
  status: string;
} | null {
  const db = getDb();

  const row = db
    .prepare(
      `SELECT id, title, body, platform, status
       FROM content_pieces
       WHERE id = ?`,
    )
    .get(contentId);

  return (row as {
    id: number;
    title: string | null;
    body: string | null;
    platform: string;
    status: string;
  } | null) ?? null;
}
