# Quick Start Guide: SOLID Architecture Refactor

**Feature**: 004-solid-architecture-refactor  
**Estimated Time**: 3-4 weeks  
**Difficulty**: Medium

## Prerequisites

- Node.js 18+ installed
- Git configured
- Understanding of SOLID principles (basic)
- Familiarity with Fastify and Supabase

---

## Step 1: Create Feature Branch (5 min)

```bash
git checkout -b 004-solid-architecture-refactor
git push -u origin 004-solid-architecture-refactor
```

---

## Step 2: Install Dependencies (5 min)

```bash
cd backend

# Install Zod for validation
npm install zod

# Install testing dependencies
npm install -D jest @types/jest supertest

# Install ESLint (if not already)
npm install -D eslint eslint-config-prettier
```

Configure Jest in `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "testEnvironment": "node",
    "coverageDirectory": "coverage",
    "collectCoverageFrom": [
      "src/**/*.js",
      "!src/server.js"
    ]
  }
}
```

---

## Step 3: Clean Up Legacy Code (15 min)

Nota: evitar borrados destructivos. En su lugar, archiva o mueve los archivos y verifica en CI antes de eliminar definitivamente.

PowerShell (seguro, no elimina nada hasta revisar cambios en git):

```powershell
# Mover archivos legacy a carpeta `deprecated/` para revisión antes de eliminar
mkdir deprecated; mkdir deprecated\backend || $null
git mv backend\src\repositories deprecated/backend/ || Write-Host 'no repositories dir to move'
git mv db\sqlite-schema.sql deprecated/db/ || Write-Host 'no sqlite schema to move'
git mv backend\src\services\migrationService.js deprecated/backend/ || Write-Host 'no migrationService to move'
git mv backend\src\utils\storageUploader.js deprecated/backend/ || Write-Host 'no storageUploader to move'
git mv backend\src\utils\errorMapper.js deprecated/backend/ || Write-Host 'no errorMapper to move'

# Inspect changes before committing
git status
git add -A
git commit -m "chore: archive legacy sqlite & uploader/errorMapper files for migration"
```

Cross-platform (git-safe) approach using POSIX-like shells (Linux/macOS or Git Bash):

```bash
# Move instead of delete so changes are reversible
mkdir -p deprecated/backend
git mv src/repositories deprecated/backend/ || echo 'no repositories dir'
git mv db/sqlite-schema.sql deprecated/db/ || echo 'no sqlite schema'
git mv src/services/migrationService.js deprecated/backend/ || echo 'no migrationService'
git mv src/utils/storageUploader.js deprecated/backend/ || echo 'no storageUploader'
git mv src/utils/errorMapper.js deprecated/backend/ || echo 'no errorMapper'

# Review and commit
git status
git add -A
git commit -m "chore: archive legacy files for SOLID refactor"
```

---

## Step 4: Create New Directory Structure (5 min)

```bash
# Create new directories
mkdir -p src/services
mkdir -p src/repositories
mkdir -p src/validators/schemas
mkdir -p src/errors
mkdir -p test/unit/{services,repositories,validators}
mkdir -p test/integration/{api,repositories}
mkdir -p docs/architecture
```

---

## Step 5: Implement Error Hierarchy (30 min)

Create base error class:

**`src/errors/AppError.js`**
```javascript
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      ...(this.details && { details: this.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
    };
  }
}

module.exports = AppError;
```

Create specific errors (copy pattern from spec).

Create **`src/errors/index.js`**:
```javascript
module.exports = {
  AppError: require('./AppError'),
  ValidationError: require('./ValidationError'),
  NotFoundError: require('./NotFoundError'),
  UnauthorizedError: require('./UnauthorizedError'),
  ForbiddenError: require('./ForbiddenError'),
  ConflictError: require('./ConflictError')
};
```

---

## Step 6: Create Error Handler Middleware (20 min)

**`src/middleware/errorHandler.js`**
```javascript
const { AppError } = require('../errors');
const { logError } = require('./observability');

function errorHandler(error, request, reply) {
  logError(error, {
    url: request.url,
    method: request.method,
    userId: request.user?.id
  });

  if (error instanceof AppError) {
    return reply.status(error.statusCode).send(error.toJSON());
  }

  // Map Supabase errors
  if (error.code === 'PGRST116') {
    return reply.status(404).send({
      error: 'NOT_FOUND',
      message: 'Resource not found'
    });
  }

  // Generic error
  return reply.status(500).send({
    error: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'An unexpected error occurred'
  });
}

module.exports = { errorHandler };
```

Register in **`server.js`**:
```javascript
const { errorHandler } = require('./middleware/errorHandler');

// After all routes
app.setErrorHandler(errorHandler);
```

---

## Step 7: Setup Validation (30 min)

Install Zod schemas:

