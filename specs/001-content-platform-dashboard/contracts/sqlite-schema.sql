-- SQLite schema for Content Hub Manager (MVP)

PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  roles TEXT NOT NULL -- comma-separated roles for simplicity
);

CREATE TABLE platform_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  platform TEXT NOT NULL,
  account_name TEXT,
  connection_status TEXT,
  UNIQUE(user_id, platform, account_name)
);

CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size_bytes INTEGER,
  platform_origin TEXT,
  metadata JSON,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE asset_versions (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL REFERENCES assets(id),
  version_number INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  checksum TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  created_by TEXT
);

CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  parent_id TEXT REFERENCES folders(id)
);

CREATE TABLE folder_assets (
  folder_id TEXT NOT NULL REFERENCES folders(id),
  asset_id TEXT NOT NULL REFERENCES assets(id),
  PRIMARY KEY (folder_id, asset_id)
);

CREATE TABLE checklist_items (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL REFERENCES assets(id),
  platform TEXT,
  description TEXT,
  required INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending'
);

-- Full Text Search virtual table for assets (search over name and metadata)
CREATE VIRTUAL TABLE assets_fts USING fts5(name, metadata, content='assets', content_rowid='rowid');

-- Trigger to keep FTS in sync (simple approach)
CREATE TRIGGER assets_ai AFTER INSERT ON assets BEGIN
  INSERT INTO assets_fts(rowid, name, metadata) VALUES (new.rowid, new.name, json_extract(new.metadata, '$'));
END;
CREATE TRIGGER assets_ad AFTER DELETE ON assets BEGIN
  INSERT INTO assets_fts(assets_fts, rowid, name, metadata) VALUES('delete', old.rowid, old.name, json_extract(old.metadata, '$'));
END;
CREATE TRIGGER assets_au AFTER UPDATE ON assets BEGIN
  INSERT INTO assets_fts(assets_fts, rowid, name, metadata) VALUES('delete', old.rowid, old.name, json_extract(old.metadata, '$'));
  INSERT INTO assets_fts(rowid, name, metadata) VALUES (new.rowid, new.name, json_extract(new.metadata, '$'));
END;

-- Simple events table for auditing
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  event_type TEXT,
  payload JSON,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX idx_assets_user ON assets(user_id);
CREATE INDEX idx_assets_platform ON assets(platform_origin);
CREATE INDEX idx_asset_versions_asset ON asset_versions(asset_id);
CREATE INDEX idx_folders_user ON folders(user_id);
