/**
 * Publish status tracking module.
 *
 * Provides CRUD operations for the `publish_history` table, enabling:
 * - Logging every publish attempt (pending → success / failed)
 * - Querying publish history with optional filters
 * - Aggregate statistics per platform and overall
 *
 * Uses the shared SQLite connection from {@link ./db.ts}.
 */

import { getDb } from "./db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported publishing platforms. */
export type PublishPlatform = "wechat" | "xiaohongshu" | "twitter";

/** Lifecycle status of a publish attempt. */
export type PublishStatus = "pending" | "success" | "failed";

/** A single publish history row as stored in SQLite. */
export interface PublishRecord {
  id: number;
  content_id: number;
  platform: PublishPlatform;
  external_id: string | null;
  url: string | null;
  status: PublishStatus;
  response: string | null;
  published_at: string;
}

/** Parameters for creating a new publish attempt. */
export interface LogPublishInput {
  contentId: number;
  platform: PublishPlatform;
}

/** Parameters for updating a publish record's status. */
export interface UpdatePublishInput {
  id: number;
  status: PublishStatus;
  externalId?: string;
  url?: string;
  response?: string;
}

/** Aggregate publish statistics. */
export interface PublishStats {
  total: number;
  pending: number;
  success: number;
  failed: number;
  byPlatform: Record<PublishPlatform, { total: number; success: number; failed: number; pending: number }>;
}

/** Filters for querying publish history. */
export interface PublishHistoryFilter {
  contentId?: number;
  platform?: PublishPlatform;
  status?: PublishStatus;
  limit?: number;
  offset?: number;
}

// ---------------------------------------------------------------------------
// Error classes
// ---------------------------------------------------------------------------

/** Base error for publish-tracking failures. */
export class PublishError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "PublishError";
  }
}

/** Thrown when a publish record is not found. */
export class PublishNotFoundError extends PublishError {
  constructor(id: number) {
    super(`Publish record #${id} not found`);
    this.name = "PublishNotFoundError";
  }
}

