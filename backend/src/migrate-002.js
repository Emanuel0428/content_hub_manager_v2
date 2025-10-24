/**
 * Database Migration Script
 * Applies migration 002: Add platform-specific fields
 */

const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, '..', 'db', 'dev.sqlite');
const MIGRATION_FILE = path.join(__dirname, '..', 'db', 'migrations', '002-add-platform-fields.sql');

console.log('Running database migration 002...');
console.log(`Database: ${DB_PATH}`);

// Create db directory if it doesn't exist
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Failed to connect to database:', err.message);
    process.exit(1);
  }
  console.log('Connected to database');
});

// Check if migration was already applied
db.get("PRAGMA table_info(assets)", (err, row) => {
  if (err) {
    console.error('❌ Error checking table schema:', err.message);
    db.close();
    process.exit(1);
  }
});

db.all("PRAGMA table_info(assets)", (err, columns) => {
  if (err) {
    console.error('Error reading table schema:', err.message);
    db.close();
    process.exit(1);
  }

  const hasCategory = columns.some(col => col.name === 'category');
  
  if (hasCategory) {
    console.log('Migration 002 already applied. Skipping.');
    db.close();
    return;
  }

  console.log('Reading migration file...');
  const migrationSQL = fs.readFileSync(MIGRATION_FILE, 'utf8');

  console.log('Executing migration...');
  db.exec(migrationSQL, (err) => {
    if (err) {
      console.error('❌ Migration failed:', err.message);
      db.close();
      process.exit(1);
    }

    console.log('Migration 002 completed successfully!');
    console.log('New columns added to assets table:');
    console.log('   - category (TEXT)');
    console.log('   - resolution (TEXT)');
    console.log('   - width (INTEGER)');
    console.log('   - height (INTEGER)');
    console.log('   - tags (TEXT)');
    console.log('   - description (TEXT)');
    console.log('   - file_size (INTEGER)');
    console.log('   - mime_type (TEXT)');
    console.log('Updated indexes:');
    console.log('   - idx_assets_platform_category');
    console.log('   - idx_assets_resolution');
    console.log('Enhanced FTS table with category, tags, and description');

    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
        process.exit(1);
      }
      console.log('Database migration complete and connection closed.');
    });
  });
});
