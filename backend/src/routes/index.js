/**
 * Routes Index
 * Central registration for all routes
 */

const registerAssetRoutes = require('./assetRoutes')
const registerUploadRoutes = require('./uploadRoutes')
const registerAuthRoutes = require('./authRoutes')

/**
 * Register all application routes
 */
function registerRoutes(app, deps = {}) {
  // Health check
  app.get('/api/health', async () => ({ ok: true, message: 'Server is running with Supabase' }))

  // Asset routes (prefer service via deps, fallback to legacy behavior)
  registerAssetRoutes(app, deps)

  // Upload routes (uploads to Supabase Storage)
  registerUploadRoutes(app, deps)

  // Authentication routes (Fastify format)
  registerAuthRoutes(app, deps)
  
  // TODO: Implement checklist and event routes with Supabase
  // registerChecklistRoutes(app)
  // registerEventRoutes(app)
}

module.exports = registerRoutes