**`src/validators/schemas/assetSchemas.js`**
```javascript
const { z } = require('zod');

const createAssetSchema = z.object({
  name: z.string().min(1).max(255),
  platform_origin: z.enum(['twitch', 'youtube', 'tiktok', 'instagram']),
  type: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  storagePath: z.string(),
  size_bytes: z.number().positive().optional(),
  userId: z.string().uuid().optional()
});

const updateAssetSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  platform_origin: z.enum(['twitch', 'youtube', 'tiktok', 'instagram']).optional(),
  metadata: z.record(z.any()).optional()
});

const assetFiltersSchema = z.object({
  platform: z.enum(['twitch', 'youtube', 'tiktok', 'instagram']).optional(),
  category: z.string().optional(),
  userId: z.string().uuid().optional()
});

module.exports = {
  createAssetSchema,
  updateAssetSchema,
  assetFiltersSchema
};
```

Create validation middleware:

**`src/validators/validate.js`**
```javascript
const { ValidationError } = require('../errors');

function validate(schema, source = 'body') {
  return async (request, reply) => {
    try {
      const data = request[source];
      const validated = await schema.parseAsync(data);
      request[`validated${source.charAt(0).toUpperCase() + source.slice(1)}`] = validated;
    } catch (error) {
      throw ValidationError.fromZodError(error);
    }
  };
}

module.exports = { validate };
```

---

## Step 8: Create First Repository (45 min)

**`src/repositories/AssetRepository.js`**
```javascript
const { NotFoundError } = require('../errors');

class AssetRepository {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.table = 'assets';
  }

  async findById(id) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*, asset_versions(*)')
      .eq('id', id)
      .single();

    if (error?.code === 'PGRST116') {
      throw new NotFoundError('Asset', id);
    }
    if (error) throw new Error(error.message);

    return data;
  }

  async findByPlatform(platform, userId, filters = {}) {
    let query = this.supabase
      .from(this.table)
      .select('*, asset_versions(*)')
      .eq('platform_origin', platform)
      .order('created_at', { ascending: false });

    if (userId) query = query.eq('user_id', userId);
    if (filters.category) {
      query = query.contains('metadata', { category: filters.category });
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return data || [];
  }

  async create(assetData) {
    const { data, error } = await this.supabase
      .from(this.table)
      .insert(assetData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async update(id, updates) {
    const { data, error } = await this.supabase
      .from(this.table)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error?.code === 'PGRST116') {
      throw new NotFoundError('Asset', id);
    }
    if (error) throw new Error(error.message);

    return data;
  }

  async delete(id) {
    const { error } = await this.supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }
}

module.exports = AssetRepository;
```

---

## Step 9: Create First Service (60 min)

**`src/services/AssetService.js`**
```javascript
const { NotFoundError, ForbiddenError } = require('../errors');
const crypto = require('crypto');

class AssetService {
  constructor(assetRepository, uploadService, eventRepository) {
    this.assetRepository = assetRepository;
    this.uploadService = uploadService;
    this.eventRepository = eventRepository;
  }

  async createAsset(assetData, userId) {
    const assetId = crypto.randomUUID();
    
    const asset = await this.assetRepository.create({
      id: assetId,
      user_id: userId,
      name: assetData.name,
      type: assetData.type || 'file',
      size_bytes: assetData.size_bytes,
      platform_origin: assetData.platform_origin,
      metadata: assetData.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Log event
    await this.eventRepository.log('asset.created', {
      assetId: asset.id,
      userId,
      platform: asset.platform_origin
    }).catch(err => console.error('Event log failed:', err));

    return asset;
  }

  async getAssetById(id, userId) {
    const asset = await this.assetRepository.findById(id);
    
    // Verify ownership
    if (asset.user_id !== userId) {
      throw new ForbiddenError('You do not have access to this asset');
    }

    return asset;
  }

  async getAssetsByPlatform(platform, userId, filters = {}) {
    return this.assetRepository.findByPlatform(platform, userId, filters);
  }

  async updateAssetMetadata(id, userId, metadata) {
    // Verify ownership first
    await this.getAssetById(id, userId);

    const updated = await this.assetRepository.update(id, {
      metadata,
      updated_at: new Date().toISOString()
    });

    // Log event
    await this.eventRepository.log('asset.updated', {
      assetId: id,
      userId
    }).catch(err => console.error('Event log failed:', err));

    return updated;
  }

  async deleteAsset(id, userId) {
    // Verify ownership
    const asset = await this.getAssetById(id, userId);

    // Delete file from storage if exists
    if (asset.storage_path) {
      await this.uploadService.deleteFile(asset.storage_path)
        .catch(err => console.error('Storage delete failed:', err));
    }

    await this.assetRepository.delete(id);

    // Log event
    await this.eventRepository.log('asset.deleted', {
      assetId: id,
      userId
    }).catch(err => console.error('Event log failed:', err));

    return true;
  }
}

module.exports = AssetService;
```

---

## Step 10: Setup Dependency Injection (30 min)

