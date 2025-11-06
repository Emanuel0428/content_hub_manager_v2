# API Contracts - SOLID Architecture Refactor

**Version**: 1.0.0  
**Feature**: 004-solid-architecture-refactor

## Overview

This document defines the API contracts for the refactored backend. All contracts are validated using **Zod schemas** which can be exported to JSON Schema for OpenAPI documentation.

---

## Error Response Contract

All error responses follow this consistent structure:

```typescript
{
  error: string;        // Error code (e.g., "VALIDATION_ERROR", "NOT_FOUND")
  message: string;      // Human-readable error message
  details?: object;     // Optional additional error details
  stack?: string;       // Stack trace (development only)
}
```

**HTTP Status Codes:**
- 400: Validation errors, bad requests
- 401: Unauthorized (missing/invalid auth token)
- 403: Forbidden (authenticated but insufficient permissions)
- 404: Not found
- 409: Conflict (duplicate resource)
- 500: Internal server error

---

## Asset Contracts

### Create Asset

**Endpoint**: `POST /api/assets`

**Request Body**:
```typescript
{
  name: string;                    // Required, 1-255 chars
  platform_origin: "twitch" | "youtube" | "tiktok" | "instagram";
  type?: string;                   // Optional, default: "file"
  metadata?: object;               // Optional JSON metadata
  storagePath: string;             // Required, path in Supabase Storage
  size_bytes?: number;             // Optional, positive integer
  userId?: string;                 // Optional, UUID (set by auth middleware)
}
```

**Response** (Success - 200):
```typescript
{
  success: true;
  data: {
    id: string;                    // UUID
    user_id: string;               // UUID
    name: string;
    type: string;
    size_bytes: number | null;
    platform_origin: string;
    metadata: object;
    created_at: string;            // ISO 8601
    updated_at: string;            // ISO 8601
  }
}
```

---

### Get Assets by Platform

**Endpoint**: `GET /api/assets`

**Query Parameters**:
```typescript
{
  platform?: "twitch" | "youtube" | "tiktok" | "instagram";
  category?: string;
  userId?: string;                 // UUID
  page?: number;                   // Pagination (future)
  limit?: number;                  // Pagination (future)
}
```

**Response** (Success - 200):
```typescript
{
  success: true;
  data: Array<{
    id: string;
    user_id: string;
    name: string;
    type: string;
    size_bytes: number | null;
    platform_origin: string;
    metadata: object;
    created_at: string;
    updated_at: string;
    asset_versions?: Array<{
      id: string;
      version_number: number;
      storage_path: string;
      created_at: string;
    }>;
  }>;
}
```

---

### Update Asset Metadata

**Endpoint**: `PATCH /api/assets/:id`

**Request Body**:
```typescript
{
  name?: string;                   // Optional, 1-255 chars
  platform_origin?: "twitch" | "youtube" | "tiktok" | "instagram";
  metadata?: object;               // Optional JSON metadata
}
```

**Response** (Success - 200):
```typescript
{
  success: true;
  data: {
    id: string;
    // ... full asset object
  }
}
```

---

### Delete Asset

**Endpoint**: `DELETE /api/assets/:id`

**Response** (Success - 200):
```typescript
{
  success: true;
  message: "Asset deleted"
}
```

---

## Auth Contracts

### Signup

**Endpoint**: `POST /api/auth/signup`

**Request Body**:
```typescript
{
  email: string;                   // Valid email format
  password: string;                // Min 6 characters
  displayName?: string;            // Optional
}
```

**Response** (Success - 200):
```typescript
{
  success: true;
  message: "User created successfully";
  user: {
    id: string;                    // UUID
    email: string;
    displayName: string | null;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;            // Unix timestamp
  } | null;
}
```

---

### Login

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```typescript
{
  email: string;                   // Valid email format
  password: string;                // Min 6 characters
}
```

**Response** (Success - 200):
```typescript
{
  success: true;
  message: "Login successful";
  user: {
    id: string;
    email: string;
    displayName: string | null;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}
```

---

### Refresh Session

**Endpoint**: `POST /api/auth/refresh`

**Request Body**:
```typescript
{
  refreshToken: string;            // or refresh_token
}
```

**Response** (Success - 200):
```typescript
{
  success: true;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
  user: {
    id: string;
    email: string;
    displayName: string | null;
  };
}
```

---

## Upload Contracts

### Upload File

**Endpoint**: `POST /api/upload`

**Request**: `multipart/form-data`
- Field: `file` (required)
- Max size: 500MB
- Allowed types: images (jpg, png, gif, webp), videos (mp4, webm, mov), documents (pdf)

**Response** (Success - 200):
```typescript
{
  success: true;
  path: string;                    // Storage path
  publicUrl: string;               // Public URL
  filename: string;                // Generated filename
  size: number;                    // Bytes
}
```

---

## Validation Rules

### Asset Validation
- `name`: Required, 1-255 characters
- `platform_origin`: Must be one of: twitch, youtube, tiktok, instagram
- `storagePath`: Required, non-empty string
- `size_bytes`: Positive integer if provided
- `metadata`: Valid JSON object

### Auth Validation
- `email`: Valid email format (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- `password`: Minimum 6 characters
- `displayName`: Optional, max 255 characters

### File Upload Validation
- Max size: 500MB (524,288,000 bytes)
- Allowed MIME types:
  - Images: image/jpeg, image/png, image/gif, image/webp
  - Videos: video/mp4, video/webm, video/quicktime
  - Documents: application/pdf

---

## Zod Schema Export

All schemas are defined in `src/validators/schemas/` and can be exported to JSON Schema using `zod-to-json-schema` library:

```javascript
const { zodToJsonSchema } = require('zod-to-json-schema');
const { createAssetSchema } = require('./src/validators/schemas/assetSchemas');

const jsonSchema = zodToJsonSchema(createAssetSchema, 'CreateAssetSchema');
```

This enables automatic OpenAPI documentation generation.

---

## Contract Testing

All contracts are validated via:
1. **Unit tests**: Zod schema validation tests
2. **Integration tests**: Full API endpoint tests with real requests
3. **Contract tests**: Schema compliance verification

Run contract tests:
```bash
npm run test:contracts
```

---

## Versioning

API contracts follow semantic versioning:
- **Major**: Breaking changes (require client updates)
- **Minor**: New optional fields (backward compatible)
- **Patch**: Documentation/clarification only

Current version: **1.0.0**

---

## Notes

- All timestamps use ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`
- All IDs are UUIDs (v4)
- Authentication uses Bearer tokens in `Authorization` header
- File uploads use `multipart/form-data` with `@fastify/multipart`
- Error responses are consistent across all endpoints (see Error Response Contract)
