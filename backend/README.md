# Content Hub Manager - Backend

Backend API server for the Content Hub Manager platform.

## Setup

```bash
npm install
```

## Configuration

Copy `.env.staging.example` to `.env.staging` and configure:

```bash
cp ../.env.staging.example .env.staging
```

Required environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key for client operations
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key for admin operations

## Supabase Service Role Key Security

⚠️ **CRITICAL SECURITY NOTICE**: The service role key bypasses all Row Level Security (RLS) policies.

### Usage Guidelines

**DO USE service role for:**
- Migration scripts (`scripts/migrateToSupabase.js`)
- Admin operations requiring elevated permissions
- Batch operations that need to bypass user-level restrictions
- System maintenance tasks

**DO NOT USE service role for:**
- User-facing API endpoints
- Client-side operations
- Any operation where user context matters
- General application logic

### Implementation Pattern

```javascript
// For user operations - respects RLS
const { getSupabaseClient } = require('./src/config/supabaseClient');
const supabase = getSupabaseClient();

// For admin operations - bypasses RLS
const { getSupabaseServiceClient } = require('./src/config/supabaseClient');
const supabaseAdmin = getSupabaseServiceClient();
```

### Storage Bucket Access

Service role client is required for:
- Creating storage buckets
- Setting bucket policies
- Admin file operations during migration
- Bulk upload/download operations

Anonymous client handles:
- User file uploads (with RLS enforcement)
- Public file access (based on bucket policy)
- User-scoped file operations

## Development

```bash
npm run dev
```

## Migration Scripts

```bash
# Test migration without actual changes
npm run migrate:dry-run

# Execute migration to Supabase
npm run migrate:run

# Create snapshot before migration
npm run migration:snapshot

# Rollback if migration fails
npm run migration:rollback
```