/** Thrown when an invalid status transition is attempted. */
export class PublishStatusError extends PublishError {
  constructor(message: string) {
    super(message);
    this.name = "PublishStatusError";
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const VALID_PLATFORMS: PublishPlatform[] = ["wechat", "xiaohongshu", "twitter"];
const VALID_STATUSES: PublishStatus[] = ["pending", "success", "failed"];

/** Allowed status transitions: from → set of valid targets. */
const STATUS_TRANSITIONS: Record<PublishStatus, Set<PublishStatus>> = {
  pending: new Set(["success", "failed"]),
  success: new Set(),   // terminal
  failed: new Set(),    // terminal
};

function isValidPlatform(value: unknown): value is PublishPlatform {
  return VALID_PLATFORMS.includes(value as PublishPlatform);
}

function isValidStatus(value: unknown): value is PublishStatus {
  return VALID_STATUSES.includes(value as PublishStatus);
}

/** Validate that a transition from `current` to `next` is allowed. */
function validateTransition(current: PublishStatus, next: PublishStatus): void {
  if (!STATUS_TRANSITIONS[current].has(next)) {
    throw new PublishStatusError(
      `Cannot transition from "${current}" to "${next}"`,
    );
  }
}

/** Convert a raw SQLite row to a typed PublishRecord. */
function rowToRecord(row: Record<string, unknown>): PublishRecord {
  return {
    id: row.id as number,
    content_id: row.content_id as number,
    platform: row.platform as PublishPlatform,
    external_id: (row.external_id as string) ?? null,
    url: (row.url as string) ?? null,
    status: row.status as PublishStatus,
    response: (row.response as string) ?? null,
    published_at: row.published_at as string,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Log a new publish attempt with status "pending".
 *
 * @returns The newly created PublishRecord.
 * @throws {PublishError} If contentId is invalid.
 */
export function logPublishAttempt(input: LogPublishInput): PublishRecord {
  const { contentId, platform } = input;

  if (!Number.isInteger(contentId) || contentId <= 0) {
    throw new PublishError("contentId must be a positive integer");
  }
  if (!isValidPlatform(platform)) {
    throw new PublishError(
      `Invalid platform "${platform}". Must be one of: ${VALID_PLATFORMS.join(", ")}`,
    );
  }

  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO publish_history (content_id, platform, status)
    VALUES (?, ?, 'pending')
  `);

  const result = stmt.run(contentId, platform);
  const id = result.lastInsertRowid as number;

  // Fetch and return the created record
  const row = db.prepare("SELECT * FROM publish_history WHERE id = ?").get(id) as Record<string, unknown>;
  return rowToRecord(row);
}

/**
 * Update the status of an existing publish record.
 *
 * Validates that the status transition is legal (pending → success/failed).
 *
 * @returns The updated PublishRecord.
 * @throws {PublishNotFoundError} If the record does not exist.
 * @throws {PublishStatusError} If the transition is not allowed.
 */
export function updatePublishStatus(input: UpdatePublishInput): PublishRecord {
  const { id, status, externalId, url, response } = input;

  if (!Number.isInteger(id) || id <= 0) {
    throw new PublishError("id must be a positive integer");
  }
  if (!isValidStatus(status)) {
    throw new PublishError(
      `Invalid status "${status}". Must be one of: ${VALID_STATUSES.join(", ")}`,
    );
  }

  const db = getDb();

  // Fetch current record
  const current = db.prepare("SELECT * FROM publish_history WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!current) {
    throw new PublishNotFoundError(id);
  }

  const currentStatus = current.status as PublishStatus;
  validateTransition(currentStatus, status);

  // Build dynamic UPDATE
  const sets: string[] = ["status = ?"];
  const params: unknown[] = [status];

  if (externalId !== undefined) {
    sets.push("external_id = ?");
    params.push(externalId);
  }
  if (url !== undefined) {
    sets.push("url = ?");
    params.push(url);
  }
  if (response !== undefined) {
    sets.push("response = ?");
    params.push(response);
  }

  params.push(id);
  db.prepare(`UPDATE publish_history SET ${sets.join(", ")} WHERE id = ?`).run(...params);

  const updated = db.prepare("SELECT * FROM publish_history WHERE id = ?").get(id) as Record<string, unknown>;
  return rowToRecord(updated);
}

/**
 * Get a single publish record by ID.
 *
 * @throws {PublishNotFoundError} If the record does not exist.
 */
export function getPublishRecord(id: number): PublishRecord {
  if (!Number.isInteger(id) || id <= 0) {
    throw new PublishError("id must be a positive integer");
  }

  const db = getDb();
  const row = db.prepare("SELECT * FROM publish_history WHERE id = ?").get(id) as Record<string, unknown> | undefined;

  if (!row) {
    throw new PublishNotFoundError(id);
  }

  return rowToRecord(row);
}

/**
 * Query publish history with optional filters.
 *
 * @param filter - Optional filters for contentId, platform, status, limit, offset.
 * @returns Array of matching PublishRecord rows, ordered by published_at DESC.
 */
export function getPublishHistory(filter: PublishHistoryFilter = {}): PublishRecord[] {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filter.contentId !== undefined) {
    conditions.push("content_id = ?");
    params.push(filter.contentId);
  }
  if (filter.platform !== undefined) {
    if (!isValidPlatform(filter.platform)) {
      throw new PublishError(`Invalid platform "${filter.platform}"`);
    }
    conditions.push("platform = ?");
    params.push(filter.platform);
  }
  if (filter.status !== undefined) {
    if (!isValidStatus(filter.status)) {
      throw new PublishError(`Invalid status "${filter.status}"`);
    }
    conditions.push("status = ?");
    params.push(filter.status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filter.limit ?? 50;
  const offset = filter.offset ?? 0;

  const sql = `
    SELECT * FROM publish_history
    ${where}
    ORDER BY published_at DESC
    LIMIT ? OFFSET ?
  `;
  params.push(limit, offset);

  const db = getDb();
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  return rows.map(rowToRecord);
}

/**
 * Get aggregate publish statistics.
 *
 * @returns Stats broken down by status and platform.
 */
export function getPublishStats(): PublishStats {
  const db = getDb();

  const overall = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
    FROM publish_history
  `).get() as { total: number; pending: number; success: number; failed: number };

  const byPlatformRows = db.prepare(`
    SELECT
      platform,
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
    FROM publish_history
    GROUP BY platform
  `).all() as Array<{ platform: PublishPlatform; total: number; pending: number; success: number; failed: number }>;

  const byPlatform: Record<PublishPlatform, { total: number; success: number; failed: number; pending: number }> = {
    wechat: { total: 0, success: 0, failed: 0, pending: 0 },
    xiaohongshu: { total: 0, success: 0, failed: 0, pending: 0 },
    twitter: { total: 0, success: 0, failed: 0, pending: 0 },
  };

  for (const row of byPlatformRows) {
    byPlatform[row.platform] = {
      total: row.total,
      success: row.success,
      failed: row.failed,
      pending: row.pending,
    };
  }

  return {
    total: overall.total ?? 0,
    pending: overall.pending ?? 0,
    success: overall.success ?? 0,
    failed: overall.failed ?? 0,
    byPlatform,
  };
}

/**
 * Delete a publish record by ID.
 *
 * @returns true if a record was deleted, false if not found.
 */
export function deletePublishRecord(id: number): boolean {
  if (!Number.isInteger(id) || id <= 0) {
    throw new PublishError("id must be a positive integer");
  }

  const db = getDb();
  const result = db.prepare("DELETE FROM publish_history WHERE id = ?").run(id);
  return result.changes > 0;
}
