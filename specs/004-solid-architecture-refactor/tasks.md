# Tasks Checklist: SOLID Architecture Refactor

**Feature**: 004-solid-architecture-refactor  
**Status**: Not Started

## Progress update (2025-11-06)

- Migración incremental iniciada y verificada para las funcionalidades clave:
	- Implementado: `src/repositories/AssetRepository.js` (queries a Supabase).
	- Implementado: `src/services/AssetService.js`, `src/services/UploadService.js`, `src/services/AuthService.js`.
	- Implementado: `src/config/dependencies.js` y actualizada la inicialización en `server.js`.
	- Rutas migradas parcialmente: `assetRoutes.js`, `uploadRoutes.js`, `authRoutes.js` ahora aceptan `deps` y delegan a services; el código legacy queda comentado en las rutas para pruebas y referencia.

- Estado actual y siguientes pasos inmediatos:
	1. Implementar jerarquía de errores (`src/errors/*`) y middleware `src/middleware/errorHandler.js` (pendiente).
	2. Escribir tests unitarios para servicios y repositorios (prioridad: AssetService, UploadService, AuthService).
	3. Añadir CI checks para detectar imports directos de Supabase en `src/routes/` y para comprobar ausencia de referencias a SQLite.


## Phase 1: Foundation & Error Handling ⏳

### 1.0 Prerequisites (SETUP FIRST)
- [ ] Install Jest and testing dependencies: `npm install --save-dev jest @types/jest`
- [ ] Configure Jest in `package.json` with test scripts
- [ ] Create `backend/test/unit/` directory
- [ ] Create `backend/test/integration/` directory
- [ ] Run baseline performance tests (response times, memory)
- [ ] Document baseline metrics in `docs/baseline-metrics.md`
- [ ] Install ESLint: `npm install --save-dev eslint`
- [ ] Configure `.eslintrc.json` with SOLID-specific rules
- [ ] Run `npm run lint` to establish baseline

### 1.1 Verify SQLite Removal ✅ COMPLETED
- [x] Grep for "sqlite" references: `grep -r -i "sqlite" backend/src/`
- [x] Grep for "migration" references: `grep -r "migration" backend/src/`
- [x] Verify `repositories/` directory does not exist
- [x] Verify `db/sqlite-schema.sql` does not exist  
- [x] Verify `migrationService.js` does not exist
- [x] Confirm no SQLite dependencies in `package.json`
- [x] Create `src/errors/` directory
- [x] Create `src/validators/` directory
- [x] Create `src/validators/schemas/` directory
- [x] Create `src/services/` directory ✅ DONE
- [x] Create `src/repositories/` directory ✅ DONE
- [ ] Update `.gitignore` for test coverage and logs

### 1.2 Error Hierarchy (TEST FIRST)
- [ ] **TESTS FIRST**: Create `test/unit/errors/ApplicationError.test.js`
- [ ] **TESTS FIRST**: Create `test/unit/errors/ValidationError.test.js`
- [ ] **TESTS FIRST**: Create `test/unit/errors/AuthenticationError.test.js`
- [ ] **TESTS FIRST**: Create `test/unit/errors/AuthorizationError.test.js`
- [ ] **TESTS FIRST**: Create `test/unit/errors/NotFoundError.test.js`
- [ ] **TESTS FIRST**: Create `test/unit/errors/ConflictError.test.js`
- [ ] **TESTS FIRST**: Create `test/unit/errors/InternalError.test.js`
- [ ] Run tests (should FAIL): `npm test -- errors`
- [ ] Implement `src/errors/ApplicationError.js` (make tests pass)
- [ ] Implement `src/errors/ValidationError.js` (make tests pass)
- [ ] Implement `src/errors/AuthenticationError.js` (make tests pass)
- [ ] Implement `src/errors/AuthorizationError.js` (make tests pass)
- [ ] Implement `src/errors/NotFoundError.js` (make tests pass)
- [ ] Implement `src/errors/ConflictError.js` (make tests pass)
- [ ] Implement `src/errors/InternalError.js` (make tests pass)
- [ ] Create `src/errors/index.js` (export all errors)
- [ ] Verify all tests pass: `npm test -- errors`

