import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'social_tracker.db')

declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined
}

export function getDb(): Database.Database {
  if (!global.__db) {
    global.__db = new Database(DB_PATH)
    global.__db.pragma('journal_mode = WAL')
    global.__db.pragma('foreign_keys = ON')
    ensureTables(global.__db)
  }
  return global.__db
}

function ensureTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS platform_connections (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      platform      TEXT NOT NULL UNIQUE,
      access_token  TEXT,
      refresh_token TEXT,
      token_expiry  TEXT,
      account_id    TEXT,
      account_name  TEXT,
      is_connected  INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS content_items (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      platform        TEXT NOT NULL,
      platform_id     TEXT NOT NULL,
      content_type    TEXT NOT NULL,
      title           TEXT,
      description     TEXT,
      url             TEXT,
      thumbnail_url   TEXT,
      published_at    TEXT,
      is_demo         INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(platform, platform_id)
    );
    CREATE TABLE IF NOT EXISTS content_metrics (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      content_item_id INTEGER NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
      views           INTEGER DEFAULT 0,
      likes           INTEGER DEFAULT 0,
      comments        INTEGER DEFAULT 0,
      shares          INTEGER DEFAULT 0,
      saves           INTEGER DEFAULT 0,
      watch_time_sec  INTEGER DEFAULT 0,
      reach           INTEGER DEFAULT 0,
      impressions     INTEGER DEFAULT 0,
      engagement_rate REAL DEFAULT 0.0,
      recorded_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS account_metrics (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      platform        TEXT NOT NULL,
      followers       INTEGER DEFAULT 0,
      following       INTEGER DEFAULT 0,
      total_posts     INTEGER DEFAULT 0,
      total_views     INTEGER DEFAULT 0,
      avg_engagement  REAL DEFAULT 0.0,
      recorded_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS competitors (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      platform        TEXT NOT NULL,
      handle          TEXT NOT NULL,
      display_name    TEXT,
      profile_url     TEXT,
      avatar_url      TEXT,
      notes           TEXT,
      is_active       INTEGER NOT NULL DEFAULT 1,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(platform, handle)
    );
    CREATE TABLE IF NOT EXISTS competitor_metrics (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      competitor_id   INTEGER NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
      followers       INTEGER DEFAULT 0,
      following       INTEGER DEFAULT 0,
      total_posts     INTEGER DEFAULT 0,
      avg_likes       INTEGER DEFAULT 0,
      avg_comments    INTEGER DEFAULT 0,
      engagement_rate REAL DEFAULT 0.0,
      recorded_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS competitor_posts (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      competitor_id    INTEGER NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
      platform_post_id TEXT,
      title            TEXT,
      url              TEXT,
      thumbnail_url    TEXT,
      likes            INTEGER DEFAULT 0,
      comments         INTEGER DEFAULT 0,
      views            INTEGER DEFAULT 0,
      published_at     TEXT,
      fetched_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS transcript_analyses (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      raw_transcript   TEXT NOT NULL,
      title            TEXT,
      platform_targets TEXT NOT NULL DEFAULT '[]',
      analysis_json    TEXT NOT NULL,
      created_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS content_ideas (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      analysis_id      INTEGER NOT NULL REFERENCES transcript_analyses(id) ON DELETE CASCADE,
      platform         TEXT,
      content_type     TEXT,
      title            TEXT NOT NULL,
      hook             TEXT,
      description      TEXT,
      talking_points   TEXT NOT NULL DEFAULT '[]',
      hashtags         TEXT NOT NULL DEFAULT '[]',
      estimated_effort TEXT,
      priority         TEXT,
      is_saved         INTEGER NOT NULL DEFAULT 0,
      created_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS app_settings (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_content_metrics_item ON content_metrics(content_item_id);
    CREATE INDEX IF NOT EXISTS idx_account_metrics_platform ON account_metrics(platform, recorded_at);
    CREATE TABLE IF NOT EXISTS audience_demographics (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      platform    TEXT NOT NULL,
      demo_type   TEXT NOT NULL,
      label       TEXT NOT NULL,
      value       REAL NOT NULL,
      is_demo     INTEGER NOT NULL DEFAULT 0,
      recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_content_items_platform ON content_items(platform, published_at);
    CREATE INDEX IF NOT EXISTS idx_audience_demo_platform ON audience_demographics(platform, demo_type);
  `)

  // Add extended metric columns (idempotent — silently skipped if column already exists)
  const migrations = [
    'ALTER TABLE account_metrics ADD COLUMN dm_count INTEGER DEFAULT 0',
    'ALTER TABLE account_metrics ADD COLUMN website_clicks INTEGER DEFAULT 0',
    'ALTER TABLE account_metrics ADD COLUMN profile_visits INTEGER DEFAULT 0',
    'ALTER TABLE account_metrics ADD COLUMN subscribers_gained INTEGER DEFAULT 0',
    'ALTER TABLE account_metrics ADD COLUMN subscribers_lost INTEGER DEFAULT 0',
    'ALTER TABLE account_metrics ADD COLUMN total_watch_time_hours REAL DEFAULT 0',
    'ALTER TABLE account_metrics ADD COLUMN impressions INTEGER DEFAULT 0',
    'ALTER TABLE account_metrics ADD COLUMN reach INTEGER DEFAULT 0',
    'ALTER TABLE content_metrics ADD COLUMN ctr REAL DEFAULT 0',
    'ALTER TABLE content_metrics ADD COLUMN avg_view_duration_sec INTEGER DEFAULT 0',
    'ALTER TABLE content_metrics ADD COLUMN video_complete_rate REAL DEFAULT 0',
    'ALTER TABLE content_metrics ADD COLUMN profile_visits_from_post INTEGER DEFAULT 0',
  ]
  for (const sql of migrations) {
    try { db.exec(sql) } catch { /* column already exists */ }
  }

  // Seed default platform connection rows
  const seedPlatform = db.prepare(
    `INSERT OR IGNORE INTO platform_connections (platform, is_connected) VALUES (?, 0)`
  )
  seedPlatform.run('youtube')
  seedPlatform.run('instagram')
  seedPlatform.run('facebook')

  // One-time removal of any seeded demo data
  const cleared = (db.prepare(`SELECT value FROM app_settings WHERE key = 'demo_data_cleared'`).get() as { value: string } | undefined)?.value
  if (cleared !== '1') {
    db.exec(`
      DELETE FROM audience_demographics WHERE is_demo = 1;
      DELETE FROM content_items WHERE is_demo = 1;
      DELETE FROM account_metrics;
      DELETE FROM competitors;
      DELETE FROM transcript_analyses WHERE title LIKE 'Demo:%';
    `)
    db.prepare(`INSERT OR REPLACE INTO app_settings (key, value) VALUES ('demo_data_cleared', '1')`).run()
  }
}

export default getDb
