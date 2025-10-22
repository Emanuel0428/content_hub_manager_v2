# Data Model: Multi-Platform Content Management

**Feature ID**: 002-enhanced-design-features  
**Last Updated**: 2025-10-21

## Overview

This feature extends the database schema from 001 to support multi-platform asset organization. Assets can be tagged with platform (Twitch, YouTube, TikTok) and category (emotes, thumbnails, etc.).

---

## Database Schema Changes

### Assets Table (Updated)

```sql
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  folder_id TEXT,
  file_size INTEGER,
  mime_type TEXT,
  storage_path TEXT,
  thumbnail_path TEXT,
  upload_date TEXT,
  last_modified TEXT,
  
  -- NEW COLUMNS for v002
  platform TEXT DEFAULT 'all',  -- 'twitch', 'youtube', 'tiktok', 'all'
  category TEXT,                 -- 'emotes', 'thumbnails', 'alerts', etc.
  resolution TEXT,               -- '1920x1080', '28x28', etc.
  tags TEXT,                     -- JSON array: '["animated", "purple"]'
  
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assets_platform ON assets(platform);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_platform_category ON assets(platform, category);
```

### Migration Script

```sql
-- Add new columns to existing assets table
ALTER TABLE assets ADD COLUMN platform TEXT DEFAULT 'all';
ALTER TABLE assets ADD COLUMN category TEXT;
ALTER TABLE assets ADD COLUMN resolution TEXT;
ALTER TABLE assets ADD COLUMN tags TEXT;

-- Create indexes
CREATE INDEX idx_assets_platform ON assets(platform);
CREATE INDEX idx_assets_category ON assets(category);
CREATE INDEX idx_assets_platform_category ON assets(platform, category);
```

---

## TypeScript Interfaces

### Platform Types

```typescript
export type Platform = 'twitch' | 'youtube' | 'tiktok' | 'all';

export interface PlatformConfig {
  id: Platform;
  name: string;
  color: string; // Hex color
  icon: React.ComponentType;
  categories: CategoryConfig[];
}

export interface CategoryConfig {
  id: string;
  name: string;
  dimensions?: string; // e.g., '1920x1080'
  description?: string;
  icon?: React.ComponentType;
  acceptedFormats?: string[]; // e.g., ['image/png', 'image/jpeg']
  maxFileSize?: number; // bytes
}
```

### Asset Type (Updated)

```typescript
export interface Asset {
  id: string;
  name: string;
  folderId?: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  thumbnailPath?: string;
  uploadDate: string;
  lastModified: string;
  
  // NEW FIELDS
  platform: Platform;
  category?: string;
  resolution?: string;
  tags?: string[]; // Parsed from JSON string in DB
}
```

### Upload Context

```typescript
export interface UploadContext {
  platform: Platform;
  category?: string;
  folderId?: string;
}
```

---

## Platform Configurations (Constants)

### Twitch Configuration

```typescript
export const TWITCH_CATEGORIES: CategoryConfig[] = [
  {
    id: 'thumbnails',
    name: 'Stream Thumbnails',
    dimensions: '1920x1080',
    description: 'Thumbnails for VODs and clips',
    acceptedFormats: ['image/png', 'image/jpeg', 'image/webp'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },
  {
    id: 'emotes',
    name: 'Emotes',
    dimensions: '28x28, 56x56, 112x112',
    description: 'Custom channel emotes',
    acceptedFormats: ['image/png'],
    maxFileSize: 1 * 1024 * 1024, // 1MB
  },
  {
    id: 'badges',
    name: 'Subscriber Badges',
    dimensions: '18x18, 36x36, 72x72',
    acceptedFormats: ['image/png'],
  },
  {
    id: 'overlays',
    name: 'Camera Overlays',
    dimensions: 'Variable (PNG with transparency)',
    acceptedFormats: ['image/png'],
  },
  {
    id: 'alerts',
    name: 'Alerts & Animations',
    dimensions: 'Variable',
    description: 'Sub/follow/donation alerts',
    acceptedFormats: ['image/png', 'image/gif', 'video/webm'],
  },
  {
    id: 'panels',
    name: 'Info Panels',
    dimensions: '320x100',
    description: 'Channel panels (Schedule, Socials, etc.)',
    acceptedFormats: ['image/png', 'image/jpeg'],
  },
  {
    id: 'offline',
    name: 'Offline Banner',
    dimensions: '1920x1080',
    acceptedFormats: ['image/png', 'image/jpeg'],
  },
];

export const TWITCH_PLATFORM: PlatformConfig = {
  id: 'twitch',
  name: 'Twitch',
  color: '#9146FF',
  icon: TwitchIcon,
  categories: TWITCH_CATEGORIES,
};
```