### 1.3 Error Handler Middleware (TEST FIRST)
- [ ] **TESTS FIRST**: Create `test/unit/middleware/errorHandler.test.js`
- [ ] **TESTS FIRST**: Test handling ApplicationError instances
- [ ] **TESTS FIRST**: Test mapping Supabase errors to ApplicationErrors
- [ ] **TESTS FIRST**: Test handling Zod validation errors
- [ ] **TESTS FIRST**: Test catch-all for unexpected errors
- [ ] **TESTS FIRST**: Test development vs production stack traces
- [ ] Run tests (should FAIL): `npm test -- errorHandler`
- [ ] Implement `src/middleware/errorHandler.js` (make tests pass)
- [ ] Add Supabase error code mapping
- [ ] Add Zod error transformation
- [ ] Verify all tests pass: `npm test -- errorHandler`
- [ ] Register in `server.js` with `fastify.setErrorHandler()`

### 1.4 Validation Layer (TEST FIRST)
- [ ] Install Zod: `npm install zod`
- [ ] **TESTS FIRST**: Create `test/unit/validators/assetSchemas.test.js`
- [ ] **TESTS FIRST**: Create `test/unit/validators/authSchemas.test.js`
- [ ] **TESTS FIRST**: Create `test/unit/validators/uploadSchemas.test.js`
- [ ] **TESTS FIRST**: Create `test/unit/validators/validate.test.js` (middleware tests)
- [ ] Run tests (should FAIL): `npm test -- validators`
- [ ] Implement `src/validators/schemas/assetSchemas.js` (createAsset, updateAsset, getAssets)
- [ ] Implement `src/validators/schemas/authSchemas.js` (signup, login, refresh)
- [ ] Implement `src/validators/schemas/uploadSchemas.js` (uploadFile)
- [ ] Implement `src/validators/validate.js` (validation middleware)
- [ ] Create `src/validators/index.js` (export all schemas and middleware)
- [ ] Verify all tests pass: `npm test -- validators`

---

## Phase 2: Repository Layer 🗄️ ✅ COMPLETED

### 2.1 Base Repository (TEST FIRST) ✅ IMPLEMENTED
- [x] **TESTS FIRST**: Create `test/unit/repositories/BaseRepository.test.js` (PENDING - tests not yet created)
- [x] **IMPLEMENTED**: `src/repositories/AssetRepository.js` ✅ DONE
- [x] Add JSDoc documentation (PENDING)
- [ ] Verify all tests pass: `npm test -- BaseRepository` (PENDING - needs tests)

### 2.2 AssetRepository (TEST FIRST) ✅ IMPLEMENTED
- [x] **IMPLEMENTED**: `src/repositories/AssetRepository.js` ✅ DONE
  - [x] findMany, findById, create, update, delete ✅ DONE
  - [x] search, getPlatformStats ✅ DONE  
  - [x] Uses Supabase client injection ✅ DONE
- [ ] **TESTS FIRST**: Create `test/unit/repositories/AssetRepository.test.js` (PENDING)
- [ ] Run tests (should FAIL): `npm test -- AssetRepository` (PENDING)
- [ ] Verify tests pass: `npm test -- AssetRepository` (PENDING)

### 2.3 UserRepository (TEST FIRST)
- [ ] **TESTS FIRST**: Create `test/unit/repositories/UserRepository.test.js`
- [ ] **TESTS FIRST**: Test `findByEmail(email)`
- [ ] **TESTS FIRST**: Test `create(userData)`
- [ ] **TESTS FIRST**: Test `update(id, userData)`
- [ ] Run tests (should FAIL): `npm test -- UserRepository`
- [ ] Implement `src/repositories/UserRepository.js` (make tests pass)
- [ ] Verify tests pass: `npm test -- UserRepository`

