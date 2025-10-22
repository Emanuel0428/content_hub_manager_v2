# Specification: Multi-Platform Content Management

**Feature ID**: 002-enhanced-design-features  
**Version**: 1.0  
**Last Updated**: 2025-10-21

## 1. Introduction

### 1.1 Purpose
Transform the generic asset manager into a multi-platform content management system tailored for content creators who produce content for Twitch, YouTube, TikTok, and other platforms.

### 1.2 Background
Content creators need to manage different types of assets for different platforms. A Twitch streamer needs emotes, sub alerts, overlays, and thumbnails. A YouTuber needs channel art, thumbnails, and end screens. This feature creates dedicated workspaces for each platform with relevant asset categories.

### 1.3 Vision
Each platform (Twitch, YouTube, TikTok) gets its own dedicated view with:
- Platform-specific asset categories
- Optimized layout for that platform's workflow
- Easy navigation between platforms
- Isolated asset organization

## 2. Requirements

### 2.1 Platform Navigation System

#### 2.1.1 Platform Switcher
- Main navigation bar with platform tabs/pills (Twitch, YouTube, TikTok, +)
- Active platform indication (highlighted tab)
- Smooth transition when switching platforms
- Persistent platform selection (localStorage)

#### 2.1.2 Platform Icons & Branding
- Official platform colors and icons
- Twitch: Purple (#9146FF)
- YouTube: Red (#FF0000)
- TikTok: Black/Cyan (#000000, #00F2EA)

### 2.2 Platform-Specific Views

Each platform has a dedicated view component with its own layout and categories.

#### 2.2.1 Twitch View
**Asset Categories**:
- 📺 **Stream Thumbnails**: 1920x1080px thumbnails for VODs/clips
- 😊 **Emotes**: 28x28, 56x56, 112x112px custom emotes
- 🎭 **Badges**: Custom subscriber/bit badges
- 🖼️ **Camera Overlays**: PNG overlays for webcam
- 🎉 **Alerts**: Sub/follow/donation alert graphics and animations
- 📋 **Panels**: Info panel images (Schedule, Socials, About)
- 🎨 **Offline Banner**: 1920x1080px offline screen

**Layout**: Grid view with category sections or tabs

#### 2.2.2 YouTube View
**Asset Categories**:
- 🎬 **Thumbnails**: 1280x720px video thumbnails
- 🖼️ **Channel Art**: 2560x1440px banner
- 🎯 **End Screens**: End screen elements and templates
- 💧 **Watermarks**: Channel watermark/logo
- 📺 **Video Assets**: Intros, outros, B-roll clips

**Layout**: Grid view with category sections

#### 2.2.3 TikTok View
**Asset Categories**:
- 📱 **Video Thumbnails**: Vertical thumbnails
- 👤 **Profile Images**: Profile picture/banner
- 🎥 **Video Clips**: Short-form video assets
- 🎨 **Overlays**: Text overlays, stickers

**Layout**: Vertical-optimized grid

### 2.3 Asset Organization & Metadata

#### 2.3.1 Asset Tagging System
Each asset has metadata:
```typescript
{
  id: string;
  name: string;
  platform: 'twitch' | 'youtube' | 'tiktok' | 'all';
  category: string; // e.g., 'emotes', 'thumbnails', 'alerts'
  resolution?: string; // e.g., '1920x1080', '28x28'
  tags?: string[]; // custom tags
  uploadedAt: Date;
  fileSize: number;
  mimeType: string;
  url: string;
}
```

#### 2.3.2 Folder Structure
```
/uploads/
  /twitch/
    /thumbnails/
    /emotes/
    /badges/
    /overlays/
    /alerts/
    /panels/
  /youtube/
    /thumbnails/
    /channel-art/
    /end-screens/
    /watermarks/
  /tiktok/
    /thumbnails/
    /profile/
    /clips/
```

#### 2.3.3 Filtering & Searching
- Filter by platform
- Filter by category within platform
- Search by name/tags
- Sort by date, name, size

### 2.4 UI Components

#### 2.4.1 PlatformNavigator Component
```tsx
<PlatformNavigator 
  activePlatform="twitch"
  onPlatformChange={(platform) => {...}}
/>
```
- Horizontal tabs or sidebar navigation
- Platform icons + labels
- Active state styling

#### 2.4.2 PlatformView Component (per platform)
```tsx
<TwitchView />
<YouTubeView />
<TikTokView />
```
Each view contains:
- Category tabs or sections
- Asset grid for selected category
- Upload widget (filtered to platform/category)
- Asset preview modal

#### 2.4.3 CategorySection Component
```tsx
<CategorySection
  platform="twitch"
  category="emotes"
  title="Emotes"
  description="28x28, 56x56, 112x112px"
  icon={<EmojiIcon />}
/>
```

#### 2.4.4 AssetCard Component (Enhanced)
```tsx
<AssetCard
  asset={asset}
  showPlatformBadge={true}
  showCategory={true}
/>
```
- Displays platform icon badge
- Shows category label
- Resolution info overlay

### 2.5 Upload Workflow

#### 2.5.1 Context-Aware Upload
When uploading in a specific platform view:
- Auto-tag with current platform
- Auto-tag with current category (if selected)
- Show platform-specific file requirements
- Validate dimensions/size per category

#### 2.5.2 Multi-Platform Upload
Option to tag asset for multiple platforms (e.g., generic thumbnail for all platforms)

### 2.6 Backend Changes

#### 2.6.1 Database Schema Updates
Add to `assets` table:
```sql
ALTER TABLE assets ADD COLUMN platform TEXT DEFAULT 'all';
ALTER TABLE assets ADD COLUMN category TEXT;
ALTER TABLE assets ADD COLUMN resolution TEXT;
ALTER TABLE assets ADD COLUMN tags TEXT; -- JSON array
```

#### 2.6.2 API Endpoints (New/Updated)

**GET /api/assets?platform={platform}&category={category}**
- Filter assets by platform and category

**PATCH /api/assets/:id**
- Update asset metadata (platform, category, tags)

**GET /api/platforms**
- List available platforms and their categories

## 3. Technical Approach

### 3.1 Technology Stack (No Changes)
- React 18+ with TypeScript
- Vite for build/dev
- Tailwind CSS for styling
- Existing backend (Node.js + SQLite)

### 3.2 Component Architecture

```
App.tsx
├── PlatformNavigator (NEW)
├── PlatformViewContainer (NEW)
│   ├── TwitchView (NEW)
│   │   ├── CategoryNav
│   │   └── AssetGrid (filtered by platform+category)
│   ├── YouTubeView (NEW)
│   │   ├── CategoryNav
│   │   └── AssetGrid
│   └── TikTokView (NEW)
│       ├── CategoryNav
│       └── AssetGrid
├── AssetPreview (ENHANCED - show platform/category)
└── UploadWidget (ENHANCED - platform/category context)
```

### 3.3 State Management

```typescript
interface AppState {
  activePlatform: Platform; // 'twitch' | 'youtube' | 'tiktok'
  activeCategory: string | null; // 'emotes', 'thumbnails', etc.
  assets: Asset[]; // filtered by platform+category
  uploadContext: {
    platform: Platform;
    category?: string;
  };
}
```

### 3.4 File Structure (Frontend)

```
frontend/src/
  components/
    platform/
      PlatformNavigator.tsx (NEW)
      PlatformViewContainer.tsx (NEW)
      TwitchView.tsx (NEW)
      YouTubeView.tsx (NEW)
      TikTokView.tsx (NEW)
      CategorySection.tsx (NEW)
    AssetCard.tsx (ENHANCED)
    AssetList.tsx (ENHANCED)
    UploadWidget.tsx (ENHANCED)
  types/
    platform.ts (NEW)
  constants/
    platforms.ts (NEW - platform configs)
  hooks/
    usePlatform.ts (NEW)
    useAssetFilter.ts (NEW)
```

### 3.5 Backend Changes

**Database Migration**:
```sql
-- Add new columns to assets table
ALTER TABLE assets ADD COLUMN platform TEXT DEFAULT 'all';
ALTER TABLE assets ADD COLUMN category TEXT;
ALTER TABLE assets ADD COLUMN resolution TEXT;
ALTER TABLE assets ADD COLUMN tags TEXT; -- JSON string
CREATE INDEX idx_assets_platform ON assets(platform);
CREATE INDEX idx_assets_category ON assets(category);
```

**API Routes** (add to existing server):
- `GET /api/assets?platform=twitch&category=emotes`
- `PATCH /api/assets/:id` (update metadata)
- `GET /api/platforms` (return platform config)

## 4. User Stories

### US-001: Platform-Specific Workspace
**As a** Twitch streamer  
**I want** a dedicated Twitch view with relevant asset categories  
**So that** I can easily manage emotes, alerts, overlays without clutter

**Acceptance Criteria**:
- Twitch tab in navigation
- Twitch view shows only Twitch-specific categories
- Can upload assets tagged as Twitch

### US-002: Easy Platform Switching
**As a** multi-platform creator  
**I want** to switch between Twitch, YouTube, TikTok views quickly  
**So that** I can manage content for each platform independently

**Acceptance Criteria**:
- Platform switcher in main navigation
- Clicking a platform loads that platform's view
- Views are isolated (Twitch emotes don't show in YouTube view)

### US-003: Asset Categorization
**As a** content creator  
**I want** assets organized by type (emotes, thumbnails, alerts)  
**So that** I can find the right asset quickly

**Acceptance Criteria**:
- Categories displayed as tabs or sections
- Filtering by category works
- Upload widget allows selecting category

### US-004: Context-Aware Upload
**As a** user uploading an emote  
**I want** it automatically tagged as Twitch/Emotes  
**So that** I don't have to manually categorize every file

**Acceptance Criteria**:
- Upload in Twitch/Emotes auto-tags with platform and category
- Can override tags if needed
- Upload validates dimensions/format per category

### US-005: Asset Metadata Display
**As a** user browsing assets  
**I want** to see which platform and category each asset belongs to  
**So that** I understand the asset's purpose at a glance

**Acceptance Criteria**:
- Asset cards show platform badge (Twitch icon)
- Asset cards show category label
- Resolution info visible on hover/preview

## 5. Testing Strategy

### 5.1 Functional Testing
- Platform switching works correctly
- Asset filtering by platform and category
- Upload with auto-tagging
- Asset metadata updates
- Search and filter combinations

### 5.2 UI Testing
- All platform views render correctly
- Category sections display properly
- Platform branding (colors, icons) accurate
- Responsive layout on different screen sizes

### 5.3 Data Integrity
- Existing assets from 001 migrate correctly
- New metadata fields populate correctly
- No data loss during migration

### 5.4 Cross-Browser Testing
- Chrome, Firefox, Edge (latest versions)
- Basic mobile browser testing

## 6. Migration & Rollout

### 6.1 Database Migration
- Run migration script to add new columns
- Existing assets default to `platform: 'all'`
- Create indexes for performance

### 6.2 Phased Implementation
- **Phase 1**: Database schema + backend API updates
- **Phase 2**: Platform navigation component
- **Phase 3**: Twitch view (first platform)
- **Phase 4**: YouTube view
- **Phase 5**: TikTok view
- **Phase 6**: Enhanced upload workflow
- **Phase 7**: Testing and polish

### 6.3 Backward Compatibility
- All existing upload/preview functionality continues working
- Untagged assets remain accessible in all platform views
- Users can manually tag old assets

## 7. Documentation

### 7.1 User Guide
- How to switch platforms
- How to upload platform-specific assets
- Asset organization best practices
- Category explanations (dimensions, use cases)

### 7.2 Developer Documentation
- Platform configuration structure
- Adding new platforms
- Component API documentation

## 8. Platform Configurations

### 8.1 Twitch
```typescript
{
  id: 'twitch',
  name: 'Twitch',
  color: '#9146FF',
  icon: TwitchIcon,
  categories: [
    { id: 'thumbnails', name: 'Stream Thumbnails', dimensions: '1920x1080' },
    { id: 'emotes', name: 'Emotes', dimensions: '28x28, 56x56, 112x112' },
    { id: 'badges', name: 'Badges', dimensions: '18x18, 36x36, 72x72' },
    { id: 'overlays', name: 'Camera Overlays', dimensions: 'Variable PNG' },
    { id: 'alerts', name: 'Alerts', dimensions: 'Variable' },
    { id: 'panels', name: 'Panels', dimensions: '320x100' },
    { id: 'offline', name: 'Offline Banner', dimensions: '1920x1080' },
  ]
}
```

### 8.2 YouTube
```typescript
{
  id: 'youtube',
  name: 'YouTube',
  color: '#FF0000',
  icon: YouTubeIcon,
  categories: [
    { id: 'thumbnails', name: 'Thumbnails', dimensions: '1280x720' },
    { id: 'banner', name: 'Channel Art', dimensions: '2560x1440' },
    { id: 'endscreens', name: 'End Screens', dimensions: '1920x1080' },
    { id: 'watermark', name: 'Watermark', dimensions: '150x150' },
  ]
}
```

### 8.3 TikTok
```typescript
{
  id: 'tiktok',
  name: 'TikTok',
  color: '#000000',
  icon: TikTokIcon,
  categories: [
    { id: 'thumbnails', name: 'Thumbnails', dimensions: '1080x1920 (vertical)' },
    { id: 'profile', name: 'Profile Image', dimensions: '200x200' },
    { id: 'clips', name: 'Video Clips', dimensions: '1080x1920' },
  ]
}
```

## 9. Open Questions

- [ ] Should we support custom platforms (user-defined)?
- [ ] Do we need bulk tagging for existing assets?
- [ ] Should there be an "All Platforms" view?
- [ ] File validation per category (enforce dimensions)?

## 10. Future Considerations

Items for future specs:
- Direct upload to platforms via API (Twitch/YouTube API)
- Template system (create from templates)
- Collaboration features (team workspaces)
- Asset version history per platform
- Analytics (most used assets, etc.)
- AI-powered tagging suggestions
- Cross-platform asset conversion
