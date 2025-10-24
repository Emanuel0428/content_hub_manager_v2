/**
 * Routes Index
 * Central registration for all routes
 */

const registerAssetRoutes = require('./assetRoutes')
const registerChecklistRoutes = require('./checklistRoutes')
const registerEventRoutes = require('./eventRoutes')
const registerUploadRoutes = require('./uploadRoutes')
const registerPlatformRoutes = require('./platformRoutes')

/**
 * Register all application routes
 */
function registerRoutes(app, repositories) {
  // Health check
  app.get('/api/health', async () => ({ ok: true }))

  // Register domain-specific routes
  registerAssetRoutes(app, repositories)
  registerChecklistRoutes(app, repositories)
  registerEventRoutes(app, repositories)
  registerUploadRoutes(app)
  registerPlatformRoutes(app)
}

module.exports = registerRoutes
