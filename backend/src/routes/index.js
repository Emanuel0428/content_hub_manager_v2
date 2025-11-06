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
function registerRoutes(app, repositories) {
  // Health check
  app.get('/api/health', async () => ({ ok: true, message: 'Server is running with Supabase' }))

  // Asset routes (now using Supabase)
  registerAssetRoutes(app)
  
  // Upload routes (uploads to Supabase Storage)
  registerUploadRoutes(app)
  
  // Authentication routes (Fastify format)
  registerAuthRoutes(app)
  
  // TODO: Implement checklist and event routes with Supabase
  // registerChecklistRoutes(app)
  // registerEventRoutes(app)
}

module.exports = registerRoutes
