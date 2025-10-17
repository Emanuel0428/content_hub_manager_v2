# Tasks: 001-content-platform-dashboard

## Phase 1 — Setup (project initialization)

- [x] T001 Create repository structure: `backend/`, `frontend/`, `specs/` (root)
- [x] T002 [P] Initialize `backend/package.json` with Fastify, typescript, tus-node-server, sqlite dependency (backend/package.json)
- [x] T003 [P] Initialize `frontend/package.json` with Vite + React + Tailwind + tus-js-client (frontend/package.json)
- [x] T004 Add root `.gitignore` and developer scripts (root/.gitignore, package.json scripts)
- [x] T005 Copy `contracts/openapi.yaml` and `contracts/sqlite-schema.sql` into `backend/contracts/` and `backend/db/` respectively (backend/contracts/, backend/db/sqlite-schema.sql)

## Phase 2 — Foundational (blocking prerequisites)

- [x] T006 [P] Implement SQLite connection and simple migration runner in `backend/src/db/index.ts` (use schema in `backend/db/sqlite-schema.sql`)
- [x] T007 Implement OpenAPI loader and register route scaffolding in `backend/src/api/openapi.ts` (reads `backend/contracts/openapi.yaml`)
- [x] T008 Implement tus upload integration and temporary upload state in `backend/src/services/uploadService.ts`
- [x] T009 Implement Asset repository (models + queries) in `backend/src/models/asset.ts` (map to `assets`, `asset_versions` tables)
- [x] T010 Implement Folder and Folder-Asset repository in `backend/src/models/folder.ts` and `backend/src/models/folderAsset.ts`
- [x] T011 Implement Checklist repository and basic methods in `backend/src/models/checklist.ts`
- [x] T012 [P] Add Playwright config and a smoke test stub in `playwright.config.ts` and `tests/e2e/` (no tests yet)

-- Remediation: Minimal functionality & UX tasks (events, search, errors)

- [x] T029 Implement EventService to persist functional events to `events` table in `backend/src/services/eventService.ts`
- [x] T030 Instrument upload flow: emit upload-created/completed events from `backend/src/services/uploadService.ts` using EventService
- [x] T031 Instrument checklist flow: emit checklist-updated events from `backend/src/services/checklistService.ts` using EventService

## Phase 3 — User Story 1 (P1) Gestión y publicación de assets

- [x] T013 [US1] Implement GET `/api/assets` endpoint in `backend/src/api/assets.ts` returning `AssetList` (contract: `contracts/openapi.yaml`)
- [x] T014 [US1] Implement POST `/api/uploads` to create upload session and return tus upload details in `backend/src/api/uploads.ts`
- [x] T015 [US1] Implement GET `/api/assets/{assetId}` in `backend/src/api/assets.ts` returning `Asset` with versions
- [x] T016 [US1] Implement frontend asset list page with platform selector in `frontend/src/pages/AssetsPage.tsx` (fetch `/api/assets`)
- [x] T017 [US1] Implement frontend upload widget using multipart in `frontend/src/components/UploadWidget.tsx` (integrates with `/api/upload`)
- [x] T018 [US1] Implement frontend asset preview component (image/video/audio) in `frontend/src/components/AssetPreview.tsx`
- [x] T019 [US1] [P] Implement frontend API client wrapper `frontend/src/services/api.ts` with typed methods for assets/uploads/folders/checklists

-- Search, error UX and client integration (US1 additions)

- [x] T032 [US1] Implement client-side search/indexing service `frontend/src/services/searchIndex.ts` (use Fuse.js or Lunr for immediate filtering)
- [x] T033 [US1] Implement server-side search fallback endpoint `backend/src/api/search.ts` using SQLite FTS (contracts update optional)
- [x] T034 [US1] Wire frontend to fallback search endpoint in `frontend/src/services/api.ts` (use when dataset exceeds client threshold)
- [x] T035 [US1] Add backend error mapping utility `backend/src/utils/errorMapper.ts` that returns user-friendly messages for common errors
- [x] T036 [US1] Implement frontend error toast component `frontend/src/components/ErrorToast.tsx` (visual, accessible) and styles
- [x] T037 [US1] Integrate API client error handling to display `ErrorToast` on user-facing failures in `frontend/src/services/api.ts`

## Phase 4 — User Story 2 (P2) Organización por carpetas

- [x] T020 [US2] Implement POST `/api/folders` and GET `/api/folders/{id}` endpoints in `backend/src/api/folders.ts`
- [x] T021 [US2] [P] Implement frontend folder creation and folder view components in `frontend/src/components/FolderManager.tsx` and `frontend/src/pages/FolderPage.tsx`
- [x] T022 [US2] Implement backend service to move assets between folders in `backend/src/services/folderService.ts`

## Phase 5 — User Story 3 (P3) Checklists de preparación

- [x] T023 [US3] Implement GET `/api/checklists/{assetId}` endpoint in `backend/src/api/checklists.ts` returning platform-aware checklist items
- [x] T024 [US3] [P] Implement frontend checklist panel and mark-complete actions in `frontend/src/components/ChecklistPanel.tsx`
- [x] T025 [US3] Persist checklist state updates in `backend/src/services/checklistService.ts` and `backend/src/models/checklist.ts`

## Final Phase — Polish & Cross-cutting concerns

- [x] T026 Add observability middleware (structured logging + basic metrics) in `backend/src/middleware/observability.ts`
- [x] T027 Add auth stub middleware to gate API endpoints in `backend/src/middleware/auth.ts` (assumes upstream auth integration)
- [x] T028 [P] Update `specs/001-content-platform-dashboard/quickstart.md` with exact dev commands and environment setup (specs/.../quickstart.md)

- [x] T038 [P] Standardize frontend component file extensions to TypeScript `.tsx` and update task file paths accordingly (frontend/src/**/*.tsx)

## Dependencies (story completion order)

1. Phase 1 (T001-T005) must complete before Phase 2.
2. Phase 2 (T006-T012) must complete before Phase 3 (US1) tasks T013-T019.
3. US2 (T020-T022) depends on Phase 2 and the Asset model (T009).
4. US3 (T023-T025) depends on Asset and Checklist models (T009, T011).

## Parallel execution examples

- Backend `package.json` and frontend `package.json` initialization (T002, T003) can run in parallel.
- DB connection (T006), tus integration (T008) and model scaffolding (T009-T011) can be developed in parallel by different engineers.
- Frontend API client (T019) and frontend components (T016-T018) can be worked in parallel once backend endpoints are scaffolded.

## Implementation strategy

- MVP-first: implement Phase 3 (US1) minimally (list, upload, preview) to have a working end-to-end flow.
- Deliver incremental demos after US1, then implement US2 and US3.
- Keep tasks small and file-path explicit so an LLM or engineer can implement each task directly.