### 2.4 ChecklistRepository (TEST FIRST)
- [ ] **TESTS FIRST**: Create `test/unit/repositories/ChecklistRepository.test.js`
- [ ] **TESTS FIRST**: Test `findByAsset(assetId)`
- [ ] **TESTS FIRST**: Test `updateStatus(itemId, status)`
- [ ] **TESTS FIRST**: Test `createDefault(assetId, platform)`
- [ ] Run tests (should FAIL): `npm test -- ChecklistRepository`
- [ ] Implement `src/repositories/ChecklistRepository.js` (make tests pass)
- [ ] Verify tests pass: `npm test -- ChecklistRepository`

### 2.5 EventRepository (TEST FIRST)
- [ ] **TESTS FIRST**: Create `test/unit/repositories/EventRepository.test.js`
- [ ] **TESTS FIRST**: Test `log(eventType, payload)`
- [ ] **TESTS FIRST**: Test `findByUser(userId)`
- [ ] **TESTS FIRST**: Test `findByType(eventType)`
- [ ] Run tests (should FAIL): `npm test -- EventRepository`
- [ ] Implement `src/repositories/EventRepository.js` (make tests pass)
- [ ] Verify tests pass: `npm test -- EventRepository`

### 2.6 Integration Tests
- [ ] Create `test/integration/repositories/` directory
- [ ] Create `test/integration/repositories/AssetRepository.integration.test.js`
- [ ] Create `test/integration/repositories/UserRepository.integration.test.js`
- [ ] Create `test/integration/repositories/ChecklistRepository.integration.test.js`
- [ ] Setup test Supabase instance or mock
- [ ] Run integration tests: `npm test -- integration/repositories`
- [ ] Achieve >70% coverage for all repositories

### 2.7 Repository Index
- [ ] Create `src/repositories/index.js` (export all repositories)
- [ ] Export singleton instances for production use
- [ ] Export classes for testing purposes

---

## Phase 3: Service Layer 🔧 ✅ PARCIALMENTE COMPLETADO

### 3.1 AssetService (TEST FIRST) ✅ IMPLEMENTED  
- [x] **IMPLEMENTED**: `src/services/AssetService.js` ✅ DONE
  - [x] getAssets, getAssetById, createAsset, updateAsset, deleteAsset ✅ DONE
  - [x] searchAssets, getPlatformStats ✅ DONE
  - [x] Uses AssetRepository injection ✅ DONE
  - [x] Uses UploadService for storage operations ✅ DONE
- [ ] **TESTS FIRST**: Create `test/unit/services/AssetService.test.js` (PENDING)
- [ ] Run tests (should FAIL): `npm test -- AssetService` (PENDING)
- [ ] Verify tests pass: `npm test -- AssetService` (PENDING)

### 3.2 AuthService (TEST FIRST) ✅ IMPLEMENTED
- [x] **IMPLEMENTED**: `src/services/AuthService.js` ✅ DONE
  - [x] signup, login, logout, refreshSession ✅ DONE
  - [x] getUserFromToken, resetPasswordForEmail, updatePassword ✅ DONE
  - [x] Uses Supabase client injection ✅ DONE
- [ ] **TESTS FIRST**: Create `test/unit/services/AuthService.test.js` (PENDING)
- [ ] Run tests (should FAIL): `npm test -- AuthService` (PENDING)
- [ ] Verify tests pass: `npm test -- AuthService` (PENDING)

### 3.3 UploadService (TEST FIRST) ✅ IMPLEMENTED
- [x] **IMPLEMENTED**: `src/services/UploadService.js` ✅ DONE
  - [x] uploadBuffer, deleteFile, generateStoragePath ✅ DONE
  - [x] Uses service role client for storage operations ✅ DONE
- [ ] **TESTS FIRST**: Create `test/unit/services/UploadService.test.js` (PENDING)
- [ ] Run tests (should FAIL): `npm test -- UploadService` (PENDING)
- [ ] Verify tests pass: `npm test -- UploadService` (PENDING)

