/**
 * Asset Repository
 * Handles all database operations for assets
 */

const BaseRepository = require('./BaseRepository')

class AssetRepository extends BaseRepository {
  constructor(db) {
    super(db, 'assets')
  }

  /**
   * Find assets with optional filters and include versions
   */
  async findAllWithVersions(filters = {}) {
    const { platform, category, resolution } = filters
    
    let query = `SELECT a.id, a.title, a.platform, a.category, a.resolution, 
                  a.width, a.height, a.tags, a.description, a.file_size, a.mime_type,
                  a.storage_path, a.preview_url, a.user_id, a.created_at,
                  v.id as version_id, v.path as version_path 
                  FROM assets a 
                  LEFT JOIN asset_versions v ON v.asset_id = a.id`
    
    const conditions = []
    const params = []
    
    if (platform && platform !== 'all') {
      conditions.push('a.platform = ?')
      params.push(platform)
    }
    
    if (category) {
      conditions.push('a.category = ?')
      params.push(category)
    }
    
    if (resolution) {
      conditions.push('a.resolution = ?')
      params.push(resolution)
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }
    
    query += ' GROUP BY a.id ORDER BY a.created_at DESC'
    
    const rows = await this.all(query, params)
    
    // Parse tags from JSON string
    return rows.map(row => ({
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : []
    }))
  }

  /**
   * Find asset by ID with all versions
   */
  async findByIdWithVersions(id) {
    const asset = await this.findById(id)
    if (!asset) return null
    
    // Parse tags
    if (asset.tags) {
      asset.tags = JSON.parse(asset.tags)
    }
    
    // Get versions
    const versions = await this.all(
      'SELECT id, path, created_at FROM asset_versions WHERE asset_id = ? ORDER BY created_at DESC',
      [id]
    )
    
    asset.versions = versions || []
    return asset
  }

  /**
   * Create asset with initial version
   */
  async createWithVersion(assetData, versionPath) {
    const { title, platform, category, resolution, width, height, tags, description, file_size, mime_type } = assetData
    
    // Serialize tags to JSON
    const tagsJson = tags ? JSON.stringify(tags) : null
    
    const assetId = await this.create({
      title,
      platform,
      category: category || null,
      resolution: resolution || null,
      width: width || null,
      height: height || null,
      tags: tagsJson,
      description: description || null,
      file_size: file_size || null,
      mime_type: mime_type || null
    })
    
    // Create version
    await this.run(
      'INSERT INTO asset_versions (asset_id, path) VALUES (?, ?)',
      [assetId, versionPath]
    )
    
    return assetId
  }

  /**
   * Update asset metadata
   */
  async updateMetadata(id, data) {
    const updateData = { ...data }
    
    // Serialize tags if present
    if (updateData.tags !== undefined) {
      updateData.tags = JSON.stringify(updateData.tags)
    }
    
    return this.update(id, updateData)
  }

  /**
   * Search assets by title
   */
  async search(query) {
    try {
      // Try FTS first
      const rows = await this.all(
        "SELECT a.id, a.title FROM assets_fts f JOIN assets a ON a.id = f.rowid WHERE assets_fts MATCH ? LIMIT 50",
        [query]
      )
      return rows
    } catch (err) {
      // Fallback to LIKE
      const rows = await this.all(
        'SELECT id, title FROM assets WHERE title LIKE ? LIMIT 50',
        [`%${query}%`]
      )
      return rows
    }
  }

  /**
   * Get platform statistics
   */
  async getPlatformStats() {
    const query = `
      SELECT 
        platform,
        COUNT(*) as total_assets,
        COUNT(DISTINCT category) as categories_used
      FROM assets
      WHERE platform IS NOT NULL
      GROUP BY platform
    `
    return this.all(query)
  }

  /**
   * Get category statistics for a platform
   */
  async getCategoryStats(platform) {
    const query = `
      SELECT 
        category,
        COUNT(*) as asset_count
      FROM assets
      WHERE platform = ? AND category IS NOT NULL
      GROUP BY category
      ORDER BY asset_count DESC
    `
    return this.all(query, [platform])
  }

  /**
   * Update asset with Supabase storage information
   * @param {number} assetId - Asset ID
   * @param {Object} storageData - Storage information
   * @param {string} storageData.storage_path - Path in Supabase Storage
   * @param {string} storageData.preview_url - Public preview URL
   * @param {string} storageData.user_id - Owner user ID (optional)
   * @returns {Promise<Object>} Updated asset
   */
  async updateStorageInfo(assetId, storageData) {
    const { storage_path, preview_url, user_id } = storageData

    const setParts = []
    const values = []

    if (storage_path !== undefined) {
      setParts.push('storage_path = ?')
      values.push(storage_path)
    }

    if (preview_url !== undefined) {
      setParts.push('preview_url = ?')
      values.push(preview_url)
    }

    if (user_id !== undefined) {
      setParts.push('user_id = ?')
      values.push(user_id)
    }

    if (setParts.length === 0) {
      throw new Error('No storage data provided for update')
    }

    const query = `UPDATE assets SET ${setParts.join(', ')} WHERE id = ?`
    values.push(assetId)

    await this.run(query, values)
    return this.findById(assetId)
  }

  /**
   * Get assets ready for migration (no storage_path set)
   * @param {number} limit - Maximum number of assets to return
   * @returns {Promise<Array>} Assets ready for migration
   */
  async getAssetsForMigration(limit = 100) {
    const query = `
      SELECT id, title, platform, category, file_size, mime_type, created_at,
             (SELECT path FROM asset_versions WHERE asset_id = assets.id LIMIT 1) as local_path
      FROM assets 
      WHERE storage_path IS NULL
      ORDER BY created_at ASC
      LIMIT ?
    `
    return this.all(query, [limit])
  }

  /**
   * Get migrated assets count and statistics
   * @returns {Promise<Object>} Migration statistics
   */
  async getMigrationStats() {
    const query = `
      SELECT 
        COUNT(*) as total_assets,
        COUNT(storage_path) as migrated_assets,
        COUNT(*) - COUNT(storage_path) as pending_migration,
        SUM(CASE WHEN storage_path IS NOT NULL THEN file_size ELSE 0 END) as migrated_size,
        SUM(CASE WHEN storage_path IS NULL THEN file_size ELSE 0 END) as pending_size
      FROM assets
    `
    return this.get(query)
  }

  /**
   * Find assets by storage path (for rollback/verification)
   * @param {string} storagePath - Supabase storage path
   * @returns {Promise<Object|null>} Asset with matching storage path
   */
  async findByStoragePath(storagePath) {
    const query = `SELECT * FROM assets WHERE storage_path = ?`
    return this.get(query, [storagePath])
  }
}

module.exports = AssetRepository
