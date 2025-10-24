/**
 * Repository Index
 * Central export for all repositories
 */

const AssetRepository = require('./AssetRepository')
const FolderRepository = require('./FolderRepository')
const ChecklistRepository = require('./ChecklistRepository')
const EventRepository = require('./EventRepository')

/**
 * Initialize all repositories with a database connection
 */
function createRepositories(db) {
  return {
    assets: new AssetRepository(db),
    folders: new FolderRepository(db),
    checklists: new ChecklistRepository(db),
    events: new EventRepository(db)
  }
}

module.exports = {
  AssetRepository,
  FolderRepository,
  ChecklistRepository,
  EventRepository,
  createRepositories
}
