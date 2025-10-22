# Tasks: Multi-Platform Content Management

**Feature ID**: 002-enhanced-design-features  
**Last Updated**: 2025-10-21

---

## Phase 1: Database & Backend (Foundation)

### Task 1.1: Database Schema Update
- [ ] Create migration script for new columns (`platform`, `category`, `resolution`, `tags`)
- [ ] Add indexes for `platform` and `category`
- [ ] Test migration with existing data from 001
- [ ] Verify backward compatibility

**Estimated**: 3 hours

### Task 1.2: Backend API Updates
- [ ] Update `GET /api/assets` to support `?platform=` and `?category=` filters
- [ ] Update `POST /api/assets` to accept platform/category metadata
- [ ] Add `PATCH /api/assets/:id` for updating metadata
- [ ] Add `GET /api/platforms` endpoint (returns platform configs)
- [ ] Test all endpoints with Postman/cURL

**Estimated**: 4 hours

### Task 1.3: File Storage Organization
- [ ] Create platform-based folder structure (`/uploads/twitch/`, `/youtube/`, etc.)
- [ ] Update upload logic to save files in platform/category folders
- [ ] Test file upload with platform context
- [ ] Verify file paths in database

**Estimated**: 2 hours

---

## Phase 2: Platform Configuration (Frontend)

### Task 2.1: Type Definitions
- [ ] Create `types/platform.ts` with Platform, PlatformConfig, CategoryConfig types
- [ ] Create `types/asset.ts` with updated Asset interface (platform, category fields)
- [ ] Export all types

**Estimated**: 1 hour

### Task 2.2: Platform Constants
- [ ] Create `constants/platforms.ts`
- [ ] Define Twitch platform config (categories, colors, dimensions)
- [ ] Define YouTube platform config
- [ ] Define TikTok platform config
- [ ] Export PLATFORMS registry

**Estimated**: 2 hours

### Task 2.3: Custom Hooks
- [ ] Create `usePlatform` hook (manages active platform state)
- [ ] Create `useAssetFilter` hook (filters assets by platform/category)
- [ ] Create `usePlatformCategories` hook (gets categories for active platform)

**Estimated**: 2 hours

---

## Phase 3: Platform Navigation Component

### Task 3.1: PlatformNavigator Component
- [ ] Create `components/platform/PlatformNavigator.tsx`
- [ ] Horizontal tabs/pills for each platform (Twitch, YouTube, TikTok)
- [ ] Active platform highlighting
- [ ] Platform icons and colors
- [ ] onClick handler to change active platform
- [ ] Persist selection in localStorage

**Estimated**: 4 hours

### Task 3.2: Integration with App
- [ ] Add PlatformNavigator to `App.tsx` layout
- [ ] Wire up platform state (Context or useState)
- [ ] Test platform switching
- [ ] Ensure smooth transition

**Estimated**: 2 hours

---

## Phase 4: Twitch View (First Platform)

### Task 4.1: TwitchView Component
- [ ] Create `components/platform/TwitchView.tsx`
- [ ] Layout with category sections or tabs
- [ ] Display Twitch-specific categories (Emotes, Thumbnails, etc.)
- [ ] Integrate AssetGrid filtered by platform='twitch'

**Estimated**: 3 hours

### Task 4.2: CategorySection Component
- [ ] Create `components/platform/CategorySection.tsx`
- [ ] Props: platform, category, title, description, icon
- [ ] Display category header with icon and dimensions info
- [ ] Render AssetGrid for that category
- [ ] Empty state if no assets in category

**Estimated**: 3 hours

### Task 4.3: Asset Filtering Logic
- [ ] Update `AssetList` to accept platform/category filters
- [ ] Fetch assets with `GET /api/assets?platform=twitch&category=emotes`
- [ ] Test filtering works correctly
- [ ] Handle loading and error states

**Estimated**: 3 hours

### Task 4.4: Twitch-Specific Styling
- [ ] Apply Twitch purple (#9146FF) accent colors
- [ ] Add Twitch logo/icon
- [ ] Polish layout and spacing

**Estimated**: 2 hours

---

## Phase 5: YouTube & TikTok Views

### Task 5.1: YouTubeView Component
- [ ] Create `components/platform/YouTubeView.tsx`
- [ ] YouTube-specific categories (Thumbnails, Channel Art, etc.)
- [ ] Apply YouTube red (#FF0000) styling
- [ ] Integrate AssetGrid filtered by platform='youtube'

**Estimated**: 3 hours

### Task 5.2: TikTokView Component
- [ ] Create `components/platform/TikTokView.tsx`
- [ ] TikTok-specific categories (Thumbnails, Profile, Clips)
- [ ] Apply TikTok black/cyan styling
- [ ] Vertical-optimized grid layout

**Estimated**: 3 hours

---

## Phase 6: Enhanced Upload Workflow

### Task 6.1: Context-Aware Upload
- [ ] Update `UploadWidget` to accept platform/category props
- [ ] Auto-tag uploaded files with current platform and category
- [ ] Show platform/category in upload UI
- [ ] Category selector dropdown

**Estimated**: 4 hours

### Task 6.2: File Validation
- [ ] Validate file dimensions per category
- [ ] Validate file formats (PNG for emotes, etc.)
- [ ] Show validation errors before upload
- [ ] Test with various file types

**Estimated**: 3 hours

---

## Phase 7: Asset Card & Preview Enhancements

### Task 7.1: AssetCard Updates
- [ ] Show platform badge (icon)
- [ ] Show category label
- [ ] Display resolution info
- [ ] Test with multi-platform assets

**Estimated**: 3 hours

### Task 7.2: AssetPreview Modal
- [ ] Show platform and category metadata
- [ ] Add metadata editing form
- [ ] Call `PATCH /api/assets/:id` on save
- [ ] Show success/error feedback

**Estimated**: 4 hours

---

## Phase 8: Testing & Documentation

### Task 8.1: Functional Testing
- [ ] Test all platform views
- [ ] Test filtering and search
- [ ] Test upload workflow
- [ ] Test metadata editing

**Estimated**: 4 hours

### Task 8.2: Documentation
- [ ] Update README with platform features
- [ ] Document migration from 001
- [ ] Add screenshots
- [ ] Document platform configurations

**Estimated**: 3 hours

---

## Total Estimated Time
**~75 hours** (~3 weeks)

## Priority Labels
- 🔴 Critical: Phases 1-4 (Twitch view working)
- 🟡 Important: Phases 5-7 (Other platforms + upload)
- 🟢 Nice to have: Polish and advanced features
