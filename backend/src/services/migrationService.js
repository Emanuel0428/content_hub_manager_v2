const { getSupabaseServiceClient } = require('../config/supabaseClient');
const AssetRepository = require('../repositories/AssetRepository');
const MigrationRepository = require('../repositories/MigrationRepository');

/**
 * Migration Service
 * 
 * Handles the business logic for migrating assets from local storage to Supabase.
 * Coordinates between local SQLite database and Supabase Postgres for metadata synchronization.
 */
class MigrationService {
  
  constructor(localDb) {
    this.supabase = getSupabaseServiceClient();
    this.assetRepo = new AssetRepository(localDb);
    this.migrationRepo = new MigrationRepository(localDb);
    
    this.batchSize = parseInt(process.env.MIGRATION_BATCH_SIZE) || 100;
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Write asset metadata to Supabase Postgres
   * @param {Object} asset - Asset data from local SQLite
   * @param {Object} storageInfo - Storage upload result
   * @param {Object} options - Write options
   * @param {boolean} options.dryRun - If true, simulate write without actual insert
   * @returns {Promise<Object>} Write result
   */
  async writeAssetMetadata(asset, storageInfo, options = {}) {
    const { dryRun = false } = options;
    
    const result = {
      success: false,
      supabaseAssetId: null,
      localAssetId: asset.id,
      error: null,
      dryRun
    };

    try {
      // Prepare asset data for Supabase
      const supabaseAsset = this.transformAssetForSupabase(asset, storageInfo);

      if (dryRun) {
        // Simulate successful write
        result.success = true;
        result.supabaseAssetId = `simulated-${asset.id}`;
        return result;
      }

      // Check if asset already exists in Supabase
      const existingAsset = await this.findExistingAsset(asset);
      
      let supabaseData;
      if (existingAsset) {
        // Update existing asset
        const { data, error } = await this.supabase
          .from('assets')
          .update(supabaseAsset)
          .eq('id', existingAsset.id)
          .select()
          .single();

        if (error) throw error;
        supabaseData = data;
        
      } else {
        // Insert new asset
        const { data, error } = await this.supabase
          .from('assets')
          .insert([supabaseAsset])
          .select()
          .single();

        if (error) throw error;
        supabaseData = data;
      }

      // Update local asset with Supabase storage info
      await this.assetRepo.updateStorageInfo(asset.id, {
        storage_path: storageInfo.storagePath,
        preview_url: storageInfo.publicUrl
      });

      result.success = true;
      result.supabaseAssetId = supabaseData.id;
      
      return result;

    } catch (error) {
      result.error = error.message;
      return result;
    }
  }

  /**
   * Transform local asset data for Supabase format
   * @param {Object} localAsset - Asset from local SQLite
   * @param {Object} storageInfo - Storage upload result
   * @returns {Object} Transformed asset for Supabase
   */
  transformAssetForSupabase(localAsset, storageInfo) {
    return {
      // Map local fields to Supabase schema
      title: localAsset.title,
      platform: localAsset.platform,
      category: localAsset.category,
      resolution: localAsset.resolution,
      width: localAsset.width,
      height: localAsset.height,
      tags: localAsset.tags,
      description: localAsset.description,
      file_size: localAsset.file_size,
      mime_type: localAsset.mime_type,
      
      // Supabase-specific fields
      storage_path: storageInfo.storagePath,
      preview_url: storageInfo.publicUrl,
      
      // Migration metadata
      migrated_from_local: true,
      local_asset_id: localAsset.id,
      migrated_at: new Date().toISOString()
    };
  }

  /**
   * Find existing asset in Supabase by local ID or other criteria
   * @param {Object} localAsset - Local asset data
   * @returns {Promise<Object|null>} Existing Supabase asset or null
   */
  async findExistingAsset(localAsset) {
    try {
      // First try to find by local_asset_id if it exists
      const { data: byLocalId } = await this.supabase
        .from('assets')
        .select('id, title, storage_path')
        .eq('local_asset_id', localAsset.id)
        .single();

      if (byLocalId) return byLocalId;

      // Fallback: find by title + platform combination
      const { data: byTitlePlatform } = await this.supabase
        .from('assets')
        .select('id, title, storage_path')
        .eq('title', localAsset.title)
        .eq('platform', localAsset.platform)
        .single();

      return byTitlePlatform;

    } catch (error) {
      // No existing asset found
      return null;
    }
  }

  /**
   * Batch write multiple assets with retry logic
   * @param {Array} assetStoragePairs - Array of {asset, storageResult} objects
   * @param {Object} options - Batch write options
   * @returns {Promise<Object>} Batch write result
   */
  async batchWriteAssets(assetStoragePairs, options = {}) {
    const { dryRun = false, onProgress } = options;
    
    const results = {
      successful: [],
      failed: [],
      total: assetStoragePairs.length
    };

    for (let i = 0; i < assetStoragePairs.length; i++) {
      const { asset, storageResult } = assetStoragePairs[i];
      
      try {
        const writeResult = await this.writeAssetWithRetry(asset, storageResult, { dryRun });
        
        if (writeResult.success) {
          results.successful.push(writeResult);
        } else {
          results.failed.push({
            asset,
            error: writeResult.error,
            localAssetId: asset.id
          });
        }

        // Report progress
        if (onProgress) {
          onProgress({
            phase: 'metadata_write',
            completed: i + 1,
            total: assetStoragePairs.length,
            successful: results.successful.length,
            failed: results.failed.length,
            currentAsset: asset
          });
        }

      } catch (error) {
        results.failed.push({
          asset,
          error: error.message,
          localAssetId: asset.id
        });
      }
    }

    return results;
  }

  /**
   * Write asset metadata with retry logic
   * @param {Object} asset - Asset data
   * @param {Object} storageResult - Storage upload result
   * @param {Object} options - Write options
   * @returns {Promise<Object>} Write result
   */
  async writeAssetWithRetry(asset, storageResult, options = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const result = await this.writeAssetMetadata(asset, storageResult, options);
        
        if (result.success) {
          return result;
        }
        
        lastError = result.error;
        
        // Wait before retry (except on last attempt)
        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
        
      } catch (error) {
        lastError = error.message;
        
        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }

    return {
      success: false,
      error: `Failed after ${this.retryAttempts} attempts: ${lastError}`,
      localAssetId: asset.id
    };
  }

