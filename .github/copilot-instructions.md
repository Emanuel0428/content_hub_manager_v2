# content_hub_manager_v2 Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-16

## Active Technologies
- JavaScript/TypeScript for frontend (React + Vite) and Node.js (LTS) for backend OR NEEDS CLARIFICATION if you prefer a different stack. + React, Vite, Tailwind (UI); Node.js + Express or Fastify (API); SQLite for asset version metadata (as requested); object storage for blobs (local dev: filesystem, prod: S3-compatible) (001-content-platform-dashboard)
- JavaScript/TypeScript for frontend (React + Vite) and Node.js (LTS) for backend. + React, Vite, Tailwind (UI); Node.js + Fastify (API); SQLite for asset version metadata; object storage for blobs (local dev: filesystem, prod: S3-compatible). (001-content-platform-dashboard)
- SQLite for metadata/versioning; object storage for asset binaries; CDN for previews (production). (001-content-platform-dashboard)
- [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION] + [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION] (003-migrate-supabase-auth)
- [if applicable, e.g., PostgreSQL, CoreData, files or N/A] (003-migrate-supabase-auth)

## Project Structure
```
backend/
frontend/
tests/
```

## Commands
npm test; npm run lint

## Code Style
JavaScript/TypeScript for frontend (React + Vite) and Node.js (LTS) for backend OR NEEDS CLARIFICATION if you prefer a different stack.: Follow standard conventions

## Recent Changes
- 003-migrate-supabase-auth: Added [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION] + [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]
- 001-content-platform-dashboard: Added JavaScript/TypeScript for frontend (React + Vite) and Node.js (LTS) for backend. + React, Vite, Tailwind (UI); Node.js + Fastify (API); SQLite for asset version metadata; object storage for blobs (local dev: filesystem, prod: S3-compatible).
- 001-content-platform-dashboard: Added JavaScript/TypeScript for frontend (React + Vite) and Node.js (LTS) for backend. + React, Vite, Tailwind (UI); Node.js + Fastify (API); SQLite for asset version metadata; object storage for blobs (local dev: filesystem, prod: S3-compatible).

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
