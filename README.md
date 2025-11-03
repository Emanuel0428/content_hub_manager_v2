# Content Hub Manager v2

> **Multi-Platform Digital Asset Management System**  
> Enterprise-grade asset management for Twitch, YouTube, and TikTok content creators.

**Stack:** React + TypeScript + Vite • Node.js + Fastify • SQLite + FTS5

---

## Overview

A full-stack web application for organizing, versioning, and managing digital assets across streaming platforms. Features real-time search, smart filtering, resumable uploads, and comprehensive metadata management.

**Key Capabilities:**
- **14 Asset Categories** across 3 platforms (Twitch: 7, YouTube: 4, TikTok: 3)
- **Intelligent Filtering** by platform, category, tags, and full-text search
- **Version Control** with complete audit trail and event logging
- **Responsive Design** with dark/light themes and platform-specific branding

---

## � Development Methodology: Spec-kit Approach

This project was built using **[Spec-kit](https://github.com/spec-kit/spec-kit)**, a specification-driven development methodology that ensures clarity, traceability, and iterative progress.

### Implemented Features

#### **Feature 001: Content Platform Dashboard** ✅
*Foundation layer with core asset management*
- **Scope:** Multi-platform navigation, asset CRUD, upload system, SQLite schema
- **Key Deliverables:**
  - Platform-aware UI with Twitch/YouTube/TikTok views
  - Repository pattern architecture (5 repositories)
  - RESTful API with 15+ endpoints
  - Resumable uploads via Tus protocol
  - SQLite with FTS5 full-text search
- **Completion:** 100% (140/140 requirements)

#### **Feature 002: Enhanced Design Features** ✅
*UI/UX improvements and advanced filtering*
- **Scope:** Search & filter system, dark mode, error handling, type safety
- **Key Deliverables:**
  - `FilterBar` component with real-time search + category filters
  - Dark/light theme with persistent preferences
  - Type-safe error handling utilities (`errorHandling.ts`)
  - JSDoc documentation across critical paths
  - Performance-optimized filtering with `useMemo`
- **Completion:** 89% (125/140 requirements)

### Spec-kit Benefits Realized
✅ **Structured Planning** → Clear requirements documents prevented scope creep  
✅ **Incremental Progress** → Task-based tracking with checkable checklists  
✅ **Living Documentation** → Specs in `/specs` folder co-evolve with code  
✅ **Quality Gates** → Each feature validated against acceptance criteria  
✅ **Context Preservation** → Future developers understand *why* decisions were made

---

## Quick Start

### Prerequisites
- Node.js (LTS) • npm/yarn

### Installation
```bash
# Clone and install
git clone <repository-url>
cd content_hub_manager_v2

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### Run Development
```bash
# Terminal 1: Backend (http://localhost:3001)
cd backend && npm start

# Terminal 2: Frontend (http://localhost:5173)
cd frontend && npm run dev
```

### Build Production
```bash
cd frontend && npm run build
```

---

## Architecture

### Tech Stack
| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript + Vite | Component-based UI with hot reload |
| **Styling** | TailwindCSS + Lucide Icons | Utility-first CSS with icon library |
| **Backend** | Node.js + Fastify | High-performance REST API |
| **Database** | SQLite + FTS5 | Lightweight RDBMS with full-text search |
| **Storage** | Local filesystem (dev) | Asset binaries (S3-ready architecture) |
| **Upload** | Tus protocol | Resumable uploads for large files |

### Project Structure
```
content_hub_manager_v2/
├── backend/
│   ├── db/                 # SQLite database + migrations
│   ├── public/uploads/     # Asset storage
│   └── src/
│       ├── repositories/   # Data access layer (5 repos)
│       ├── routes/         # API endpoints
│       ├── services/       # Business logic
│       └── middleware/     # Auth, logging, observability
├── frontend/
│   └── src/
│       ├── components/     # React components
│       │   └── platform/   # Platform-specific views + FilterBar
│       ├── hooks/          # Custom hooks (usePlatform, useAssetFilter)
│       ├── contexts/       # Global state (ThemeContext)
│       └── services/       # API client (axios)
└── specs/                  # Spec-kit documentation
    ├── 001-content-platform-dashboard/
    └── 002-enhanced-design-features/
```

---

## � Usage

### 1. Platform Navigation
Switch between **Twitch** / **YouTube** / **TikTok** tabs. Active platform persists in localStorage.

### 2. Upload Assets
- Drag & drop files or click to browse
- Platform auto-selected from active tab
- Category dropdown filtered by platform
- Real-time progress bar for uploads

### 3. Search & Filter
- **Search Bar:** Filter by title or tags (case-insensitive)
- **Category Buttons:** Toggle to show specific categories
- **Clear Filters:** Reset to view all assets
- **Active Filters Display:** Shows current search/filter state

### 4. View & Edit
- Click asset thumbnail → Opens preview modal
- Edit metadata: title, category, resolution, dimensions, tags, description
- Changes saved via PATCH API with optimistic updates

### 5. Dark Mode
Toggle sun/moon icon in header. Preference saved to localStorage.

### 5. Dark Mode
Toggle sun/moon icon in header. Preference saved to localStorage.

---

## API Reference

### Core Endpoints
```
GET    /api/assets              # List assets (supports ?platform=X&category=Y)
GET    /api/assets/:id          # Get asset details
POST   /api/assets              # Create asset
PATCH  /api/assets/:id          # Update asset metadata
DELETE /api/assets/:id          # Delete asset

GET    /api/platforms           # List all platforms
GET    /api/platforms/:id/categories  # Get platform categories

GET    /api/search?q=query      # Full-text search (FTS5)
GET    /api/stats/platforms     # Asset count per platform

POST   /api/upload              # Upload file (multipart/form-data)
GET    /api/health              # Health check
```

### Platform Specifications

| Platform | Color | Categories | Key Dimensions |
|----------|-------|-----------|----------------|
| **Twitch** | `#9146FF` | 7 (Thumbnails, Emotes, Badges, Overlays, Alerts, Panels, Offline) | 1920×1080px (thumbnails), 112×112px (emotes) |
| **YouTube** | `#FF0000` | 4 (Thumbnails, Banners, End Screens, Watermarks) | 1280×720px (thumbnails), 2560×1440px (banners) |
| **TikTok** | `#000000` | 3 (Thumbnails, Profile Pics, Clips) | 1080×1920px (9:16 vertical) |

---

## Testing

### Manual Testing Flow
```bash
# 1. Start servers
cd backend && npm start    # Terminal 1
cd frontend && npm run dev # Terminal 2

# 2. Test workflow
✅ Navigate platform tabs (persistence check)
✅ Upload asset with platform/category
✅ Search by title/tags
✅ Filter by category
✅ Edit asset metadata
✅ Toggle dark/light mode
✅ Verify cross-platform isolation
```

### Automated Tests
```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

---

## Troubleshooting

**Database Reset:**
```bash
cd backend && npm run init-db
```

**Port Conflicts:**
- Backend: Edit `backend/src/server.js` (default: 3001)
- Frontend: Edit `frontend/vite.config.ts` (default: 5173)

**CORS Issues:**
Ensure backend allows frontend origin in `backend/src/server.js`:
```javascript
app.register(cors, { origin: 'http://localhost:5173' })
```

---

## � Database Schema

### Core Tables
- **`assets`** → Metadata (platform, category, resolution, tags, title, etc.)
- **`asset_versions`** → Version history with file paths
- **`checklists`** → Task lists attached to assets
- **`events`** → Audit log (who, what, when)
- **`assets_fts`** → FTS5 full-text search index

### Key Indexes
- `idx_assets_platform` → Fast platform filtering
- `idx_assets_category` → Fast category filtering  
- `idx_platform_category` → Combined queries

---

## Roadmap

### Planned Enhancements
- [ ] Bulk upload with parallel processing
- [ ] Advanced filters (date range, file size, resolution)
- [ ] Asset templates library
- [ ] Real-time collaboration (WebSocket)
- [ ] S3/CDN integration for production storage
- [ ] Analytics dashboard (uploads over time, popular categories)
- [ ] API authentication (JWT tokens)
- [ ] Export/import (JSON, CSV)

### Spec-kit Integration
New features will follow the established pattern:
1. Create spec document in `/specs/00X-feature-name/`
2. Define requirements checklist
3. Document data model and API contracts
4. Implement incrementally with task tracking
5. Update requirements.md progress

---

## � Documentation

Comprehensive specifications available in `/specs`:
- **001-content-platform-dashboard/** → Foundation feature docs
- **002-enhanced-design-features/** → UI/UX enhancement docs

Each spec includes:
- `spec.md` → Feature overview and goals
- `plan.md` → Implementation strategy
- `data-model.md` → Schema and relationships
- `checklists/requirements.md` → Detailed requirement tracking
- `contracts/` → OpenAPI specs and SQL schemas

---

## Contributing

1. Fork repository
2. Create feature branch: `git checkout -b 00X-feature-name`
3. Follow Spec-kit methodology (create spec document first)
4. Implement with incremental commits
5. Update requirements checklist
6. Submit pull request with spec reference

**Code Standards:**
- TypeScript strict mode enabled
- ESLint + Prettier configured
- JSDoc for public APIs
- Error handling via `errorHandling.ts` utils

---

## License

MIT License - See LICENSE file for details

---

## Acknowledgments

- **Spec-kit** methodology for structured development
- **Fastify** team for high-performance Node.js framework
- **Vite** for lightning-fast build tooling
- Content creator community for domain insights

---

**Built with precision for content creators** 
