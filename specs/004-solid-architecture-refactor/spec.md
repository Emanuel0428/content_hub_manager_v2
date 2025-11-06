# Feature Specification: Backend Architecture Refactor - SOLID Principles

**Feature Branch**: `004-solid-architecture-refactor`  
**Created**: 2025-11-06  
**Status**: Draft  
**Input**: User description: "Refactorizar el backend aplicando principios SOLID para mejorar mantenibilidad, testabilidad y escalabilidad. Eliminar código legacy de SQLite y establecer una arquitectura en capas clara sin la complejidad de DDD/Hexagonal."

## Clarifications

### Session 2025-11-06

- Q: ¿Usar arquitectura hexagonal/DDD? → A: NO, enfoque pragmático basado en SOLID sin complejidad de DDD.
- Q: ¿Mantener código SQLite? → A: NO, eliminar completamente - solo usar Supabase.
- Q: ¿Nivel de testing requerido? → A: Tests unitarios para servicios, integración para repositories.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer: Mantenimiento y Extensibilidad (Priority: P1)

Como desarrollador quiero agregar nuevas funcionalidades (ej: nueva plataforma, nuevo tipo de asset) sin modificar código existente para reducir riesgos de regresión.

**Why this priority**: El código actual viola OCP (Open/Closed) - cada cambio requiere modificar múltiples archivos. Esto es crítico para escalar el proyecto.

**Independent Test**: Agregar soporte para una nueva plataforma "Instagram" sin modificar AssetService, solo extendiendo configuración. Verificar que los tests existentes siguen pasando.

**Acceptance Scenarios**:

1. **Given** un nuevo tipo de validación requerido, **When** se crea un nuevo validator, **Then** se puede integrar sin modificar el código core de servicios.
2. **Given** necesidad de nuevo repositorio, **When** se implementa siguiendo la interfaz establecida, **Then** se puede inyectar en servicios sin cambios en lógica de negocio.

---

### User Story 2 - Developer: Testing y Calidad (Priority: P1)

Como desarrollador quiero testear servicios de negocio aisladamente sin dependencias de Supabase para ejecutar tests rápidos y confiables en CI/CD.

**Why this priority**: Actualmente no hay separación - testing requiere Supabase real, haciendo tests lentos y frágiles.

**Independent Test**: Ejecutar suite de tests de AssetService usando mocks de repository, completando en <2 segundos sin conexiones externas.

**Acceptance Scenarios**:

1. **Given** un servicio con lógica de negocio, **When** se ejecutan tests unitarios, **Then** usan mocks de repositories sin llamadas reales a Supabase.
2. **Given** cambios en lógica de negocio, **When** se ejecutan tests, **Then** fallan/pasan según la lógica sin depender de estado de DB externa.

---

### User Story 3 - Developer: Manejo de Errores Consistente (Priority: P2)

Como desarrollador quiero tener errores tipados y manejados centralizadamente para entregar mensajes consistentes al frontend y facilitar debugging.

**Why this priority**: Actualmente hay inconsistencias - algunos endpoints retornan `{error}`, otros `{message}`, dificultando el manejo en frontend.

**Independent Test**: Provocar diferentes tipos de errores (validación, not found, unauthorized) y verificar que todos retornan estructura consistente con códigos HTTP correctos.

**Acceptance Scenarios**:

1. **Given** un error de validación, **When** ocurre en cualquier endpoint, **Then** retorna 400 con estructura `{error, message, details}`.
2. **Given** un error inesperado, **When** ocurre en producción, **Then** no expone stack traces pero los logea para debugging.

---

### Edge Cases

- Cambio de proveedor BaaS (Supabase → Firebase): debe requerir solo cambios en capa de repositories.
- Múltiples servicios dependiendo del mismo repository: DI debe permitir singleton para evitar múltiples instancias.
- Errores durante inicialización de servicios: debe fallar rápido con mensajes claros.
- Validaciones complejas entre múltiples entidades: validators deben ser componibles.

## Requirements *(mandatory)*

### Functional Requirements

**Separación de Responsabilidades (SRP)**

- **FR-001**: El sistema MUST separar lógica de negocio (services), acceso a datos (repositories) y presentación (routes) en capas independientes.
- **FR-002**: Cada servicio (AssetService, AuthService, UploadService, ChecklistService) MUST tener una única responsabilidad claramente definida.
- **FR-003**: Routes MUST actuar solo como orquestadores, delegando toda lógica a servicios.

**Open/Closed Principle (OCP)**

