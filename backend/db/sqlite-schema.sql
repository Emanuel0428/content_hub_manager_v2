BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  platform TEXT,
  category TEXT,
  resolution TEXT,
  width INTEGER,
  height INTEGER,
  tags TEXT,
  description TEXT,
  file_size INTEGER,
  mime_type TEXT,
  folder_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(folder_id) REFERENCES folders(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS asset_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL,
  path TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS checklists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL,
  item_key TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(asset_id, item_key),
  FOREIGN KEY(asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  payload TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- FTS for search with enhanced fields
CREATE VIRTUAL TABLE IF NOT EXISTS assets_fts USING fts5(
  title, 
  category, 
  tags, 
  description,
  content='assets', 
  content_rowid='id'
);

-- Trigger to update FTS
CREATE TRIGGER IF NOT EXISTS assets_ai AFTER INSERT ON assets BEGIN
  INSERT INTO assets_fts(rowid, title, category, tags, description) 
  VALUES (new.id, new.title, new.category, new.tags, new.description);
END;
CREATE TRIGGER IF NOT EXISTS assets_ad AFTER DELETE ON assets BEGIN
  INSERT INTO assets_fts(assets_fts, rowid, title, category, tags, description) 
  VALUES('delete', old.id, old.title, old.category, old.tags, old.description);
END;
CREATE TRIGGER IF NOT EXISTS assets_au AFTER UPDATE ON assets BEGIN
  INSERT INTO assets_fts(assets_fts, rowid, title, category, tags, description) 
  VALUES('delete', old.id, old.title, old.category, old.tags, old.description);
  INSERT INTO assets_fts(rowid, title, category, tags, description) 
  VALUES (new.id, new.title, new.category, new.tags, new.description);
END;

-- Indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_assets_platform_category ON assets(platform, category);
CREATE INDEX IF NOT EXISTS idx_assets_resolution ON assets(resolution);

COMMIT;