### YouTube Configuration

```typescript
export const YOUTUBE_CATEGORIES: CategoryConfig[] = [
  {
    id: 'thumbnails',
    name: 'Video Thumbnails',
    dimensions: '1280x720',
    description: 'Custom video thumbnails',
    acceptedFormats: ['image/png', 'image/jpeg'],
    maxFileSize: 2 * 1024 * 1024,
  },
  {
    id: 'banner',
    name: 'Channel Art',
    dimensions: '2560x1440',
    description: 'Channel banner',
    acceptedFormats: ['image/png', 'image/jpeg'],
  },
  {
    id: 'endscreens',
    name: 'End Screens',
    dimensions: '1920x1080',
    acceptedFormats: ['image/png'],
  },
  {
    id: 'watermark',
    name: 'Channel Watermark',
    dimensions: '150x150',
    acceptedFormats: ['image/png'],
  },
];

export const YOUTUBE_PLATFORM: PlatformConfig = {
  id: 'youtube',
  name: 'YouTube',
  color: '#FF0000',
  icon: YouTubeIcon,
  categories: YOUTUBE_CATEGORIES,
};
```

### TikTok Configuration

```typescript
export const TIKTOK_CATEGORIES: CategoryConfig[] = [
  {
    id: 'thumbnails',
    name: 'Video Thumbnails',
    dimensions: '1080x1920 (9:16)',
    description: 'Vertical video thumbnails',
    acceptedFormats: ['image/png', 'image/jpeg'],
  },
  {
    id: 'profile',
    name: 'Profile Image',
    dimensions: '200x200',
    acceptedFormats: ['image/png', 'image/jpeg'],
  },
  {
    id: 'clips',
    name: 'Video Clips',
    dimensions: '1080x1920',
    acceptedFormats: ['video/mp4'],
  },
];

export const TIKTOK_PLATFORM: PlatformConfig = {
  id: 'tiktok',
  name: 'TikTok',
  color: '#000000',
  icon: TikTokIcon,
  categories: TIKTOK_CATEGORIES,
};
```

### All Platforms Registry

```typescript
export const PLATFORMS: Record<Platform, PlatformConfig> = {
  twitch: TWITCH_PLATFORM,
  youtube: YOUTUBE_PLATFORM,
  tiktok: TIKTOK_PLATFORM,
  all: {
    id: 'all',
    name: 'All Platforms',
    color: '#6B7280',
    icon: AllPlatformsIcon,
    categories: [],
  },
};
```

---

## API Request/Response Types

### Upload Asset Request

```typescript
interface UploadAssetRequest {
  file: File;
  name?: string;
  platform: Platform;
  category?: string;
  folderId?: string;
  tags?: string[];
}
```

### Update Asset Metadata Request

```typescript
interface UpdateAssetMetadataRequest {
  platform?: Platform;
  category?: string;
  resolution?: string;
  tags?: string[];
}
```

### Get Assets Query Params

```typescript
interface GetAssetsParams {
  platform?: Platform;
  category?: string;
  folderId?: string;
  search?: string;
  sortBy?: 'name' | 'uploadDate' | 'fileSize';
  sortOrder?: 'asc' | 'desc';
}
```

### Get Platforms Response

```typescript
interface GetPlatformsResponse {
  platforms: {
    id: Platform;
    name: string;
    categories: Array<{
      id: string;
      name: string;
      dimensions?: string;
    }>;
  }[];
}
```

---

## File Storage Organization

### Directory Structure

```
/uploads/
  /twitch/
    /thumbnails/
      asset-id-1.png
    /emotes/
      asset-id-2.png
    /badges/
    /overlays/
    /alerts/
    /panels/
    /offline/
  /youtube/
    /thumbnails/
    /banner/
    /endscreens/
    /watermark/
  /tiktok/
    /thumbnails/
    /profile/
    /clips/
  /all/
    (assets not specific to any platform)
```

### Storage Path Pattern

```typescript
const storagePath = `/uploads/${platform}/${category}/${assetId}.${ext}`;
// Example: /uploads/twitch/emotes/abc-123.png
```

