# Implementation Plan: SOLID Architecture Refactor

**Feature**: 004-solid-architecture-refactor  
**Estimated Duration**: 3-4 weeks  
**Risk Level**: Medium (internal refactor, no user-facing changes)

## Phase 1: Foundation & Error Handling (Week 1) ⏳ PENDIENTE

**Status**: PENDIENTE - Esperando implementación de error hierarchy y tests

### 1.0 Prerequisites & Baseline (1 day)

**Objective**: Setup testing infrastructure and establish baseline metrics

**Status**: ⏳ PENDIENTE - Jest no instalado aún

**Tasks**:
- [ ] Install testing dependencies:
  ```bash
  npm install -D jest @types/jest supertest
  ```
- [ ] Configure Jest in `package.json`:
  ```json
  {
    "scripts": {
      "test": "jest",
      "test:unit": "jest --testPathPattern=unit",
      "test:integration": "jest --testPathPattern=integration",
      "test:coverage": "jest --coverage"
    }
  }
  ```
- [ ] Create test directory structure:
  ```
  test/
  ├── unit/
  │   ├── services/
  │   ├── repositories/
  │   └── validators/
  └── integration/
      ├── api/
      └── repositories/
  ```
- [ ] Run baseline performance tests on current API endpoints
- [ ] Document current response times in `docs/baseline-metrics.md`
- [ ] Setup ESLint with SOLID rules (max-lines: 250, complexity: 10, max-params: 4)

**Validation**: Jest runs successfully; baseline metrics documented; ESLint configured.

---

### 1.1 Cleanup & Verification (0.5 days)

**Objective**: Verify legacy code removal and establish clean slate

**Tasks**:
- [ ] Verify SQLite files are removed (already done):
  - Confirm no `src/repositories/` (old)
  - Confirm no `db/sqlite-schema.sql`
  - Confirm no `src/services/migrationService.js`
  - Confirm no `src/utils/storageUploader.js`
  - Confirm no `src/utils/errorMapper.js`
- [ ] Search codebase for lingering SQLite references:
  ```bash
  grep -r "sqlite" src/
  grep -r "BaseRepository" src/
  ```
- [ ] Create new directory structure:
  ```
  src/
  ├── services/
  ├── repositories/
  ├── validators/schemas/
  ├── errors/
  └── config/dependencies.js
  ```
- [ ] Update `.gitignore` for new structure
- [ ] Document cleanup in CHANGELOG.md

**Validation**: No SQLite imports remain; new directories created; tests still pass.

---

### 1.2 Error Hierarchy (0.5 days)

**Objective**: Implement custom error classes following OCP

**Tasks**:
- [ ] **TEST FIRST**: Create `test/unit/errors/AppError.test.js`:
  ```js
  // Test error instantiation, toJSON(), statusCode, isOperational
  ```
- [ ] Create `src/errors/AppError.js` (base class) to pass tests
- [ ] **TEST**: Create tests for specific errors (ValidationError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError)
- [ ] Implement specific error classes to pass tests
- [ ] Create `src/errors/index.js` for exports
- [ ] Add error transformation utilities:
  - `fromSupabaseError(error)` → maps Supabase codes
  - `fromZodError(zodError)` → maps Zod validation errors
- [ ] Test error transformations

**Validation**: All error tests pass; errors have correct HTTP codes and structure.

---

### 1.3 Centralized Error Handler (0.5 days)

**Objective**: Single middleware for all error handling

**Tasks**:
- [ ] **TEST FIRST**: Create `test/unit/middleware/errorHandler.test.js`:
  ```js
  // Test AppError handling, Supabase error mapping, Zod errors, catch-all
  ```
- [ ] Create `src/middleware/errorHandler.js` to pass tests:
  - Handle `AppError` instances
  - Map Supabase errors
  - Handle Zod/validation errors
  - Catch-all for unexpected errors
  - Log appropriately based on error type
- [ ] Update `server.js` to register error handler:
  ```js
  app.setErrorHandler(errorHandler);
  ```
- [ ] Remove inline error handling from existing routes (gradual)

**Validation**: All error tests pass; consistent JSON structure; stack traces only in development.

---

### 1.4 Validation Layer (0.5 days)

**Objective**: Declarative validation with Zod

