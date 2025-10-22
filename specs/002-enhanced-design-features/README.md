# 002-enhanced-design-features: Multi-Platform Content Management

## 🎯 Vision

Transformar el content hub genérico en una plataforma especializada para creadores de contenido que gestionan assets para **múltiples redes sociales** (Twitch, YouTube, TikTok).

---

## ✨ Features Principales

### 📺 Vista Dedicada por Plataforma

Cada plataforma tiene su propia vista con categorías específicas:

**Twitch**
- 😊 Emotes (28x28, 56x56, 112x112)
- 🖼️ Stream Thumbnails (1920x1080)
- 🎭 Subscriber Badges
- 📹 Camera Overlays
- 🎉 Alerts (sub/follow/donation)
- 📋 Info Panels (320x100)
- 🛑 Offline Banner (1920x1080)

**YouTube**
- 🎬 Video Thumbnails (1280x720)
- 🖼️ Channel Art (2560x1440)
- 🎯 End Screens
- 💧 Channel Watermark (150x150)

**TikTok**
- 📱 Video Thumbnails (1080x1920 vertical)
- 👤 Profile Image (200x200)
- 🎥 Video Clips

### 🔄 Navegación Fluida

- **Tabs superiores**: Cambio rápido entre plataformas
- **Colores de marca**: Twitch morado, YouTube rojo, TikTok negro/cyan
- **Vistas aisladas**: Solo ves assets de la plataforma activa
- **Persistencia**: Se recuerda tu última plataforma seleccionada

### 🏷️ Organización Inteligente

- **Auto-tagging**: Subes un emote en Twitch → automáticamente tagged como `Twitch/Emotes`
- **Categorización**: Assets organizados por tipo (emotes, thumbnails, alerts, etc.)
- **Filtros**: Filtra por plataforma + categoría + búsqueda
- **Metadata**: Información de resolución, dimensiones, tags personalizados

---

## 🛠️ Cambios Técnicos

### Backend (Node.js + SQLite)

```sql
-- Nuevas columnas en tabla assets
ALTER TABLE assets ADD COLUMN platform TEXT DEFAULT 'all';
ALTER TABLE assets ADD COLUMN category TEXT;
ALTER TABLE assets ADD COLUMN resolution TEXT;
ALTER TABLE assets ADD COLUMN tags TEXT; -- JSON
```

**Nuevos endpoints**:
- `GET /api/assets?platform=twitch&category=emotes`
- `PATCH /api/assets/:id` (editar metadata)
- `GET /api/platforms` (configs de plataformas)

### Frontend (React + TypeScript)

**Nuevos componentes**:
```
components/platform/
  ├── PlatformNavigator.tsx      # Tabs de navegación
  ├── PlatformViewContainer.tsx  # Router de vistas
  ├── TwitchView.tsx             # Vista de Twitch
  ├── YouTubeView.tsx            # Vista de YouTube
  ├── TikTokView.tsx             # Vista de TikTok
  └── CategorySection.tsx        # Sección por categoría
```

**Componentes mejorados**:
- `AssetCard` → Muestra badge de plataforma
- `AssetList` → Filtra por platform/category
- `UploadWidget` → Auto-tag con contexto
- `AssetPreview` → Edita metadata

---

## 📊 Estructura de Archivos

```
/uploads/
  /twitch/
    /thumbnails/
    /emotes/
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
```

---

## 🚀 Roadmap de Implementación

### Phase 1: Backend (Foundation) - 9h
- Migración de base de datos
- Actualizar API endpoints
- Organización de carpetas

### Phase 2: Platform Configs - 5h
- Definir tipos TypeScript
- Crear configs de Twitch/YouTube/TikTok
- Custom hooks (usePlatform, useAssetFilter)

### Phase 3: Navigation - 6h
- Componente PlatformNavigator
- Integración en App.tsx

### Phase 4: Twitch View - 11h
- TwitchView component
- CategorySection component
- Lógica de filtrado
- Styling con Twitch purple

### Phase 5: YouTube & TikTok - 6h
- YouTubeView component
- TikTokView component

### Phase 6: Upload Enhancement - 7h
- Upload context-aware
- Validación de archivos
- Auto-tagging

### Phase 7: Asset Enhancements - 7h
- AssetCard con badges
- AssetPreview con metadata editing

### Phase 8: Testing & Docs - 7h
- Testing funcional
- Documentación

**Total**: ~75 horas (~3 semanas)

---

## 🎨 UI Mockup (Conceptual)

```
┌─────────────────────────────────────────────────────┐
│  Content Hub Manager                                │
├─────────────────────────────────────────────────────┤
│  [📺 Twitch] [🎬 YouTube] [📱 TikTok]              │ ← Platform Tabs
├─────────────────────────────────────────────────────┤
│                                                     │
│  Twitch Content Manager                             │
│  ─────────────────────────────────────────────      │
│                                                     │
│  [Thumbnails] [Emotes] [Badges] [Overlays] ...      │ ← Category Tabs
│                                                     │
│  Emotes (28x28, 56x56, 112x112)                     │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐          │
│  │ 😊    │ │ 🔥    │ │ 💜    │ │ ➕    │          │
│  │ emoji │ │ hype  │ │ love  │ │Upload │          │
│  └───────┘ └───────┘ └───────┘ └───────┘          │
│                                                     │
│  Thumbnails (1920x1080)                             │
│  ┌───────┐ ┌───────┐ ┌───────┐                    │
│  │[IMG]  │ │[IMG]  │ │[IMG]  │                    │
│  │Stream │ │Stream │ │Stream │                    │
│  │  #1   │ │  #2   │ │  #3   │                    │
│  └───────┘ └───────┘ └───────┘                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## ✅ User Stories

1. **Como streamer de Twitch**, quiero gestionar mis emotes separados de otros assets
2. **Como YouTuber**, quiero tener mis thumbnails organizados por plataforma
3. **Como creador multi-plataforma**, quiero cambiar fácilmente entre Twitch y YouTube
4. **Como usuario subiendo un emote**, quiero que se etiquete automáticamente como Twitch/Emotes
5. **Como usuario**, quiero ver qué plataforma y categoría pertenece cada asset

---

## 📚 Documentos de Spec

- **plan.md**: Visión general y objetivos
- **spec.md**: Especificación técnica completa (requisitos, API, componentes)
- **data-model.md**: Schema de base de datos, tipos TypeScript, configs de plataformas
- **tasks.md**: Desglose de tareas por fase (75h)
- **quickstart.md**: Guía rápida para empezar
- **research.md**: Decisiones técnicas, dimensiones oficiales, referencias
- **checklists/requirements.md**: 120+ items de verificación

---

## 🎯 Próximos Pasos

1. **Lee** `spec.md` completo
2. **Empieza** con Phase 1 (Database migration)
3. **Sigue** tasks.md paso a paso
4. **Marca** items en checklist conforme avanzas
5. **Testea** continuamente

---

## 💡 Valor para el Usuario

**Antes (001)**:
- Carpetas genéricas
- Sin organización por plataforma
- Difícil encontrar assets específicos

**Después (002)**:
- ✨ Vista dedicada por plataforma
- 🏷️ Assets auto-categorizados
- 🔍 Búsqueda y filtros específicos
- 🎨 UI adaptada a cada red social
- ⚡ Workflow optimizado para creadores

---

**¿Listo para empezar a desarrollar?** 🚀

Ver `quickstart.md` para instrucciones de inicio.
