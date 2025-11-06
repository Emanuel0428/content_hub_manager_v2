# Supabase Storage Configuration

This document outlines the actual Supabase Storage configuration implemented for the Content Hub Manager.

## Storage Bucket Configuration

### 1. Assets Bucket Setup

The project uses a single public bucket called `Assets` (with capital A):

**Bucket Settings:**
- **Name**: `Assets` (note the capitalization)
- **Public**: `true` (allows public read access)
- **Created via**: Supabase Dashboard
- **File organization**: Flat structure with original filenames

### 2. Access Configuration

**Public URL Format**: 
```
https://jqhpnmymhjukmxizamvi.supabase.co/storage/v1/object/public/Assets/{filename}
```

**No RLS Policies Required**: Since the bucket is public and we handle authorization at the application level through user authentication before upload.

### 3. File Upload Process

Files are uploaded using the Supabase JavaScript client:
1. Frontend uploads directly to Supabase Storage via `/api/upload` endpoint
2. Backend creates asset metadata in PostgreSQL with reference to storage path
3. Asset versions are tracked in `asset_versions` table with `storage_path` field

## Implementation Details

### Backend Upload Route (`uploadRoutes.js`)
- Uses `@supabase/supabase-js` client
- Uploads to `Assets` bucket
- Returns storage path for metadata creation

### Frontend Upload Widget
- Uses custom `uploadFile()` function in `api.ts`
- Shows upload progress
- Creates asset record after successful upload

### Database Schema
```sql
-- Assets table stores metadata
assets (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  name text,
  platform_origin text,
  metadata jsonb,
  created_at timestamp
)

-- Asset versions track file locations  
asset_versions (
  id uuid PRIMARY KEY,
  asset_id uuid REFERENCES assets,
  storage_path text,  -- Path in Supabase Storage
  version_number integer
)
```

## Environment Configuration

Required environment variables:

**Frontend (.env)**:
```
VITE_SUPABASE_URL=https://jqhpnmymhjukmxizamvi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Backend (.env)**:
```
SUPABASE_URL=https://jqhpnmymhjukmxizamvi.supabase.co  
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Verification

### Test Upload
1. Access application at `http://localhost:5173`
2. Sign in with test user
3. Upload an image file via Upload Widget
4. Verify file appears in Supabase Storage bucket
5. Verify asset metadata created in database
6. Verify thumbnail displays in platform views

### Current Status
- ✅ Storage bucket created and configured
- ✅ Upload functionality working
- ✅ File access via public URLs working  
- ✅ Asset metadata integration complete
- ✅ User isolation implemented (userId filtering)