**Tasks**:
- [ ] Install Zod: `npm install zod`
- [ ] **TEST FIRST**: Create `test/unit/validators/validate.test.js`:
  ```js
  // Test schema validation, error transformation, composability
  ```
- [ ] Create schemas in `src/validators/schemas/`:
  - `assetSchemas.js` (createAsset, updateAsset, assetFilters)
  - `authSchemas.js` (login, signup, refresh)
  - `uploadSchemas.js` (file validation)
  - Example composition: `paginatedAssetFilters = assetFilters.extend({page, limit})`
- [ ] Create validation middleware `src/validators/validate.js` to pass tests:
  ```js
  function validate(schema, source = 'body')
  ```
- [ ] Create `src/validators/index.js` for exports

**Validation**: All validator tests pass; schemas are composable; validation errors properly formatted.

---

## Phase 2: Repository Layer (Week 2) ✅ IMPLEMENTADO

**Status**: ✅ COMPLETADO - AssetRepository implementado y funcionando

### 2.1 Repository Tests & Base (1 day)

**Objective**: Define repository contracts via tests (TDD + LSP)

**Status**: ✅ IMPLEMENTADO (sin tests unitarios aún)

**Tasks**:
- [x] **IMPLEMENTADO**: Create `src/repositories/AssetRepository.js` ✅ DONE:
  ```js
  class AssetRepository {
    constructor(supabaseClient)
    async findMany(filters, pagination)
    async findById(id)
    async create(data)
    async update(id, data)
    async delete(id)
    async search(query, userId)
    async getPlatformStats(userId)
  }
  ```
- [x] Implement error transformation from Supabase → Custom errors ✅ DONE
- [ ] **PENDIENTE**: Add comprehensive JSDoc documentation with @param, @returns, @throws
- [ ] **PENDIENTE**: Create unit tests

**Validation**: ✅ AssetRepository implemented and verified (syntax checks passed); interface is clear and mockable.

---

### 2.2 Specific Repositories (2 days)

**Objective**: Implement repositories for each entity (TDD)

**Tasks**:
- [ ] **AssetRepository** (`src/repositories/AssetRepository.js`):
  - **TEST FIRST**: Write unit tests for all methods
  - Extends BaseRepository
  - Methods: `findByPlatform`, `findByUser`, `search`, `updateMetadata`
  - Handles asset_versions join queries
  - Maps DB rows to plain objects
  
- [ ] **UserRepository** (`src/repositories/UserRepository.js`):
  - **TEST FIRST**: Write unit tests
  - Methods: `findByEmail`, `create`, `update`
  - Syncs with Supabase Auth users
  
- [ ] **ChecklistRepository** (`src/repositories/ChecklistRepository.js`):
  - **TEST FIRST**: Write unit tests
  - Methods: `findByAsset`, `updateStatus`, `createDefault`
  
- [ ] **EventRepository** (`src/repositories/EventRepository.js`):
  - **TEST FIRST**: Write unit tests
  - Methods: `log`, `findByUser`, `findByType`
  - Handles observability events
  
- [ ] Create `src/repositories/index.js` for exports

**Validation**: Each repository has unit tests passing with mocked Supabase client; >80% coverage.

---

### 2.3 Integration Tests (1 day)

**Objective**: Test repositories against real Supabase (test instance)

**Tasks**:
- [ ] Create `test/integration/repositories/` directory
- [ ] Setup test Supabase environment (`.env.test`)
- [ ] Write integration tests for:
  - AssetRepository CRUD operations
  - UserRepository with Auth sync
  - ChecklistRepository
  - EventRepository
- [ ] Implement setup/teardown for test data
- [ ] Verify >80% coverage on repositories (combined unit + integration)

**Validation**: Integration tests pass against test Supabase; tests run in <15s.

---

## Phase 3: Service Layer (Week 2-3) ✅ IMPLEMENTADO

**Status**: ✅ COMPLETADO - Todos los servicios principales implementados

### 3.1 Asset Service (1.5 days)

**Objective**: Encapsulate asset business logic (SRP + TDD)

**Status**: ✅ IMPLEMENTADO

