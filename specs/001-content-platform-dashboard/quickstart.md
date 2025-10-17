# Quickstart: 001-content-platform-dashboard

This quickstart shows how to run the MVP locally (dev mode).

## Prerequisites

- Node.js LTS (v18 or v20 recommended)
- npm (v9+)
- Windows PowerShell, macOS Terminal, or Linux shell
- ~200 MB disk space for dependencies and uploads

## Environment Setup

All commands assume you're at the **project root** (where `backend/` and `frontend/` folders exist).

## Quick Start (2 terminals)

### Terminal 1: Start Backend Server

```bash
cd backend
npm install
npm start
```

**Expected Output:**
```
> backend@1.0.0 start
> node src/server.js

SQLite database ready at ./db/dev.sqlite
Server listening on http://localhost:3001
Events table ready for audit logging
```

The backend API is now available at `http://localhost:3001`.

### Terminal 2: Start Frontend Dev Server

```bash
cd frontend
npm install
npm run dev
```

**Expected Output:**
```
> frontend@1.0.0 dev
> vite

  VITE v5.0.0  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

The frontend is now available at `http://localhost:5173/`.

## First Time Setup

When you first load the app, the database will auto-migrate. You should see:
- ✅ Asset upload widget (drag-drop or click to upload)
- ✅ Folder manager panel on the left
- ✅ Asset list in the center
- ✅ Asset preview with checklist on the right (after selecting an asset)

## API Endpoints (Backend)

- `GET http://localhost:3001/api/assets` — List all assets
- `GET http://localhost:3001/api/assets/{id}` — Get asset detail with versions
- `POST http://localhost:3001/api/upload` — Create upload session (multipart form)
- `GET http://localhost:3001/api/folders` — List folders
- `POST http://localhost:3001/api/folders` — Create folder
- `PUT http://localhost:3001/api/assets/{id}/move` — Move asset to folder
- `GET http://localhost:3001/api/checklists/{assetId}` — Get platform checklist
- `POST http://localhost:3001/api/checklists/{assetId}/mark` — Mark checklist item complete
- `GET http://localhost:3001/api/search?q=...` — Full-text search assets
- `GET http://localhost:3001/api/events` — List audit events

## Data Storage

- **SQLite DB:** `backend/db/dev.sqlite` (auto-created on first run)
- **Uploads:** `backend/public/uploads/` (multipart file storage)
- **Frontend Cache:** Browser localStorage (search index, session)

## Development Tips

- **Hot Reload:** Frontend auto-reloads when you edit `.tsx` files (Vite)
- **Database Reset:** Delete `backend/db/dev.sqlite` and restart backend to wipe all data
- **Logs:** Check browser console (frontend errors) and backend terminal (server logs)
- **TypeScript:** All frontend code is `.tsx` with strict mode enabled
- **API Testing:** Use `curl`, Postman, or `curl` snippets in comments

## Troubleshooting

### Backend won't start

```bash
# Check if port 3001 is already in use
netstat -ano | findstr 3001  # Windows
lsof -i :3001                # macOS/Linux

# Kill the process and try again
```

### Frontend build fails

```bash
# Clear node_modules and reinstall
rm -r node_modules package-lock.json  # Linux/macOS
rmdir /s node_modules               # Windows
npm install
npm run dev
```

### Assets not uploading

- Check backend terminal for errors
- Ensure `backend/public/uploads/` directory exists
- Verify backend is listening on port 3001 (see Terminal 1 output above)

### Checklist not persisting

- Open browser DevTools → Network tab
- Click "Mark Complete" on a checklist item
- You should see a `POST /api/checklists/{assetId}/mark` request with status 200

## Next Steps

- Create a folder in the **Folder Manager** panel (left side)
- Upload an asset via the **Upload Widget**
- Move the asset to a folder using the dropdown
- View the asset and complete checklist items for its platform
- Search for assets in the search bar

## Production Deployment

For production:
1. Set environment variables (see `.env.example` if present)
2. Use external object storage (S3-compatible) instead of filesystem
3. Enable authentication via upstream provider
4. Use a proper database (MySQL/PostgreSQL) instead of SQLite
5. Deploy backend to a server, frontend to a CDN 