- **FR-004**: El sistema MUST permitir agregar nuevos validators, platforms o storage providers sin modificar código existente.
- **FR-005**: La jerarquía de errores MUST ser extensible mediante herencia sin modificar error handler central.

**Liskov Substitution Principle (LSP)**

- **FR-006**: Todos los repositories MUST implementar una interfaz consistente que permita intercambiarlos sin afectar servicios.
- **FR-007**: Los servicios MUST depender de abstracciones (interfaces) no de implementaciones concretas de repositories.

**Interface Segregation Principle (ISP)**

- **FR-008**: Repositories MUST exponerse con interfaces específicas según necesidades (ej: IAssetReader, IAssetWriter) en lugar de una interfaz monolítica.
- **FR-009**: Middlewares MUST tener interfaces mínimas y específicas según su propósito.

**Dependency Inversion Principle (DIP)**

- **FR-010**: Services MUST recibir dependencies via constructor injection, no mediante imports directos.
- **FR-011**: El sistema MUST usar un contenedor de DI o factory pattern para construir el grafo de dependencias.
- **FR-012**: Routes MUST recibir servicios pre-configurados, no instanciarlos directamente.

**Manejo de Errores**

- **FR-013**: El sistema MUST tener una jerarquía de errores custom (AppError → ValidationError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError).
- **FR-014**: Todos los endpoints MUST retornar errores en formato consistente: `{error, message, details?, stack?}`.
- **FR-015**: El error handler MUST diferenciar errores operacionales de bugs y loggearlos apropiadamente.

**Validación**

- **FR-016**: El sistema MUST usar validación declarativa con Zod library para schema-based validation en todos los endpoints.
- **FR-017**: Validators MUST ser componibles y reutilizables entre endpoints usando Zod's extend/merge utilities.

**Testing**

- **FR-018**: Services MUST ser testeables unitariamente usando mocks de repositories.
- **FR-019**: Repositories MUST tener tests de integración contra Supabase real (ambiente de test).

**Limpieza de Código Legacy**

- **FR-020**: El sistema MUST verificar que no existan archivos relacionados con SQLite (repositories/, schemas, migration services) en el codebase.
- **FR-021**: El sistema MUST verificar que no exista código no utilizado (storageUploader.js, errorMapper.js legacy).

**Observabilidad**

- **FR-022**: El sistema MUST emitir eventos estructurados para operaciones de servicios (create, update, delete) usando el EventRepository para trazabilidad y debugging.

### Key Entities *(arquitectura, no datos)*

**Estructura de Capas**:

```
src/
├── services/           # Lógica de negocio (SRP)
│   ├── AssetService.js
│   ├── AuthService.js
│   ├── UploadService.js
│   └── ChecklistService.js
│
├── repositories/       # Acceso a datos (ISP, LSP)
│   ├── AssetRepository.js
│   ├── UserRepository.js
│   └── ChecklistRepository.js
│
├── validators/         # Validación (OCP)
│   ├── schemas/
│   │   ├── assetSchemas.js
│   │   └── authSchemas.js
│   └── index.js
│
├── errors/            # Manejo de errores (OCP)
│   ├── AppError.js
│   ├── ValidationError.js
│   ├── NotFoundError.js
│   ├── UnauthorizedError.js
│   └── index.js
│
├── middleware/
│   ├── errorHandler.js  # Centralizado
│   ├── auth.js
│   └── observability.js
│
├── routes/            # Presentación (DIP)
│   ├── assetRoutes.js
│   ├── authRoutes.js
│   └── uploadRoutes.js
│
├── config/
│   ├── supabaseClient.js
│   └── dependencies.js   # DI container
│
└── server.js          # Bootstrap
```

**Responsabilidades**:

- **Services**: Lógica de negocio, orquestación, validaciones de dominio
- **Repositories**: Queries, transformaciones DB ↔ objeto, manejo de errores de DB
- **Validators**: Schemas Zod, validaciones de formato/estructura
- **Routes**: Parsing de requests, llamadas a servicios, formateo de responses
- **Errors**: Jerarquía de errores tipados con metadata
- **Middleware**: Cross-cutting concerns (auth, logging, error handling)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los servicios tienen tests unitarios con >80% de cobertura usando mocks.
- **SC-002**: Se puede agregar un nuevo repository (ej: CacheRepository) sin modificar ningún servicio existente.
- **SC-003**: Todos los endpoints retornan errores en formato consistente verificable via tests de integración.
- **SC-004**: El tiempo de ejecución de tests unitarios es <5 segundos (sin conexiones externas).
- **SC-005**: No existen archivos o imports relacionados con SQLite en el codebase tras la refactorización.
- **SC-006**: Todas las rutas usan dependency injection - no hay imports directos de Supabase en routes.