**`src/config/dependencies.js`**
```javascript
const { getSupabaseClient, getSupabaseServiceClient } = require('./supabaseClient');
const AssetRepository = require('../repositories/AssetRepository');
const AssetService = require('../services/AssetService');
const UploadService = require('../services/UploadService');
const EventRepository = require('../repositories/EventRepository');

function createDependencies() {
  // Clients
  const supabase = getSupabaseClient();
  const supabaseService = getSupabaseServiceClient();

  // Repositories
  const assetRepository = new AssetRepository(supabase);
  const eventRepository = new EventRepository(supabase);

  // Services
  const uploadService = new UploadService(supabaseService);
  const assetService = new AssetService(assetRepository, uploadService, eventRepository);

  return {
    assetService,
    uploadService,
    // Add more as you create them
  };
}

module.exports = { createDependencies };
```

Update **`server.js`**:
```javascript
const { createDependencies } = require('./config/dependencies');

// Create dependencies
const dependencies = createDependencies();

// Register routes with dependencies
registerRoutes(app, dependencies);
```

---

## Step 11: Refactor First Route (30 min)

Update **`src/routes/assetRoutes.js`**:
```javascript
const { validate } = require('../validators/validate');
const { createAssetSchema, assetFiltersSchema } = require('../validators/schemas/assetSchemas');

function registerAssetRoutes(app, { assetService }) {
  // Get assets by platform
  app.get('/api/assets', {
    preHandler: [validate(assetFiltersSchema, 'query')]
  }, async (req, reply) => {
    const assets = await assetService.getAssetsByPlatform(
      req.query.platform || 'twitch',
      req.user?.id,
      req.validatedQuery
    );
    
    return { success: true, data: assets };
  });

  // Create asset
  app.post('/api/assets', {
    preHandler: [validate(createAssetSchema)]
  }, async (req, reply) => {
    const asset = await assetService.createAsset(
      req.validatedBody,
      req.user?.id
    );
    
    return { success: true, data: asset };
  });

  // ... more endpoints
}

module.exports = registerAssetRoutes;
```

---

## Step 12: Write First Tests (45 min)

**`test/unit/services/AssetService.test.js`**
```javascript
const AssetService = require('../../../src/services/AssetService');

describe('AssetService', () => {
  let assetService;
  let mockAssetRepository;
  let mockUploadService;
  let mockEventRepository;

  beforeEach(() => {
    mockAssetRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByPlatform: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };

    mockUploadService = {
      deleteFile: jest.fn()
    };

    mockEventRepository = {
      log: jest.fn().mockResolvedValue({})
    };

    assetService = new AssetService(
      mockAssetRepository,
      mockUploadService,
      mockEventRepository
    );
  });

  describe('createAsset', () => {
    it('should create asset with generated ID', async () => {
      const assetData = {
        name: 'Test Asset',
        platform_origin: 'twitch',
        metadata: {}
      };

      const mockCreated = { id: 'uuid-1', ...assetData };
      mockAssetRepository.create.mockResolvedValue(mockCreated);

      const result = await assetService.createAsset(assetData, 'user-1');

      expect(result).toEqual(mockCreated);
      expect(mockAssetRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Asset',
          platform_origin: 'twitch',
          user_id: 'user-1'
        })
      );
    });
  });

  describe('getAssetById', () => {
    it('should throw ForbiddenError if user does not own asset', async () => {
      mockAssetRepository.findById.mockResolvedValue({
        id: 'asset-1',
        user_id: 'other-user'
      });

      await expect(
        assetService.getAssetById('asset-1', 'current-user')
      ).rejects.toThrow('You do not have access to this asset');
    });
  });
});
```

Run tests:
```bash
npm test
```

---

## Next Steps

1. **Continue with remaining repositories**:
   - UserRepository
   - ChecklistRepository
   - EventRepository

2. **Create remaining services**:
   - AuthService
   - UploadService
   - ChecklistService

3. **Refactor remaining routes**:
   - authRoutes.js
   - uploadRoutes.js

4. **Add integration tests**:
   - Test complete flows
   - Test error scenarios

5. **Documentation**:
   - Write SOLID-PRINCIPLES.md
   - Write ADRs
   - Update README

---

## Common Issues & Solutions

**Issue**: Tests fail with "Cannot find module"  
**Solution**: Check import paths, ensure files exist

**Issue**: Supabase errors not mapped correctly  
**Solution**: Add more error codes to errorHandler.js

**Issue**: DI container grows too large  
**Solution**: Split into multiple factory functions

**Issue**: Circular dependencies  
**Solution**: Review architecture, use interfaces/abstractions

---

## Validation Checklist

Before considering phase complete:

- [ ] All tests pass
- [ ] ESLint passes
- [ ] Code coverage >80% for completed modules
- [ ] No direct Supabase imports in completed routes
- [ ] Error handling is consistent
- [ ] Documentation updated

---

## Resources

- [SOLID Principles Explained](https://en.wikipedia.org/wiki/SOLID)
- [Zod Documentation](https://zod.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Fastify Best Practices](https://www.fastify.io/docs/latest/Reference/Best-Practices/)

---

## Need Help?

- Review `spec.md` for detailed requirements
- Check `plan.md` for implementation phases
- Refer to `tasks.md` for granular checklist
- Review existing code for patterns
