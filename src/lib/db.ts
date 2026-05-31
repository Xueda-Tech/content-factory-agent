import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "content-factory.db");

let _db: Database.Database | null = null;

/**
 * Get the singleton database connection.
 * Creates the database and runs migrations on first call.
 */
export function getDb(): Database.Database {
  if (_db) return _db;

  // Ensure the data directory exists
  const fs = require("fs") as typeof import("fs");
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  _db = new Database(DB_PATH);

  // Enable WAL mode for better concurrent read performance
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  // Run migrations
  runMigrations(_db);

  return _db;
}

// ---------------------------------------------------------------------------
// Schema & Migrations
// ---------------------------------------------------------------------------

interface Migration {
  version: number;
  name: string;
  up: string;
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: "initial_schema",
    up: `
      -- Track applied migrations
      CREATE TABLE IF NOT EXISTS schema_version (
        version    INTEGER PRIMARY KEY,
        name       TEXT    NOT NULL,
        applied_at TEXT    NOT NULL DEFAULT (datetime('now'))
      );

      -- Topics collected from various sources
      CREATE TABLE IF NOT EXISTS topics (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword    TEXT    NOT NULL,
        source     TEXT    NOT NULL CHECK (source IN ('wechat', 'xiaohongshu', 'manual', 'other')),
        analysis   TEXT,   -- JSON blob for AI analysis results
        status     TEXT    NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'analyzed', 'content_created', 'published')),
        created_at TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_topics_keyword ON topics (keyword);
      CREATE INDEX IF NOT EXISTS idx_topics_status  ON topics (status);

      -- Generated content pieces
      CREATE TABLE IF NOT EXISTS content_pieces (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        topic_id   INTEGER REFERENCES topics (id) ON DELETE SET NULL,
        platform   TEXT    NOT NULL CHECK (platform IN ('wechat', 'xiaohongshu', 'twitter')),
        title      TEXT,
        body       TEXT,   -- Markdown content
        status     TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'editing', 'ready', 'published')),
        metadata   TEXT,   -- JSON blob for platform-specific data
        created_at TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_content_topic_id ON content_pieces (topic_id);
      CREATE INDEX IF NOT EXISTS idx_content_status   ON content_pieces (status);

      -- Publish history / events
      CREATE TABLE IF NOT EXISTS publish_history (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        content_id   INTEGER NOT NULL REFERENCES content_pieces (id) ON DELETE CASCADE,
        platform     TEXT    NOT NULL,
        external_id  TEXT,   -- ID returned by the publishing platform
        url          TEXT,   -- Published URL
        status       TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
        response     TEXT,   -- JSON blob with raw API response
        published_at TEXT    NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_publish_content_id ON publish_history (content_id);

      -- API configuration (keys, endpoints, etc.)
      CREATE TABLE IF NOT EXISTS api_config (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        service    TEXT    NOT NULL UNIQUE, -- 'dajiala', 'xiaohongshu', 'siliconflow'
        config     TEXT    NOT NULL,        -- JSON blob
        updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
];

function runMigrations(db: Database.Database): void {
  // Ensure schema_version table exists first
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version    INTEGER PRIMARY KEY,
      name       TEXT    NOT NULL,
      applied_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = new Set(
    db
      .prepare("SELECT version FROM schema_version")
      .all()
      .map((row: unknown) => (row as { version: number }).version)
  );

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.version)) continue;

    db.transaction(() => {
      db.exec(migration.up);
      db.prepare(
        "INSERT INTO schema_version (version, name) VALUES (?, ?)"
      ).run(migration.version, migration.name);
    })();

    console.log(
      `[db] Applied migration v${migration.version}: ${migration.name}`
    );
  }
}

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

/** Close the database connection (useful in tests / graceful shutdown). */
export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