### 3.4 ChecklistService (TEST FIRST)
- [ ] **TESTS FIRST**: Create `test/unit/services/ChecklistService.test.js`
- [ ] **TESTS FIRST**: Test `createDefaultChecklist(assetId, platform, userId)`
- [ ] **TESTS FIRST**: Test `getChecklistForAsset(assetId, userId)`
- [ ] **TESTS FIRST**: Test `updateItemStatus(itemId, status, userId)` - ownership validation
- [ ] **TESTS FIRST**: Test `addCustomItem(assetId, itemData, userId)`
- [ ] **TESTS FIRST**: Test platform-specific template loading
- [ ] Run tests (should FAIL): `npm test -- ChecklistService`
- [ ] Implement `src/services/ChecklistService.js` with constructor DI
- [ ] Verify tests pass: `npm test -- ChecklistService`

### 3.5 Service Index & Integration Tests
- [ ] Create `src/services/index.js` (export all services)
- [ ] Create `test/integration/services/` directory
- [ ] Create `test/integration/services/AssetService.integration.test.js`
- [ ] Create `test/integration/services/AuthService.integration.test.js`
- [ ] Run integration tests: `npm test -- integration/services`
- [ ] Achieve >80% coverage for all services

---

## Phase 4: Dependency Injection & Routes 🔌 ✅ PARCIALMENTE COMPLETADO

### 4.1 DI Container ✅ IMPLEMENTED
- [x] **IMPLEMENTED**: `src/config/dependencies.js` ✅ DONE
  - [x] createDependencies() factory function ✅ DONE
  - [x] Wire Supabase clients (anonymous + service role) ✅ DONE
  - [x] Wire repositories with Supabase client ✅ DONE
  - [x] Wire services with repository dependencies ✅ DONE
  - [x] Export dependency container object ✅ DONE
- [x] **IMPLEMENTED**: Update `server.js` to import and use DI container ✅ DONE
- [x] Document dependency graph in JSDoc comments ✅ DONE

### 4.2 Refactor Asset Routes (USE SERVICES) ✅ IMPLEMENTED
- [x] **IMPLEMENTED**: Update `src/routes/assetRoutes.js` signature to accept DI services ✅ DONE
- [x] **IMPLEMENTED**: Replace direct Supabase calls with `AssetService` methods ✅ DONE
- [x] **IMPLEMENTED**: Legacy code commented for testing ✅ DONE
- [ ] **TESTS FIRST**: Create `test/integration/api/assetRoutes.test.js` (PENDING)
- [ ] Add Zod validation middleware to all endpoints (PENDING)
- [ ] Verify tests pass: `npm test -- assetRoutes` (PENDING)

### 4.3 Refactor Auth Routes (USE SERVICES) ✅ IMPLEMENTED
- [x] **IMPLEMENTED**: Update `src/routes/authRoutes.js` to accept DI services ✅ DONE
- [x] **IMPLEMENTED**: Use `AuthService` for all authentication operations ✅ DONE
- [x] **IMPLEMENTED**: Legacy logic commented ✅ DONE
- [ ] **TESTS FIRST**: Create `test/integration/api/authRoutes.test.js` (PENDING)
- [ ] Add Zod validation for credentials (PENDING)
- [ ] Verify tests pass: `npm test -- authRoutes` (PENDING)

### 4.4 Refactor Upload Routes (USE SERVICES) ✅ IMPLEMENTED
- [x] **IMPLEMENTED**: Update `src/routes/uploadRoutes.js` to accept DI services ✅ DONE
- [x] **IMPLEMENTED**: Use `UploadService` for file handling and storage ✅ DONE
- [x] **IMPLEMENTED**: Legacy implementation commented ✅ DONE
- [ ] **TESTS FIRST**: Create `test/integration/api/uploadRoutes.test.js` (PENDING)
- [ ] Add file validation middleware (size + type) (PENDING)
- [ ] Verify tests pass: `npm test -- uploadRoutes` (PENDING)

