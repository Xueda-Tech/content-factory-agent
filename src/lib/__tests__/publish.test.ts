// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Database from "better-sqlite3";

// Mock getDb to return an in-memory database with migrations applied
let memDb: Database.Database;

vi.mock("@/lib/db", () => ({
  getDb: () => memDb,
}));

// Import AFTER mock setup so publish.ts picks up the mocked getDb
import {
  logPublishAttempt,
  updatePublishStatus,
  getPublishRecord,
  getPublishHistory,
  getPublishStats,
  deletePublishRecord,
  PublishError,
  PublishNotFoundError,
  PublishStatusError,
} from "@/lib/publish";

/**
 * Apply the same migration SQL used by src/lib/db.ts
 * so the in-memory database matches the real schema.
 */
function applyMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version    INTEGER PRIMARY KEY,
      name       TEXT    NOT NULL,
      applied_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS topics (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword    TEXT    NOT NULL,
      source     TEXT    NOT NULL CHECK (source IN ('wechat', 'xiaohongshu', 'manual', 'other')),
      analysis   TEXT,
      status     TEXT    NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'analyzed', 'content_created', 'published')),
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS content_pieces (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id   INTEGER REFERENCES topics (id) ON DELETE SET NULL,
      platform   TEXT    NOT NULL CHECK (platform IN ('wechat', 'xiaohongshu', 'twitter')),
      title      TEXT,
      body       TEXT,
      status     TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'editing', 'ready', 'published')),
      metadata   TEXT,
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS publish_history (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id   INTEGER NOT NULL REFERENCES content_pieces (id) ON DELETE CASCADE,
      platform     TEXT    NOT NULL,
      external_id  TEXT,
      url          TEXT,
      status       TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
      response     TEXT,
      published_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS api_config (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      service    TEXT    NOT NULL UNIQUE,
      config     TEXT    NOT NULL,
      updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Insert a content_piece so FK references work
  db.exec(`
    INSERT INTO content_pieces (id, platform, title, body, status)
    VALUES (1, 'wechat', 'Test Article', 'Body text', 'ready');
  `);
}

beforeEach(() => {
  memDb = new Database(":memory:");
  memDb.pragma("foreign_keys = ON");
  applyMigrations(memDb);
});

afterEach(() => {
  memDb.close();
});

// ---------------------------------------------------------------------------
// logPublishAttempt
// ---------------------------------------------------------------------------

describe("logPublishAttempt", () => {
  it("creates a pending record and returns it", () => {
    const record = logPublishAttempt({ contentId: 1, platform: "wechat" });

    expect(record.id).toBeGreaterThan(0);
    expect(record.content_id).toBe(1);
    expect(record.platform).toBe("wechat");
    expect(record.status).toBe("pending");
    expect(record.external_id).toBeNull();
    expect(record.url).toBeNull();
    expect(record.response).toBeNull();
    expect(record.published_at).toBeTruthy();
  });

  it("works for all valid platforms", () => {
    for (const platform of ["wechat", "xiaohongshu", "twitter"] as const) {
      const r = logPublishAttempt({ contentId: 1, platform });
      expect(r.platform).toBe(platform);
      expect(r.status).toBe("pending");
    }
  });

  it("throws PublishError for invalid contentId", () => {
    expect(() => logPublishAttempt({ contentId: 0, platform: "wechat" })).toThrow(PublishError);
    expect(() => logPublishAttempt({ contentId: -1, platform: "wechat" })).toThrow(PublishError);
    expect(() => logPublishAttempt({ contentId: 1.5, platform: "wechat" })).toThrow(PublishError);
  });

  it("throws PublishError for invalid platform", () => {
    expect(() =>
      logPublishAttempt({ contentId: 1, platform: "linkedin" as never }),
    ).toThrow(PublishError);
  });
});

// ---------------------------------------------------------------------------
// updatePublishStatus
// ---------------------------------------------------------------------------

describe("updatePublishStatus", () => {
  it("transitions from pending to success", () => {
    const created = logPublishAttempt({ contentId: 1, platform: "wechat" });
    const updated = updatePublishStatus({
      id: created.id,
      status: "success",
      externalId: "ext-123",
      url: "https://example.com/published",
      response: '{"ok":true}',
    });

    expect(updated.status).toBe("success");
    expect(updated.external_id).toBe("ext-123");
    expect(updated.url).toBe("https://example.com/published");
    expect(updated.response).toBe('{"ok":true}');
  });

  it("transitions from pending to failed", () => {
    const created = logPublishAttempt({ contentId: 1, platform: "xiaohongshu" });
    const updated = updatePublishStatus({
      id: created.id,
      status: "failed",
      response: '{"error":"rate limited"}',
    });

    expect(updated.status).toBe("failed");
    expect(updated.response).toBe('{"error":"rate limited"}');
  });

  it("throws PublishStatusError on invalid transition (success → pending)", () => {
    const created = logPublishAttempt({ contentId: 1, platform: "wechat" });
    updatePublishStatus({ id: created.id, status: "success" });

    expect(() =>
      updatePublishStatus({ id: created.id, status: "pending" }),
    ).toThrow(PublishStatusError);
  });

  it("throws PublishStatusError on invalid transition (failed → success)", () => {
    const created = logPublishAttempt({ contentId: 1, platform: "wechat" });
    updatePublishStatus({ id: created.id, status: "failed" });

    expect(() =>
      updatePublishStatus({ id: created.id, status: "success" }),
    ).toThrow(PublishStatusError);
  });

  it("throws PublishStatusError on invalid transition (success → failed)", () => {
    const created = logPublishAttempt({ contentId: 1, platform: "wechat" });
    updatePublishStatus({ id: created.id, status: "success" });

    expect(() =>
      updatePublishStatus({ id: created.id, status: "failed" }),
    ).toThrow(PublishStatusError);
  });

  it("throws PublishNotFoundError for missing id", () => {
    expect(() =>
      updatePublishStatus({ id: 9999, status: "success" }),
    ).toThrow(PublishNotFoundError);
  });

  it("throws PublishError for invalid id", () => {
    expect(() =>
      updatePublishStatus({ id: 0, status: "success" }),
    ).toThrow(PublishError);
  });

  it("throws PublishError for invalid status", () => {
    const created = logPublishAttempt({ contentId: 1, platform: "wechat" });
    expect(() =>
      updatePublishStatus({ id: created.id, status: "unknown" as never }),
    ).toThrow(PublishError);
  });

  it("partially updates fields (only status + url)", () => {
    const created = logPublishAttempt({ contentId: 1, platform: "twitter" });
    const updated = updatePublishStatus({
      id: created.id,
      status: "success",
      url: "https://twitter.com/post/1",
    });

    expect(updated.status).toBe("success");
    expect(updated.url).toBe("https://twitter.com/post/1");
    expect(updated.external_id).toBeNull(); // unchanged
  });
});

// ---------------------------------------------------------------------------
// getPublishRecord
// ---------------------------------------------------------------------------

describe("getPublishRecord", () => {
  it("returns a record by id", () => {
    const created = logPublishAttempt({ contentId: 1, platform: "wechat" });
    const fetched = getPublishRecord(created.id);

    expect(fetched.id).toBe(created.id);
    expect(fetched.content_id).toBe(1);
    expect(fetched.platform).toBe("wechat");
  });

  it("throws PublishNotFoundError for missing id", () => {
    expect(() => getPublishRecord(9999)).toThrow(PublishNotFoundError);
  });

  it("throws PublishError for invalid id", () => {
    expect(() => getPublishRecord(-1)).toThrow(PublishError);
  });
});

// ---------------------------------------------------------------------------
// getPublishHistory
// ---------------------------------------------------------------------------

describe("getPublishHistory", () => {
  beforeEach(() => {
    // Seed multiple records
    logPublishAttempt({ contentId: 1, platform: "wechat" });
    logPublishAttempt({ contentId: 1, platform: "xiaohongshu" });
    logPublishAttempt({ contentId: 1, platform: "twitter" });
  });

  it("returns all records when no filter", () => {
    const all = getPublishHistory();
    expect(all).toHaveLength(3);
  });

  it("filters by contentId", () => {
    const filtered = getPublishHistory({ contentId: 1 });
    expect(filtered).toHaveLength(3);
    expect(filtered.every((r) => r.content_id === 1)).toBe(true);
  });

  it("filters by platform", () => {
    const filtered = getPublishHistory({ platform: "wechat" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].platform).toBe("wechat");
  });

  it("filters by status", () => {
    // Update one to success
    const all = getPublishHistory();
    updatePublishStatus({ id: all[0].id, status: "success" });

    const successOnly = getPublishHistory({ status: "success" });
    expect(successOnly).toHaveLength(1);
    expect(successOnly[0].status).toBe("success");

    const pendingOnly = getPublishHistory({ status: "pending" });
    expect(pendingOnly).toHaveLength(2);
  });

  it("supports limit and offset", () => {
    const page1 = getPublishHistory({ limit: 2, offset: 0 });
    expect(page1).toHaveLength(2);

    const page2 = getPublishHistory({ limit: 2, offset: 2 });
    expect(page2).toHaveLength(1);
  });

  it("returns empty array when nothing matches", () => {
    const filtered = getPublishHistory({ contentId: 999 });
    expect(filtered).toHaveLength(0);
  });

  it("throws PublishError for invalid platform filter", () => {
    expect(() =>
      getPublishHistory({ platform: "linkedin" as never }),
    ).toThrow(PublishError);
  });

  it("throws PublishError for invalid status filter", () => {
    expect(() =>
      getPublishHistory({ status: "unknown" as never }),
    ).toThrow(PublishError);
  });
});

// ---------------------------------------------------------------------------
// getPublishStats
// ---------------------------------------------------------------------------

describe("getPublishStats", () => {
  it("returns zeroed stats when no records", () => {
    const stats = getPublishStats();
    expect(stats.total).toBe(0);
    expect(stats.pending).toBe(0);
    expect(stats.success).toBe(0);
    expect(stats.failed).toBe(0);
    expect(stats.byPlatform.wechat.total).toBe(0);
  });

  it("counts records by status and platform", () => {
    const r1 = logPublishAttempt({ contentId: 1, platform: "wechat" });
    const r2 = logPublishAttempt({ contentId: 1, platform: "wechat" });
    const r3 = logPublishAttempt({ contentId: 1, platform: "xiaohongshu" });

    updatePublishStatus({ id: r1.id, status: "success" });
    updatePublishStatus({ id: r2.id, status: "failed" });
    // r3 stays pending

    const stats = getPublishStats();
    expect(stats.total).toBe(3);
    expect(stats.success).toBe(1);
    expect(stats.failed).toBe(1);
    expect(stats.pending).toBe(1);
    expect(stats.byPlatform.wechat.total).toBe(2);
    expect(stats.byPlatform.wechat.success).toBe(1);
    expect(stats.byPlatform.wechat.failed).toBe(1);
    expect(stats.byPlatform.xiaohongshu.total).toBe(1);
    expect(stats.byPlatform.xiaohongshu.pending).toBe(1);
    expect(stats.byPlatform.twitter.total).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// deletePublishRecord
// ---------------------------------------------------------------------------

describe("deletePublishRecord", () => {
  it("deletes an existing record and returns true", () => {
    const created = logPublishAttempt({ contentId: 1, platform: "wechat" });
    expect(deletePublishRecord(created.id)).toBe(true);

    // Verify it's gone
    expect(() => getPublishRecord(created.id)).toThrow(PublishNotFoundError);
  });

  it("returns false when record does not exist", () => {
    expect(deletePublishRecord(9999)).toBe(false);
  });

  it("throws PublishError for invalid id", () => {
    expect(() => deletePublishRecord(0)).toThrow(PublishError);
  });
});

// ---------------------------------------------------------------------------
// Edge cases / integration
// ---------------------------------------------------------------------------

describe("full lifecycle", () => {
  it("log → update → fetch → stats → delete", () => {
    // Log
    const record = logPublishAttempt({ contentId: 1, platform: "wechat" });
    expect(record.status).toBe("pending");

    // Update to success
    const updated = updatePublishStatus({
      id: record.id,
      status: "success",
      externalId: "wx-abc",
      url: "https://mp.weixin.qq.com/s/abc",
    });
    expect(updated.status).toBe("success");

    // Fetch
    const fetched = getPublishRecord(record.id);
    expect(fetched.external_id).toBe("wx-abc");
    expect(fetched.url).toBe("https://mp.weixin.qq.com/s/abc");

    // Stats
    const stats = getPublishStats();
    expect(stats.total).toBe(1);
    expect(stats.success).toBe(1);

    // Delete
    expect(deletePublishRecord(record.id)).toBe(true);
    const afterDelete = getPublishStats();
    expect(afterDelete.total).toBe(0);
  });
});