---

## Summary

### Database Changes
- ✅ Add 4 new columns to `assets` table
- ✅ Create 2 indexes for query performance
- ✅ Migration script for existing data

### Type Definitions
- ✅ Platform and Category configs
- ✅ Updated Asset interface
- ✅ Upload and query types

### Storage
- ✅ Platform-based folder organization
- ✅ Category subfolders within platforms

**No breaking changes to existing 001 functionality.**

---

## Frontend Data Structures (TypeScript Interfaces)

While no database changes are needed, we define TypeScript types for UI state and component props.

### Design Tokens (tokens.ts)

```typescript
export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface DesignTokens {
  colors: {
    primary: ColorScale;
    secondary: ColorScale;
    neutral: ColorScale;
    success: ColorScale;
    error: ColorScale;
    warning: ColorScale;
    info: ColorScale;
  };
  fontSize: {
    xs: [string, { lineHeight: string }];
    sm: [string, { lineHeight: string }];
    base: [string, { lineHeight: string }];
    lg: [string, { lineHeight: string }];
    xl: [string, { lineHeight: string }];
    '2xl': [string, { lineHeight: string }];
    '3xl': [string, { lineHeight: string }];
    '4xl': [string, { lineHeight: string }];
  };
  spacing: Record<string, string>;
  borderRadius: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    full: string;
  };
  shadows: {
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
}
```

### Animation Presets (animations.ts)

```typescript
export interface AnimationPreset {
  duration: string;
  timingFunction: string;
  delay?: string;
}

export interface AnimationPresets {
  fadeIn: AnimationPreset;
  fadeOut: AnimationPreset;
  slideInUp: AnimationPreset;
  slideInDown: AnimationPreset;
  slideInLeft: AnimationPreset;
  slideInRight: AnimationPreset;
  scaleIn: AnimationPreset;
  scaleOut: AnimationPreset;
  spin: AnimationPreset;
}

export type AnimationName = keyof AnimationPresets;
```

### Component Props Types

#### Button Component

```typescript
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}
```

#### Input Component

```typescript
export type InputState = 'default' | 'focus' | 'error' | 'success' | 'disabled';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

#### Card Component

```typescript
export type CardVariant = 'default' | 'outlined' | 'elevated';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  clickable?: boolean;
}
```

#### Skeleton Component

```typescript
export type SkeletonVariant = 'text' | 'circular' | 'rectangular';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  animation?: boolean;
}
```

#### Toast/Notification

```typescript
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number; // milliseconds
  dismissible?: boolean;
}

export interface ToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}
```

---

## UI State Management

### Loading States

```typescript
export interface LoadingState {
  isLoading: boolean;
  loadingText?: string;
  progress?: number; // 0-100 for progress bars
}
```

### Error States

```typescript
export interface ErrorState {
  hasError: boolean;
  errorMessage?: string;
  errorType?: 'validation' | 'network' | 'server' | 'unknown';
  canRetry?: boolean;
  retryAction?: () => void;
}
```

### Empty States

```typescript
export interface EmptyState {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

---

## Breakpoint System

```typescript
export const breakpoints = {
  mobile: '(max-width: 639px)',
  tablet: '(min-width: 640px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
} as const;

export type Breakpoint = keyof typeof breakpoints;
```

---

## Accessibility Attributes (ARIA)

### Common ARIA Props

```typescript
export interface AriaProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-hidden'?: boolean;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
  'aria-pressed'?: boolean;
  'aria-selected'?: boolean;
  'aria-checked'?: boolean | 'mixed';
  'aria-disabled'?: boolean;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
  role?: string;
}
```

---

## Theme Context (Enhanced)

```typescript
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  prefersReducedMotion: boolean;
  // Future: colorScheme, customColors, etc.
}
```

---

## Summary

This data model document primarily defines **TypeScript interfaces and types** for UI components and states. There are:

- ❌ No database schema changes
- ❌ No new API endpoints
- ❌ No backend data models
- ✅ Frontend type definitions for better DX
- ✅ Design token structures
- ✅ Component prop interfaces
- ✅ UI state types

**All data persistence remains as defined in `001-content-platform-dashboard`.**

---

**References**:
- See `001-content-platform-dashboard/data-model.md` for backend schema
- See `spec.md` for component requirements
- See `tokens.ts` (to be created) for actual token values
