/**
 * Repository Index
 * Central export for all repositories
 */

const AssetRepository = require('./AssetRepository')
const ChecklistRepository = require('./ChecklistRepository')
const EventRepository = require('./EventRepository')

/**
 * Initialize all repositories with a database connection
 */
function createRepositories(db) {
  return {
    assets: new AssetRepository(db),
    checklists: new ChecklistRepository(db),
    events: new EventRepository(db)
  }
}

module.exports = {
  AssetRepository,
  ChecklistRepository,
  EventRepository,
  createRepositories
}