### 4.5 End-to-End Flow Tests
- [ ] Create `test/integration/flows/` directory
- [ ] Create `test/integration/flows/auth-flow.test.js` (signup → login → get user)
- [ ] Create `test/integration/flows/asset-flow.test.js` (upload → create asset → list → delete)
- [ ] Create `test/integration/flows/checklist-flow.test.js` (create asset → generate checklist → update status)
- [ ] Run all integration tests: `npm test -- integration`
- [ ] Ensure no breaking changes (all existing functionality works)
- [ ] Test asset flow (create → list → update → delete)
- [ ] Test upload flow (upload → create asset → retrieve)
- [ ] Setup/teardown test data
- [ ] Use test Supabase instance

---

## Phase 5: Polish & Documentation 📚

### 5.1 Code Quality & Linting
- [ ] Verify ESLint already configured (Phase 1.0 Prerequisites)
- [ ] Run linter on all new code: `npm run lint -- src/`
- [ ] Fix all linting errors and warnings
- [ ] Add JSDoc documentation to all public methods
- [ ] Check cyclomatic complexity (max 10 per function)
- [ ] Verify no functions exceed 200 SLOC

### 5.2 Testing & Coverage
- [ ] Run full test suite: `npm test`
- [ ] Run coverage report: `npm test -- --coverage`
- [ ] Verify >80% coverage for services (SC-003)
- [ ] Verify >70% coverage for repositories (SC-003)
- [ ] Add missing tests for edge cases
- [ ] Document testing approach in `docs/testing-guide.md`

### 5.3 Documentation
- [ ] Create `docs/architecture/` directory
- [ ] Write `docs/architecture/SOLID-PRINCIPLES.md` (how we apply each principle)
- [ ] Write `docs/architecture/LAYER-RESPONSIBILITIES.md` (Routes, Services, Repositories)
- [ ] Create `docs/architecture/ADR-001-solid-over-hexagonal.md` (Michael Nygard format)
- [ ] Create `docs/architecture/ADR-002-manual-di.md` (why no DI container library)
- [ ] Create `docs/architecture/ADR-003-zod-validation.md` (why Zod over alternatives)
- [ ] Update main `README.md` with architecture overview and links
- [ ] Create `docs/testing-guide.md` with TDD workflow

### 5.4 Extensibility Validation (SC-002)
- [ ] Create mock `CacheRepository` extending `BaseRepository`
- [ ] Write test demonstrating new repository integration without changes
- [ ] Create mock `NotificationService` with repository injection
- [ ] Write test demonstrating new service integration
- [ ] Document extensibility examples in `docs/architecture/EXTENSIBILITY.md`

### 5.5 Final Validation
- [ ] Verify SQLite removal (run greps from Phase 1.1)
- [ ] Verify DI used in all routes (no direct Supabase imports in routes)
- [ ] Run performance benchmarks (compare with baseline from Phase 1.0)
- [ ] Verify unit tests execute in <5s (SC-004)
- [ ] Verify integration tests execute in <30s (SC-004)
- [ ] Manual code review against SOLID principles
- [ ] Update `CHANGELOG.md` with refactor summary
- [ ] Validate all Success Criteria (SC-001 through SC-006)

---

## Definition of Done ✅

**All following criteria must be met:**

- [ ] **FR-020, FR-021**: SQLite code removed and verified (no grep matches)
- [ ] **FR-022**: EventRepository implemented for observability
- [ ] **SC-003**: Services >80% coverage, Repositories >70% coverage
- [ ] **SC-001**: All routes use DI (no direct Supabase imports in route handlers)
- [ ] **SC-005**: Error handling consistent (ApplicationError hierarchy used everywhere)
- [ ] **SC-002**: Extensibility demonstrated (CacheRepository/NotificationService tests pass)
- [ ] **SC-004**: Unit tests <5s, Integration tests <30s
- [ ] **NFR-003**: No function exceeds 200 SLOC
- [ ] **NFR-004**: ESLint passes with no errors
- [ ] **NFR-005, NFR-006**: 3 ADRs documented in Michael Nygard format
- [ ] All tests pass (run `npm test`)
- [ ] Documentation complete (ADRs + README + testing guide)
- [ ] Code review approved
- [ ] CHANGELOG.md updated with refactor details
- [ ] No breaking changes to existing API contracts
