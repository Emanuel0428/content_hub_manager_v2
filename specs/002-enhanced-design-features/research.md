# Research: Multi-Platform Content Management

**Feature ID**: 002-enhanced-design-features  
**Last Updated**: 2025-10-21

## Overview

Research and decisions for building a multi-platform content management system for creators (Twitch, YouTube, TikTok).

---

## Platform Asset Requirements

### Twitch

#### Official Guidelines
- **Emotes**: 28x28, 56x56, 112x112 pixels (PNG, transparent recommended)
- **Badges**: 18x18, 36x36, 72x72 pixels (PNG, transparent)
- **Profile Banner**: 1200x480 pixels
- **Offline Banner**: 1920x1080 pixels
- **Video Player Banner**: 1920x1080 pixels
- **Panels**: 320 pixels wide, height flexible (typically 100-600px)

**Sources**: [Twitch Creator Camp](https://www.twitch.tv/creatorcamp)

### YouTube

#### Official Guidelines
- **Thumbnails**: 1280x720 pixels (min width 640px), under 2MB, JPG/PNG/GIF/BMP
- **Channel Art**: 2560x1440 pixels (safe area: 1546x423)
- **Profile Picture**: 800x800 pixels
- **Watermark**: 150x150 pixels (PNG with transparency)
- **End Screens**: 1920x1080 pixels

**Sources**: [YouTube Help Center](https://support.google.com/youtube)

### TikTok

#### Best Practices
- **Video**: 1080x1920 pixels (9:16 aspect ratio)
- **Profile Picture**: 200x200 pixels
- **Cover Image**: 1080x1920 pixels

**Sources**: [TikTok Creator Portal](https://www.tiktok.com/creators/creator-portal/en-us/)

---

## Technical Decisions

### Database Schema Choice

**Decision**: Add metadata columns to existing `assets` table

**Why**:
- ✅ Simpler than creating separate tables per platform
- ✅ Easier to query all assets with filters
- ✅ Minimal migration complexity
- ❌ Alternative (separate tables) would complicate joins and filtering

**Schema**:
```sql
ALTER TABLE assets ADD COLUMN platform TEXT DEFAULT 'all';
ALTER TABLE assets ADD COLUMN category TEXT;
ALTER TABLE assets ADD COLUMN resolution TEXT;
ALTER TABLE assets ADD COLUMN tags TEXT; -- JSON string
```

### File Storage Organization

**Decision**: Platform-based folder structure

```
/uploads/
  /twitch/emotes/
  /twitch/thumbnails/
  /youtube/thumbnails/
  /tiktok/clips/
```

**Why**:
- ✅ Easy to backup platform-specific assets
- ✅ Clear organization
- ✅ Easy to migrate to cloud storage later (S3 buckets per platform)

### Platform Navigation Pattern

**Decision**: Top navigation tabs (horizontal)

**Why**:
- ✅ Common pattern (Figma, Notion, VS Code use tabs)
- ✅ Clear visual separation
- ✅ Easy to add more platforms later
- ❌ Alternative (sidebar) takes more space

### State Management

**Decision**: React Context for platform state

**Why**:
- ✅ Simple (no external library needed)
- ✅ Good for app-wide platform state
- ✅ Easy to persist to localStorage
- ❌ Alternative (Redux) is overkill for this use case

---

## UI/UX Patterns

### Platform Branding

**Decision**: Use official platform colors as accents

- Twitch: `#9146FF` (purple)
- YouTube: `#FF0000` (red)
- TikTok: `#000000` + `#00F2EA` (black/cyan)

**Application**:
- Active tab highlight
- Platform badges on asset cards
- Category section headers

### Category Display

**Decision**: Tab-based categories within each platform view

**Why**:
- ✅ Reduces visual clutter
- ✅ Familiar pattern
- ✅ Easy to scan
- ❌ Alternative (all categories visible) would be overwhelming

### Empty States

**Best Practice**: Show helpful message + CTA

Example:
```
"No emotes yet!"
"Upload your first emote to get started"
[Upload Emote] button
```

---

## File Validation Strategy

### Approach

**Decision**: Client-side validation before upload

**Validation Rules per Category**:
- Dimensions (e.g., emotes must be 28x28, 56x56, or 112x112)
- File format (e.g., emotes must be PNG)
- File size (e.g., under 1MB)

**Why**:
- ✅ Better UX (immediate feedback)
- ✅ Reduces failed uploads
- ✅ Saves server processing
- ⚠️ Still validate server-side for security

### Implementation
```typescript
function validateEmote(file: File): ValidationResult {
  if (!file.type.includes('png')) return { valid: false, error: 'Must be PNG' };
  // Check dimensions via Image API
  // Check file size
}
```

---

## Performance Considerations

### Asset Loading

**Lazy Loading**: Load assets for active platform/category only

```typescript
useEffect(() => {
  fetchAssets({ platform: activePlatform, category: activeCategory });
}, [activePlatform, activeCategory]);
```

### Thumbnail Generation

**Decision**: Keep existing thumbnail generation from 001

**No changes needed** - existing logic works for all platforms

### Indexing

**Database Indexes**:
```sql
CREATE INDEX idx_assets_platform ON assets(platform);
CREATE INDEX idx_assets_category ON assets(category);
CREATE INDEX idx_assets_platform_category ON assets(platform, category);
```

**Why**: Speeds up filtering queries significantly

---

## Future Extensibility

### Adding New Platforms

**Design**: Platform configs are data-driven

```typescript
// To add Instagram:
export const INSTAGRAM_PLATFORM: PlatformConfig = {
  id: 'instagram',
  name: 'Instagram',
  color: '#E1306C',
  icon: InstagramIcon,
  categories: [
    { id: 'posts', name: 'Posts', dimensions: '1080x1080' },
    { id: 'stories', name: 'Stories', dimensions: '1080x1920' },
    // ...
  ],
};

// Add to registry:
export const PLATFORMS = {
  ...
  instagram: INSTAGRAM_PLATFORM,
};
```

No code changes needed beyond adding config!

### Platform API Integration

**Out of scope for 002**, but planned for 003:
- Direct upload to Twitch (via Twitch API)
- Upload to YouTube (via YouTube Data API)
- Requires OAuth authentication

---

## Open Questions & Decisions

### Q: Should we allow multi-platform tagging?

**Status**: YES  
**Decision**: Assets can have `platform: 'all'` or multiple platforms  
**Rationale**: Some thumbnails work across platforms

### Q: File dimension validation - strict or flexible?

**Status**: Flexible (warnings, not blocks)  
**Rationale**: Creators may have valid reasons for different sizes

### Q: Should we support bulk operations?

**Status**: Deferred to 003  
**Rationale**: Focus on core functionality first

---

## Learnings from Similar Products

### Observed in Streamlabs/StreamElements
- Separate sections for different asset types ✅ Adopt this
- Drag-and-drop upload ✅ Keep from 001
- Quick preview on hover ✅ Keep from 001

### Observed in Canva
- Template system (create from template) ⏳ Future feature
- Resize/export for different platforms ⏳ Future feature

---

## References

- [Twitch Branding Guidelines](https://brand.twitch.tv/)
- [YouTube Creator Resources](https://www.youtube.com/creators/)
- [TikTok Brand Guidelines](https://www.tiktok.com/brand)
- [Figma Community - Platform Icons](https://www.figma.com/community)

---

**Notes**: Update this document as implementation progresses and new decisions are made.
