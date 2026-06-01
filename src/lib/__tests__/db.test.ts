import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";

// We need to control the DB path.  The module reads `process.cwd()` at import
// time, so we set up a temp dir *before* dynamic-importing the module.

let tmpDir: string;
let originalCwd: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cf-test-"));
  originalCwd = process.cwd();
  process.chdir(tmpDir);

  // Bust the module cache so getDb() re-evaluates the singleton with the new cwd
  vi.resetModules();
});

afterEach(() => {
  process.chdir(originalCwd);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("db module", () => {
  it("creates the database file and data directory on first getDb() call", async () => {
    const { getDb, closeDb } = await import("../db");
    const db = getDb();

    expect(db).toBeDefined();
    expect(fs.existsSync(path.join(tmpDir, "data", "content-factory.db"))).toBe(true);

    closeDb();
  });

  it("returns the same instance on subsequent calls (singleton)", async () => {
    const { getDb, closeDb } = await import("../db");
    const db1 = getDb();
    const db2 = getDb();
    expect(db1).toBe(db2);
    closeDb();
  });

  it("runs initial migration and creates all expected tables", async () => {
    const { getDb, closeDb } = await import("../db");
    const db = getDb();

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all()
      .map((r: unknown) => (r as { name: string }).name);

    expect(tables).toContain("schema_version");
    expect(tables).toContain("topics");
    expect(tables).toContain("content_pieces");
    expect(tables).toContain("publish_history");
    expect(tables).toContain("api_config");

    closeDb();
  });

  it("records the applied migration in schema_version", async () => {
    const { getDb, closeDb } = await import("../db");
    const db = getDb();

    const rows = db
      .prepare("SELECT version, name FROM schema_version ORDER BY version")
      .all() as { version: number; name: string }[];

    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0]).toEqual({ version: 1, name: "initial_schema" });

    closeDb();
  });

  it("does not re-apply a migration that was already applied", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const { getDb, closeDb } = await import("../db");
    const db = getDb();

    // Insert a fake topic to prove the DB is functional
    db.prepare("INSERT INTO topics (keyword, source) VALUES (?, ?)").run("test", "manual");
    const count = (db.prepare("SELECT count(*) as c FROM topics").get() as { c: number }).c;
    expect(count).toBe(1);

    closeDb();

    // Re-open — migration should be skipped (idempotent)
    const { getDb: getDb2, closeDb: closeDb2 } = await import("../db");
    const db2 = getDb2();

    // Data should still be there
    const count2 = (db2.prepare("SELECT count(*) as c FROM topics").get() as { c: number }).c;
    expect(count2).toBe(1);

    // The migration log should only have one entry for version 1
    const versions = db2
      .prepare("SELECT version FROM schema_version WHERE version = 1")
      .all();
    expect(versions).toHaveLength(1);

    closeDb2();
    consoleSpy.mockRestore();
  });

  it("closeDb() closes the connection and a subsequent getDb() reopens", async () => {
    const { getDb, closeDb } = await import("../db");
    getDb();
    closeDb();

    // After close, a fresh call should succeed
    const { getDb: getDb2, closeDb: closeDb2 } = await import("../db");
    const db2 = getDb2();
    expect(db2).toBeDefined();

    // Should be able to query
    const tables = db2
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all();
    expect(tables.length).toBeGreaterThan(0);

    closeDb2();
  });

  it("closeDb() is a no-op when no connection exists", async () => {
    const { closeDb } = await import("../db");
    // Should not throw
    expect(() => closeDb()).not.toThrow();
  });

  it("enables WAL journal mode and foreign keys", async () => {
    const { getDb, closeDb } = await import("../db");
    const db = getDb();

    const journalMode = db.pragma("journal_mode", { simple: true });
    expect(journalMode).toBe("wal");

    const fk = db.pragma("foreign_keys", { simple: true });
    expect(fk).toBe(1);

    closeDb();
  });

  it("topics table has the expected columns", async () => {
    const { getDb, closeDb } = await import("../db");
    const db = getDb();

    const columns = db.prepare("PRAGMA table_info(topics)").all() as { name: string }[];
    const colNames = columns.map((c) => c.name);

    expect(colNames).toContain("id");
    expect(colNames).toContain("keyword");
    expect(colNames).toContain("source");
    expect(colNames).toContain("analysis");
    expect(colNames).toContain("status");
    expect(colNames).toContain("created_at");
    expect(colNames).toContain("updated_at");

    closeDb();
  });

  it("content_pieces table has the expected columns", async () => {
    const { getDb, closeDb } = await import("../db");
    const db = getDb();

    const columns = db.prepare("PRAGMA table_info(content_pieces)").all() as { name: string }[];
    const colNames = columns.map((c) => c.name);

    expect(colNames).toContain("id");
    expect(colNames).toContain("topic_id");
    expect(colNames).toContain("platform");
    expect(colNames).toContain("title");
    expect(colNames).toContain("body");
    expect(colNames).toContain("status");
    expect(colNames).toContain("metadata");

    closeDb();
  });

  it("foreign key between content_pieces and topics works", async () => {
    const { getDb, closeDb } = await import("../db");
    const db = getDb();

    // Insert a topic
    const info = db
      .prepare("INSERT INTO topics (keyword, source) VALUES (?, ?)")
      .run("fk-test", "manual");
    const topicId = info.lastInsertRowid;

    // Insert a content piece referencing the topic — should succeed
    expect(() => {
      db.prepare(
        "INSERT INTO content_pieces (topic_id, platform, title, body) VALUES (?, ?, ?, ?)"
      ).run(topicId, "wechat", "Test Title", "Body");
    }).not.toThrow();

    closeDb();
  });
});
