# Quickstart: Ejecutar Content Hub Manager con Supabase

Requisitos previos

- Tener una cuenta/proyecto de Supabase configurado.
- Supabase keys: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
- Node.js 18+ instalado.
- Bucket "Assets" creado en Supabase Storage (público).

Pasos rápidos

1. Clona el repo y cambia a la rama de feature:

```powershell
git checkout 003-migrate-supabase-auth
```

2. Configurar variables de entorno:

**Frontend** (`frontend/.env`):
```text
VITE_SUPABASE_URL=https://jqhpnmymhjukmxizamvi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:3001
```

**Backend** (`backend/.env`):
```text
SUPABASE_URL=https://jqhpnmymhjukmxizamvi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ENABLE_AUTH=false
```

3. Instalar dependencias:

```powershell
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

4. Ejecutar la aplicación:

```powershell
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

5. Verificar funcionalidad:
   - Abrir http://localhost:5173
   - Registrar usuario nuevo
   - Subir un asset seleccionando plataforma y categoría
   - Verificar que aparece en la vista correspondiente
   - Hacer clic para ver preview

Notas

- Asegúrate de no exponer el `SUPABASE_SERVICE_ROLE_KEY` en entornos cliente.
- El bucket "Assets" debe estar configurado como público en Supabase Storage.
- Para desarrollo, `ENABLE_AUTH=false` simplifica testing del backend.
