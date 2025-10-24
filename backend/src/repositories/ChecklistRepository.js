/**
 * Checklist Repository
 * Handles all database operations for checklists
 */

const BaseRepository = require('./BaseRepository')

class ChecklistRepository extends BaseRepository {
  constructor(db) {
    super(db, 'checklists')
  }

  /**
   * Find all checklist items for an asset
   */
  async findByAssetId(assetId) {
    return this.all(
      'SELECT id, item_key, completed FROM checklists WHERE asset_id = ?',
      [assetId]
    )
  }

  /**
   * Mark an item as completed or not completed
   */
  async markItem(assetId, itemKey, completed) {
    return this.run(
      'INSERT OR REPLACE INTO checklists (asset_id, item_key, completed) VALUES (?, ?, ?)',
      [assetId, itemKey, completed ? 1 : 0]
    )
  }
}

module.exports = ChecklistRepository
