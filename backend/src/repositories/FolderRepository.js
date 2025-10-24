/**
 * Folder Repository
 * Handles all database operations for folders
 */

const BaseRepository = require('./BaseRepository')

class FolderRepository extends BaseRepository {
  constructor(db) {
    super(db, 'folders')
  }

  /**
   * Find folder by ID with associated assets
   */
  async findByIdWithAssets(id) {
    const folder = await this.findById(id)
    if (!folder) return null
    
    // Get assets in folder
    const assets = await this.all(
      'SELECT id, title, platform FROM assets WHERE folder_id = ?',
      [id]
    )
    
    folder.assets = assets || []
    return folder
  }

  /**
   * Get all folders ordered by name
   */
  async findAllOrdered() {
    return this.all('SELECT id, name, created_at FROM folders ORDER BY name ASC')
  }
}

module.exports = FolderRepository