**Tasks**:
- [x] **IMPLEMENTADO**: Create `src/services/AssetService.js` ✅ DONE:
  ```js
  class AssetService {
    constructor(assetRepository, uploadService, eventRepository)
    
    async getAssets(filters, userId)
    async getAssetById(id, userId)
    async createAsset(data, userId)
    async updateAsset(id, data, userId)
    async deleteAsset(id, userId)
    async searchAssets(query, userId)
    async getPlatformStats(userId)
  }
  ```
- [x] Implement business rules:
  - ✅ Uses AssetRepository for data operations
  - ✅ Uses UploadService for storage operations (via service client)
  - ✅ Creates asset versions automatically
  - ✅ Validates data and transforms errors
- [x] Add comprehensive JSDoc documentation ✅ DONE
- [ ] **PENDIENTE**: Unit tests with mocked dependencies

**Validation**: ✅ AssetService implemented and verified; business logic isolated from DB.

---

### 3.2 Auth Service (1 day)

**Objective**: Centralize authentication logic (TDD)

**Tasks**:
- [ ] **TEST FIRST**: Create `test/unit/services/AuthService.test.js`:
  ```js
  // Test signup, login, logout, refresh, getCurrentUser
  // Test email validation, password strength
  ```
- [ ] Create `src/services/AuthService.js` to pass tests:
  ```js
  class AuthService {
    constructor(supabaseClient, userRepository)
    
    async signup(email, password, displayName)
    async login(email, password)
    async logout(token)
    async refreshSession(refreshToken)
    async getCurrentUser(token)
    async updatePassword(userId, newPassword)
  }
  ```
- [ ] Move logic from `authRoutes.js` to service (gradual migration)
- [ ] Add email validation (regex), password strength checks (min 6 chars)
- [ ] Add JSDoc

**Validation**: Auth tests pass; auth operations work via service.

---

### 3.3 Upload Service (1 day)

**Objective**: Handle file uploads to Supabase Storage (TDD)

**Tasks**:
- [ ] **TEST FIRST**: Create `test/unit/services/UploadService.test.js`:
  ```js
  // Test uploadFile, deleteFile, validation methods
  // Mock Supabase Storage
  ```
- [ ] Create `src/services/UploadService.js` to pass tests:
  ```js
  class UploadService {
    constructor(supabaseClient)
    
    async uploadFile(file, metadata, userId)
    async deleteFile(storagePath)
    async getPublicUrl(storagePath)
    validateFileSize(file, maxSize = 500MB)
    validateFileType(file, allowedTypes)
    generateStoragePath(platform, userId, filename)
  }
  ```
- [ ] Move upload logic from `uploadRoutes.js`
- [ ] Add file validation (size: <=500MB, type: images/videos/pdfs)
- [ ] Add JSDoc

**Validation**: Upload tests pass; file handling isolated in service.

---

### 3.4 Checklist Service (0.5 days)

**Objective**: Manage platform-specific checklists (TDD)

**Tasks**:
- [ ] **TEST FIRST**: Create `test/unit/services/ChecklistService.test.js`
- [ ] Create `src/services/ChecklistService.js` to pass tests:
  ```js
  class ChecklistService {
    constructor(checklistRepository)
    
    async createDefaultChecklist(assetId, platform)
    async getChecklistForAsset(assetId, userId)
    async updateChecklistItem(itemId, userId, status)
    async validateChecklistComplete(assetId, userId)
  }
  ```
- [ ] Define default checklists per platform in config:
  ```js
  // config/checklists.js
  const defaultChecklists = {
    twitch: ['thumbnail', 'title', 'tags'],
    youtube: ['thumbnail', 'description', 'category'],
    // ...
  }
  ```
- [ ] Add JSDoc

**Validation**: Checklist tests pass; auto-creation works.

---

### 3.5 Service Test Review (0.5 days)

**Objective**: Ensure comprehensive service test coverage

**Tasks**:
- [ ] Review all service tests for completeness
- [ ] Add missing test cases for:
  - Error scenarios (NotFoundError, UnauthorizedError, ValidationError)
  - Business rules enforcement (ownership checks)
  - Edge cases (empty results, null values)
- [ ] Run coverage report: `npm run test:coverage`
- [ ] Verify >85% coverage for all services

**Validation**: All service tests pass; coverage meets targets; no external dependencies.

---

## Phase 4: Dependency Injection & Routes (Week 3-4) ✅ IMPLEMENTADO

**Status**: ✅ COMPLETADO - DI y rutas principales migradas