  /**
   * Validate Supabase connection and schema
   * @returns {Promise<Object>} Validation result
   */
  async validateSupabaseSchema() {
    const result = {
      valid: false,
      errors: [],
      tables: {}
    };

    try {
      // Check if assets table exists and has required columns
      const { data: assetsData, error: assetsError } = await this.supabase
        .from('assets')
        .select('id')
        .limit(1);

      if (assetsError) {
        result.errors.push(`Assets table error: ${assetsError.message}`);
      } else {
        result.tables.assets = true;
      }

      // Test insert permissions
      const testAsset = {
        title: 'Migration Test Asset',
        platform: 'test',
        migrated_from_local: true,
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await this.supabase
        .from('assets')
        .insert([testAsset])
        .select();

      if (insertError) {
        if (!insertError.message.includes('duplicate') && !insertError.message.includes('unique')) {
          result.errors.push(`Insert permission error: ${insertError.message}`);
        }
      }

      result.valid = result.errors.length === 0;
      return result;

    } catch (error) {
      result.errors.push(`Schema validation failed: ${error.message}`);
      return result;
    }
  }

  /**
   * Get migration statistics from both local and Supabase
   * @returns {Promise<Object>} Migration statistics
   */
  async getMigrationStatistics() {
    try {
      const [localStats, supabaseStats] = await Promise.all([
        this.assetRepo.getMigrationStats(),
        this.getSupabaseMigrationStats()
      ]);

      return {
        local: localStats,
        supabase: supabaseStats,
        summary: {
          migrationProgress: localStats.migrated_assets / localStats.total_assets,
          pendingMigration: localStats.pending_migration,
          dataConsistency: this.calculateDataConsistency(localStats, supabaseStats)
        }
      };

    } catch (error) {
      return {
        error: `Failed to get migration statistics: ${error.message}`
      };
    }
  }

  /**
   * Get migration statistics from Supabase
   * @returns {Promise<Object>} Supabase migration stats
   */
  async getSupabaseMigrationStats() {
    const { data, error } = await this.supabase
      .from('assets')
      .select('id, file_size, migrated_from_local')
      .eq('migrated_from_local', true);

    if (error) throw error;

    return {
      total_migrated_assets: data.length,
      total_migrated_size: data.reduce((sum, asset) => sum + (asset.file_size || 0), 0)
    };
  }

  /**
   * Calculate data consistency between local and Supabase
   * @param {Object} localStats - Local statistics
   * @param {Object} supabaseStats - Supabase statistics
   * @returns {number} Consistency ratio (0-1)
   */
  calculateDataConsistency(localStats, supabaseStats) {
    if (localStats.migrated_assets === 0) return 1;
    
    return Math.min(
      supabaseStats.total_migrated_assets / localStats.migrated_assets,
      1
    );
  }
}

module.exports = MigrationService;