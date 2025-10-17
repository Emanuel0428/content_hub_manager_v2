```markdown
# Data Model: 001-content-platform-dashboard

## Entities

### Asset
- id: uuid
- name: string
- type: enum {image, video, audio, document}
- size_bytes: integer
- platform_origin: enum {twitch, tiktok, youtube, instagram, local}
- versions: relation -> AssetVersion[]
- metadata: json (title, description, tags, aspect_ratio, duration_seconds)
- created_at / updated_at

### AssetVersion
- id: uuid
- asset_id: uuid
- version_number: integer
- storage_path: string (object storage path or filesystem)
- checksum: string
- created_at: datetime
- created_by: user_id

### PlatformAccount
- id: uuid
- user_id: uuid
- platform: enum
- account_name: string
- connection_status: enum {connected, disconnected}

### Folder
- id: uuid
- user_id: uuid
- name: string
- parent_folder_id: nullable uuid
- asset_ids: relation -> Asset[]

### ChecklistItem
- id: uuid
- asset_id: uuid
- platform: enum
- description: string
- required: boolean
- status: enum {pending, completed}

### User
- id: uuid
- name: string
- roles: enum {creator, editor, admin}

## Notes / Validation Rules
- Title length and aspect ratio validation are platform-specific. Enforce at upload/metadata edit time.
- Version increments when user uploads a new file for the same logical asset.
- Use SQLite for storing metadata and versioning; blobs stored in object storage.

## Search & Indexing Notes

- Client-side indexing (e.g., Fuse.js or Lunr) will provide instant filtering for typical per-user datasets (<=1,000 assets). Store precomputed searchable fields in metadata to accelerate indexing.
- For larger datasets or cross-user/global search, use SQLite FTS (full-text search) or a small dedicated search service. Design schema so key searchable fields are duplicated into an FTS table for fast server-side queries.

See `contracts/sqlite-schema.sql` for a concise SQLite schema and FTS setup used by the MVP (assets table + assets_fts virtual table and triggers).

## Uploads & Storage Mapping

- Resumable uploads will follow the tus protocol. Backend will map completed uploads to `AssetVersion.storage_path` and compute checksums on completion. Temporary upload state tracked separately until commit.


``` 