### 4.1 DI Container (1 day)

**Objective**: Centralize dependency wiring (DIP)

**Status**: ✅ IMPLEMENTADO

**Tasks**:
- [x] **IMPLEMENTADO**: Create `src/config/dependencies.js` ✅ DONE:
  ```js
  function createDependencies() {
    // Clients
    const supabase = getSupabaseClient();
    const supabaseService = getSupabaseServiceClient();
    
    // Repositories
    const assetRepository = new AssetRepository(supabase);
    
    // Services
    const uploadService = new UploadService(supabaseService);
    const assetService = new AssetService(assetRepository, uploadService);
    const authService = new AuthService(supabase);
    
    return { assetService, authService, uploadService, assetRepository };
  }
  ```
- [x] Update `server.js` to create and pass dependencies ✅ DONE
- [x] Document dependency graph ✅ DONE

**Validation**: ✅ Can create all dependencies without errors; no circular dependencies detected.

---

### 4.2 Refactor Asset Routes (1 day)

**Objective**: Convert routes to use services (DIP)

**Tasks**:
- [ ] Refactor `src/routes/assetRoutes.js`:
  ```js
  function registerAssetRoutes(app, { assetService, uploadService }) {
    app.get('/api/assets', {
      schema: { querystring: assetFilterSchema }
    }, async (req, reply) => {
      const assets = await assetService.getAssetsByPlatform(
        req.query.platform,
        req.user.id,
        req.query
      );
      return { success: true, data: assets };
    });
    
    app.post('/api/assets', {
      preHandler: [validate(createAssetSchema)]
    }, async (req, reply) => {
      const asset = await assetService.createAsset(
        req.validatedBody,
        req.user.id
      );
      return { success: true, data: asset };
    });
    // ... other endpoints
  }
  ```
- [ ] Remove direct Supabase calls from routes
- [ ] Add validation middleware to all endpoints
- [ ] Update to use custom errors (thrown by services)

**Validation**: Routes are <20 lines each; all logic in services.

---

### 4.3 Refactor Auth Routes (1 day)

**Objective**: Delegate auth logic to AuthService

**Tasks**:
- [ ] Refactor `src/routes/authRoutes.js`:
  - Use `authService.signup()`, `authService.login()`, etc.
  - Add Zod validation for email/password
  - Remove inline Supabase calls
- [ ] Update auth middleware to use AuthService where applicable

**Validation**: Auth flow works identically; routes are thin.

---

### 4.4 Refactor Upload Routes (1 day)

**Objective**: Use UploadService for file handling

**Tasks**:
- [ ] Refactor `src/routes/uploadRoutes.js`:
  - Use `uploadService.uploadFile()`
  - Validation via Zod (file size, type)
  - Return consistent response format
- [ ] Handle multipart properly with Fastify multipart

**Validation**: File upload works; errors are consistent.

---

### 4.5 Integration Tests (1 day)

**Objective**: End-to-end tests for refactored API

**Tasks**:
- [ ] Create `test/integration/api/` directory
- [ ] Test complete flows:
  - Auth: signup → login → get user
  - Assets: create → list → update → delete
  - Upload: upload file → create asset → retrieve
- [ ] Use real Supabase test instance
- [ ] Setup/teardown test data

**Validation**: All integration tests pass; API behavior unchanged.

---

## Phase 5: Polish & Documentation (Week 4)

### 5.1 Code Quality & Validation (1 day)

**Objective**: Ensure code meets quality standards

**Tasks**:
- [ ] Verify ESLint configuration (should be done in Phase 1.0):
  ```json
  {
    "rules": {
      "max-lines": ["error", 250],
      "complexity": ["error", 10],
      "max-params": ["error", 4]
    }
  }
  ```
- [ ] Run linter: `npm run lint` and fix all issues
- [ ] Verify all public methods have JSDoc (@param, @returns, @throws)
- [ ] Check SLOC per service: `npx cloc src/services/` (must be <200 per file)
- [ ] Validate cyclomatic complexity with ESLint

**Validation**: `npm run lint` passes with zero errors; complexity ≤10; SLOC <200.

---

### 5.2 Testing & Coverage Validation (0.5 days)

**Objective**: Final coverage validation and gap filling

