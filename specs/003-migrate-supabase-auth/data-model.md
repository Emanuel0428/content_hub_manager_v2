# Data Model: Supabase Integration and Authentication

## Entities

1. User (handled by Supabase Auth)
   - id: uuid (primary, managed by Supabase)
   - email: string (unique, required)
   - display_name: string (optional, from metadata)
   - created_at: timestamp (managed by Supabase)
   - updated_at: timestamp (managed by Supabase)

2. Asset
   - id: uuid (primary)
   - user_id: uuid -> auth.users.id (Supabase Auth reference)
   - name: string (original filename)
   - type: string (asset type, typically 'file')
   - platform_origin: string (twitch, youtube, tiktok)
   - size_bytes: integer (file size)
   - metadata: jsonb (category, originalMimeType, custom fields)
   - created_at: timestamp
   - updated_at: timestamp

3. AssetVersion
   - id: uuid (primary)
   - asset_id: uuid -> Asset.id
   - version_number: integer (default: 1)
   - storage_path: string (filename in Supabase Storage)
   - checksum: string (optional, for integrity verification)
   - created_at: timestamp
   - created_by: uuid -> auth.users.id

## Validation rules

- `User.email` must be a valid email and unique (enforced by Supabase Auth).
- `Asset.platform_origin` must be one of: 'twitch', 'youtube', 'tiktok'.
- `Asset.metadata.category` should match valid categories for the platform.
- `Asset.size_bytes` must be non-negative.
- `AssetVersion.storage_path` must be unique within the bucket.

## State transitions

- Asset: uploading -> available (simple flow, no complex states needed)
- User session: anonymous -> authenticated -> logged_out (handled by Supabase Auth)
