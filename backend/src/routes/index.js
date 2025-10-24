/**
 * Routes Index
 * Central registration for all routes
 */

const registerAssetRoutes = require('./assetRoutes')
const registerFolderRoutes = require('./folderRoutes')
const registerChecklistRoutes = require('./checklistRoutes')
const registerEventRoutes = require('./eventRoutes')
const registerUploadRoutes = require('./uploadRoutes')

/**
 * Register all application routes
 */
function registerRoutes(app, repositories) {
  // Health check
  app.get('/api/health', async () => ({ ok: true }))

  // Register domain-specific routes
  registerAssetRoutes(app, repositories)
  registerFolderRoutes(app, repositories)
  registerChecklistRoutes(app, repositories)
  registerEventRoutes(app, repositories)
  registerUploadRoutes(app)
}

module.exports = registerRoutes