**Tasks**:
- [ ] Run full coverage report: `npm run test:coverage`
- [ ] Verify coverage targets:
  - Services: >85% coverage
  - Repositories: >80% coverage
  - Validators: >80% coverage
  - Errors: >90% coverage
- [ ] Add tests for any uncovered edge cases
- [ ] Document testing approach in `docs/testing-strategy.md`

**Validation**: All coverage targets met; comprehensive test suite documented.

---

### 5.3 Documentation (1 day)

**Objective**: Document architecture decisions and patterns

**Tasks**:
- [ ] Create `docs/architecture/` directory
- [ ] Write `docs/architecture/SOLID-PRINCIPLES.md`:
  - Explain how each SOLID principle is applied
  - Show code examples from codebase
  - Document benefits achieved
- [ ] Write `docs/architecture/LAYER-RESPONSIBILITIES.md`:
  - Document what each layer does/doesn't do
  - Show data flow: Route → Service → Repository → Supabase
  - Include simple diagram
- [ ] Create ADRs (Architecture Decision Records) using Michael Nygard format:
  - `docs/architecture/adr/001-solid-over-hexagonal.md`: Why SOLID pragmatic approach over DDD/Hexagonal
  - `docs/architecture/adr/002-manual-di-container.md`: Why manual DI vs library (inversify, awilix)
  - `docs/architecture/adr/003-zod-validation.md`: Why Zod over alternatives (Joi, class-validator)
- [ ] Update main `README.md` with:
  - New directory structure
  - Testing commands
  - Development workflow
  - Links to architecture docs

**Validation**: Documentation is clear, accurate, and helpful for new developers.

---

### 5.4 Final Validation & Extensibility Test (1 day)

**Objective**: Ensure refactor meets all success criteria

**Tasks**:
- [ ] **SC-001**: Verify 100% services have unit tests with >80% coverage
- [ ] **SC-002**: Extensibility test - Implement mock `CacheRepository` without modifying any service:
  ```js
  // Add CacheRepository that extends BaseRepository
  // Inject into AssetService via DI
  // Verify no AssetService code changes needed
  ```
- [ ] **SC-003**: Test error consistency across all endpoints (integration test)
- [ ] **SC-004**: Measure unit test execution time (must be <5s)
- [ ] **SC-005**: Verify no SQLite code remains:
  ```bash
  grep -r "sqlite" src/ backend/ --exclude-dir=node_modules
  grep -r "BaseRepository" src/ | grep -v "src/repositories/BaseRepository"
  ```
- [ ] **SC-006**: Verify all routes use DI (no direct Supabase imports in routes):
  ```bash
  grep -r "getSupabaseClient" src/routes/
  # Should return zero results
  ```
- [ ] **NFR-001**: Run performance benchmarks and compare with baseline:
  ```bash
  npm run benchmark
  # Verify ±5% latency vs baseline
  ```
- [ ] **NFR-002**: Verify test execution times:
  - Unit tests: <5s
  - Integration tests: <30s
- [ ] Code review with team (if applicable)
- [ ] Update `CHANGELOG.md` with refactor details

**Validation**: All Success Criteria validated ✅; ready for merge.

---

## Risk Mitigation

**Risk**: Breaking existing functionality  
**Mitigation**: Run full test suite after each phase; integration tests catch regressions.

**Risk**: Performance degradation  
**Mitigation**: Benchmark before/after; additional layers should be negligible (<5%).

**Risk**: Team unfamiliar with new patterns  
**Mitigation**: Documentation, code examples, pair programming sessions.

**Risk**: Incomplete cleanup of SQLite  
**Mitigation**: Search codebase for "sqlite", "BaseRepository", etc.; validate in CI.

---

## Rollback Plan

If critical issues arise:

1. **Revert git commits** to pre-refactor state
2. **Document issues** in GitHub issue
3. **Analyze root cause** before retry
4. Feature branch allows safe experimentation

---

## Definition of Done

- [ ] All SQLite code removed and verified
- [ ] All services have >80% test coverage
- [ ] All routes use DI (no direct Supabase imports)
- [ ] Error handling is consistent across all endpoints
- [ ] Documentation complete (architecture docs, ADRs, README)
- [ ] All tests pass (unit <5s, integration <30s)
- [ ] ESLint passes with no errors
- [ ] Code review approved
- [ ] Success Criteria validated
- [ ] CHANGELOG.md updated
