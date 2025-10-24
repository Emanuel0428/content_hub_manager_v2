-- Migration 002: Add platform-specific fields for multi-platform content management
-- Run this migration to add category, resolution, dimensions, and tags to assets table

BEGIN TRANSACTION;

-- Add new columns to assets table
ALTER TABLE assets ADD COLUMN category TEXT;
ALTER TABLE assets ADD COLUMN resolution TEXT;
ALTER TABLE assets ADD COLUMN width INTEGER;
ALTER TABLE assets ADD COLUMN height INTEGER;
ALTER TABLE assets ADD COLUMN tags TEXT; -- JSON array stored as text
ALTER TABLE assets ADD COLUMN description TEXT;
ALTER TABLE assets ADD COLUMN file_size INTEGER;
ALTER TABLE assets ADD COLUMN mime_type TEXT;

-- Update FTS to include new searchable fields
DROP TRIGGER IF EXISTS assets_ai;
DROP TRIGGER IF EXISTS assets_ad;
DROP TRIGGER IF EXISTS assets_au;
DROP TABLE IF EXISTS assets_fts;

CREATE VIRTUAL TABLE assets_fts USING fts5(
  title, 
  category, 
  tags, 
  description,
  content='assets', 
  content_rowid='id'
);

-- Recreate triggers for FTS with new fields
CREATE TRIGGER assets_ai AFTER INSERT ON assets BEGIN
  INSERT INTO assets_fts(rowid, title, category, tags, description) 
  VALUES (new.id, new.title, new.category, new.tags, new.description);
END;

CREATE TRIGGER assets_ad AFTER DELETE ON assets BEGIN
  INSERT INTO assets_fts(assets_fts, rowid, title, category, tags, description) 
  VALUES('delete', old.id, old.title, old.category, old.tags, old.description);
END;

CREATE TRIGGER assets_au AFTER UPDATE ON assets BEGIN
  INSERT INTO assets_fts(assets_fts, rowid, title, category, tags, description) 
  VALUES('delete', old.id, old.title, old.category, old.tags, old.description);
  INSERT INTO assets_fts(rowid, title, category, tags, description) 
  VALUES (new.id, new.title, new.category, new.tags, new.description);
END;

-- Create index for faster filtering by platform and category
CREATE INDEX IF NOT EXISTS idx_assets_platform_category ON assets(platform, category);
CREATE INDEX IF NOT EXISTS idx_assets_resolution ON assets(resolution);

COMMIT;
