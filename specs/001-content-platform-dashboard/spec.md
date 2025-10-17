```markdown
# Feature Specification: Tablero centralizado para creadores de contenido

**Feature Branch**: `001-content-platform-dashboard`  
**Created**: 2025-10-16  
**Status**: Draft  
**Input**: User description: "Estoy construyendo una web app que funcione como dashboard centralizado para creadores de contenido. Debe permitir gestionar y organizar assets específicos de múltiples plataformas (Twitch, TikTok, YouTube, Instagram) desde una única interfaz. Los usuarios pueden cambiar entre plataformas, subir archivos, previsualizar elementos, crear carpetas de organización y verificar checklists para saber que elementos faltan."

## Clarifications

### Session 2025-10-16

- Q: Remove support-ticket reduction metric (SC-004) → A: Removed per user request. SC-004 deleted from Success Criteria.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gestión y publicación de assets (Priority: P1)

Como creador de contenido, quiero poder ver y gestionar todos mis assets de distintas plataformas desde un único panel para reducir el tiempo que dedico a buscar archivos y preparar publicaciones.

**Why this priority**: Crear y publicar contenido rápido es la necesidad central de los usuarios; ofrecer una vista unificada aporta el mayor valor inmediato.

**Independent Test**: Iniciar sesión como usuario con cuentas vinculadas a al menos dos plataformas; desde el panel, cambiar de plataforma, subir un archivo y previsualizarlo. Resultado: el archivo aparece en la lista de assets de la plataforma seleccionada y la previsualización muestra una vista representativa.

**Acceptance Scenarios**:

1. **Given** el usuario ha vinculado al menos una cuenta de plataforma, **When** selecciona una plataforma en el selector de plataformas, **Then** la lista de assets se filtra a los assets pertenecientes a esa plataforma.
2. **Given** el usuario está en la vista de assets de una plataforma, **When** sube un archivo válido (ver restricciones en Asunciones), **Then** el archivo aparece en la lista y puede previsualizarse.
3. **Given** un asset subido, **When** el usuario solicita previsualización, **Then** se muestra una vista previa apropiada (imagen en miniatura, vídeo en reproductor con controls, o metadatos si aplica).

---

### User Story 2 - Organización por carpetas y movido de assets (Priority: P2)

Como creador, quiero agrupar assets en carpetas dentro del panel para organizar campañas y facilitar búsquedas posteriores.

**Why this priority**: Organización reduce fricción, pero puede entregarse después del núcleo de subida/preview.

**Independent Test**: Crear una carpeta, mover un asset dentro de ella, y verificar que la búsqueda y la vista por carpeta muestran el asset correctamente.

**Acceptance Scenarios**:

1. **Given** la vista de assets, **When** el usuario crea una nueva carpeta y arrastra o mueve un asset a la carpeta, **Then** el asset aparece listado dentro de la carpeta.
2. **Given** una carpeta con assets, **When** el usuario elimina la carpeta (con confirmación), **Then** el sistema pregunta si mover los assets a raíz o eliminarlos; la acción seleccionada se aplica.

---

### User Story 3 - Checklists de preparación por plataforma (Priority: P3)

Como creador, quiero ver checklists que indiquen qué elementos faltan antes de publicar (thumbnail, descripción, tags, duración mínima, etc.) para asegurar calidad y cumplimiento de requisitos por plataforma.

**Why this priority**: Mejora la calidad de publicaciones y reduce rework; puede implementarse tras la carga y organización básicas.

**Independent Test**: Crear o seleccionar un asset, abrir su panel de preparación y comprobar que la checklist muestra items aplicables a la plataforma seleccionada; marcar items completados actualiza el estado.

**Acceptance Scenarios**:

1. **Given** un asset y la plataforma destino seleccionada, **When** el usuario abre la checklist de preparación, **Then** se listan los requisitos relevantes y el sistema resalta los faltantes.
2. **Given** todos los requisitos marcados como completados, **When** el usuario verifica la checklist, **Then** la checklist indica que el asset está listo (estado "Preparado").

---

### Edge Cases

- Subida de un archivo con metadatos incompletos: el sistema acepta la subida pero marca la checklist con los campos faltantes.
- Archivo con formato válido pero tamaño muy grande: el sistema rechaza la subida y muestra un error claro con el límite vigente.
- Plataformas desconectadas: si una cuenta de plataforma no responde, el panel muestra el estado "Desconectada" y permite reintentar vinculación o operar en modo local (gestión de assets sin publicar).
- Varios usuarios (equipo) accediendo al mismo asset: conflicto de edición en metadatos; la UI debe advertir y sugerir acciones (ver histórico o bloquear edición simultánea).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST mostrar un selector de plataforma que permita alternar la vista entre Twitch, TikTok, YouTube e Instagram.
- **FR-002**: El sistema MUST permitir subir archivos desde el dispositivo del usuario hacia la plataforma correspondiente dentro del panel, respetando límites y formatos definidos en Asunciones.
- **FR-003**: El sistema MUST mostrar una lista paginada o filtrable de assets para la plataforma seleccionada.
- **FR-004**: El sistema MUST ofrecer una previsualización por tipo de asset (imagen, vídeo, documento) sin requerir descarga manual.
- **FR-005**: El sistema MUST permitir crear, renombrar y eliminar carpetas para organizar assets y mover assets entre carpetas.
- **FR-006**: El sistema MUST exponer una checklist de preparación por asset que muestre los requisitos por plataforma y permita marcar items como completados.
- **FR-007**: El sistema MUST persistir el estado de la checklist y el vínculo asset→carpeta de forma que sobreviva a nuevas sesiones del usuario.
- **FR-008**: El sistema MUST presentar errores y estados (por ejemplo: subida fallida, formato no soportado, cuenta desconectada) con mensajes legibles para usuarios no técnicos.
- **FR-009**: El sistema MUST permitir buscar y filtrar assets por nombre, etiquetas, tipo, fecha y carpeta.
- **FR-010**: El sistema MUST registrar eventos de usuario clave (subida, eliminación, movimiento entre carpetas, marcado de checklist) para auditoría básica.

### Key Entities *(include if feature involves data)*

- **Asset**: Representa un archivo subido o importado. Atributos importantes: id, nombre, tipo (imagen/vídeo/documento), tamaño, plataforma origen, estado de publicación, metadatos (descripción, tags), thumbnails/previews.
- **PlatformAccount**: Representa la conexión del usuario a una plataforma (Twitch, TikTok, YouTube, Instagram). Atributos: id, plataforma, nombre de cuenta, estado de conexión.
- **Folder**: Carpeta organizativa. Atributos: id, nombre, parentFolderId, lista de assets.
- **ChecklistItem**: Requisito aplicable a un asset para publicación en una plataforma. Atributos: id, descripción, obligatorio (sí/no), estado (completado/pendiente), notas del usuario.
- **User**: Actor que maneja assets. Atributos relevantes a la feature: id, nombre, roles/permiso (si aplica), lista de PlatformAccounts vinculadas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario autenticado con al menos una PlatformAccount puede cambiar de plataforma y ver la lista de assets correspondientes en menos de 2 segundos (95th percentile bajo condiciones normales de red).
- **SC-002**: El 95% de las subidas de archivos con tamaño <= 50MB finalizan y muestran la previsualización disponible en menos de 10 segundos desde el inicio de la subida en una conexión de banda ancha típica.
- **SC-003**: El 90% de los usuarios que usan la checklist completan los items requeridos para un asset en una sola sesión (medido por tasa de items marcados antes de publicar).


## Assumptions

- El producto ya dispone de un mecanismo de autenticación de usuarios; esta especificación no define cómo se autentican.
- Los límites de tamaño y formatos soportados se establecerán por defecto a: imágenes (jpg, png, webp) hasta 50MB; vídeo (mp4, mov) hasta 500MB. Estos valores son asumidos y pueden ajustarse según decisiones del producto.
- El sistema persistirá metadata y relaciones (asset→carpeta, checklist) asociadas al usuario; se asume separación por usuario/organización.
- Integraciones específicas de publicación (por ejemplo: publicar directamente en TikTok desde la UI) quedan fuera del alcance inicial; foco en gestión y preparación de assets.

## Notes

- Esta especificación prioriza valor al creador: vista unificada, subida, previsualización y checklists. Organización por carpetas es funcionalidad complementaria priorizada P2.
- No se incluyen decisiones técnicas (almacenamiento, formatos de API, frameworks) en esta especificación.

``` 
# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`  
**Created**: [DATE]  
**Status**: Draft  
**Input**: User description: "$ARGUMENTS"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  