## Non-Functional & Quality Requirements

### Performance

- **NFR-001**: La refactorización NO MUST degradar performance de endpoints existentes (±5% latencia actual).
- **NFR-002**: Tests unitarios MUST ejecutarse en <5s, tests de integración en <30s.

### Maintainability

- **NFR-003**: Cada servicio MUST tener <200 SLOC (Source Lines of Code), excluyendo comentarios, whitespace, e imports. Medido con herramientas como cloc o ESLint max-lines.
- **NFR-004**: Cyclomatic complexity MUST ser ≤10 por método/función (medido con ESLint complexity rule).
- **NFR-005**: Todos los módulos públicos MUST tener JSDoc documentation con @param, @returns, y @throws tags.

### Testability

- **NFR-006**: Servicios MUST ser testeables sin setup de DB/external services.
- **NFR-007**: El 100% de los servicios MUST tener tests con assertions explícitas.

### Code Quality

- **NFR-008**: Aplicar ESLint con reglas SOLID (no-circular-dependencies, max-lines, etc.).
- **NFR-009**: MUST pasar análisis de SonarQube/code-quality con rating A.

## Assumptions

- El proyecto usa Node.js 18+ con soporte para ES Modules/CommonJS híbrido.
- Fastify continuará siendo el framework - no cambio a Express/Koa.
- Supabase permanece como único backend - no hay planes de migración a corto plazo.
- El equipo está familiarizado con principios SOLID pero no con DDD/Hexagonal.
- Hay ambiente de desarrollo/staging separado para tests de integración.
- No hay presión de deadlines - se prioriza calidad sobre velocidad.

## Notes

- Esta refactorización es **técnica/interna** - no cambia funcionalidades user-facing.
- Se debe poder hacer rollback limpio si surgen problemas.
- Considerar feature flags para ir activando código nuevo gradualmente.
- Documentar patrones y decisiones arquitectónicas en ADRs (Architecture Decision Records) usando formato Michael Nygard (Context, Decision, Consequences, Status).
- Esta spec NO incluye migraciones de datos - solo refactorización de código.

## Progress update (2025-11-06)

- Implementado (parcial / incremental):
	- `AssetRepository` (encapsula queries a `assets` y `asset_versions`).
	- `AssetService` (orquesta creación/actualización/eliminación de assets y crea versiones cuando aplica).
	- `UploadService` (subida y borrado de archivos en Supabase Storage) y `AuthService` (wrapping de operaciones auth).
	- `createDependencies()` en `src/config/dependencies.js` para inyectar `assetService`, `uploadService`, `authService` y clientes Supabase.
	- Rutas migradas incrementalmente: `assetRoutes.js`, `uploadRoutes.js`, `authRoutes.js` ahora aceptan `deps` y delegan en services cuando están disponibles. El código legacy permanece comentado dentro de las rutas como fallback/guía.

- Qué queda por completar (siguientes PRs):
	1. Implementar jerarquía de errores (`src/errors/*`) y middleware `src/middleware/errorHandler.js` y sustituir gradualmente `utils/errorMapper.js`.
	2. Añadir tests unitarios y de integración (AssetService, UploadService, AuthService, repositories) y aseguramiento de coverage.
	3. CI checks (buscar imports directos a Supabase en `src/routes/`, secret handling para `SUPABASE_SERVICE_ROLE_KEY`).
	4. Completar migración de todas las rutas restantes (checklists, events, etc.) y eliminar/archivar código legacy sólo cuando todas las rutas usan services.

Nota: la estrategia seguida fue migración por funcionalidad (feature-by-feature) con fallbacks comentados para minimizar riesgo y permitir pruebas en cada paso.

## Glossary

- **Repository**: Capa de acceso a datos que abstrae operaciones CRUD contra Supabase. Responsable de queries y transformaciones DB ↔ objetos.
- **Service**: Capa de lógica de negocio que orquesta repositories, valida reglas de dominio y emite eventos.
- **Adapter**: (Futura feature) Capa de integración con plataformas externas (Twitch, YouTube, etc.). No confundir con repositories.
- **SLOC**: Source Lines of Code - líneas efectivas de código excluyendo comentarios y whitespace.
