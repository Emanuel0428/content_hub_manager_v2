const crypto = require('crypto');

class AssetService {
  /**
   * @param {Object} deps
   * @param {import('../repositories/AssetRepository')} deps.assetRepository
   * @param {import('@supabase/supabase-js').SupabaseClient} deps.supabaseServiceClient
   */
  constructor({ assetRepository, supabaseServiceClient }) {
    this.assetRepository = assetRepository;
    this.supabaseService = supabaseServiceClient;
  }

  async getAssets(filters) {
    return this.assetRepository.findMany(filters);
  }

  async getAssetById(id) {
    return this.assetRepository.findById(id);
  }

  async createAsset(assetData) {
    const assetId = crypto.randomUUID();
    const now = new Date().toISOString();

    const payload = Object.assign({}, assetData, {
      id: assetId,
      created_at: now,
      updated_at: now
    });

    const asset = await this.assetRepository.create(payload);

    // If storagePath provided, create initial version
    if (asset && assetData.storagePath) {
      try {
        const versionId = crypto.randomUUID();
        await this.supabaseService.from('asset_versions').insert({
          id: versionId,
          asset_id: assetId,
          version_number: 1,
          storage_path: assetData.storagePath,
          checksum: null,
          created_at: now,
          created_by: assetData.user_id || null
        });
      } catch (err) {
        // non-fatal: versions can be retried later
        // swallow to keep old behavior (asset created even if version failed)
        console.warn('Failed to create asset version (non-fatal):', err.message || err);
      }
    }

    return asset;
  }

  async updateAsset(id, updates) {
    return this.assetRepository.update(id, Object.assign({}, updates, { updated_at: new Date().toISOString() }));
  }

  async deleteAsset(id) {
    // get versions to remove files
    const asset = await this.assetRepository.findById(id);
    if (!asset) return null;

    if (asset.asset_versions && asset.asset_versions.length > 0 && this.supabaseService) {
      const storagePaths = asset.asset_versions.map(v => v.storage_path).filter(Boolean);
      for (const path of storagePaths) {
        try {
          const { error: storageError } = await this.supabaseService.storage.from('Assets').remove([path]);
          if (storageError) console.error('Failed to delete file from storage:', path, storageError);
        } catch (err) {
          console.error('Storage delete exception:', err);
        }
      }
    }

    await this.assetRepository.delete(id);
    return true;
  }

  async searchAssets(q) {
    if (!q) return [];
    return this.assetRepository.search(q);
  }

  async getPlatformStats() {
    return this.assetRepository.getPlatformStats();
  }
}

module.exports = AssetService;
