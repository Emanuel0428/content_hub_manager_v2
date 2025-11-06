/**
 * Asset Routes
 * HTTP endpoints for asset management using Supabase
 */

const mapError = require('../utils/errorMapper')

/**
 * Register asset routes. To support incremental migration, routes now accept a dependencies object
 * and delegate data access to `assetService`. This keeps the external behavior unchanged while
 * moving logic into a service layer.
 *
 * registerAssetRoutes(app, deps)
 */
function registerAssetRoutes(app, deps = {}) {
  const { assetService } = deps;

  // GET /api/assets
  app.get('/api/assets', async (req, reply) => {
    try {
      const { platform, category, userId } = req.query || {};
      let data;

      if (assetService) {
        data = await assetService.getAssets({ platform, category, userId });
      } else {
        // LEGACY fallback commented during migration. Use assetService instead.
        /*
        const { getSupabaseClient } = require('../config/supabaseClient');
        const supabase = getSupabaseClient();
        let query = supabase.from('assets').select('*, asset_versions(*)').order('created_at', { ascending: false });
        if (userId) query = query.eq('user_id', userId);
        if (platform) query = query.eq('platform_origin', platform);
        if (category) query = query.contains('metadata', { category });
        const res = await query;
        if (res.error) throw res.error;
        data = res.data || [];
        */
        return reply.status(500).send({ error: 'asset_service_unavailable' });
      }

      return reply.send({ success: true, data });
    } catch (err) {
      console.error('Get assets error:', err);
      const mapped = mapError(err);
      reply.status(mapped.status || 500).send({ error: mapped.message });
    }
  });

  /**
   * Get asset by ID
   * GET /api/assets/:id
   */
  app.get('/api/assets/:id', async (req, reply) => {
    try {
      const { id } = req.params;
      let asset;
      if (assetService) {
        asset = await assetService.getAssetById(id);
      } else {
        // LEGACY fallback commented during migration. Use assetService instead.
        /*
        const { getSupabaseClient } = require('../config/supabaseClient');
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.from('assets').select('*, asset_versions(*)').eq('id', id).single();
        if (error && error.code === 'PGRST116') return reply.status(404).send({ error: 'not_found' });
        if (error) return reply.status(500).send({ error: 'query_failed', message: error.message });
        asset = data;
        */
        return reply.status(500).send({ error: 'asset_service_unavailable' });
      }

      return reply.send({ success: true, data: asset });
    } catch (err) {
      console.error('Get asset error:', err);
      const mapped = mapError(err);
      reply.status(mapped.status || 500).send({ error: mapped.message });
    }
  });

  /**
   * Create new asset with metadata
   * POST /api/assets
   * Body: { name, platform_origin, type, metadata, storagePath, size_bytes }
   */
  app.post('/api/assets', async (req, reply) => {
    try {
      const body = req.body || {};

      if (assetService) {
        const created = await assetService.createAsset(body);
        return reply.send({ success: true, id: created?.id, data: created });
      }

      // LEGACY fallback commented during migration. Use assetService instead.
      /*
      const { getSupabaseClient } = require('../config/supabaseClient');
      const supabase = getSupabaseClient();
      const { name, platform_origin, storagePath } = body;
      if (!name || !platform_origin || !storagePath) {
        return reply.status(400).send({ error: 'missing_fields', message: 'name, platform_origin, and storagePath are required' });
      }
      // ... legacy insert code ...
      */
      return reply.status(500).send({ error: 'asset_service_unavailable' });
    } catch (err) {
      console.error('Create asset error:', err);
      const mapped = mapError(err);
      reply.status(mapped.status || 500).send({ error: mapped.message });
    }
  });

  /**
   * Update asset metadata
   * PATCH /api/assets/:id
   */
  app.patch('/api/assets/:id', async (req, reply) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};

      if (assetService) {
        const updated = await assetService.updateAsset(id, updates);
        if (!updated) return reply.status(404).send({ error: 'asset_not_found' });
        return reply.send({ success: true, data: updated });
      }

      // LEGACY fallback commented during migration. Use assetService instead.
      /*
      const { getSupabaseClient } = require('../config/supabaseClient');
      const supabase = getSupabaseClient();
      const updateData = Object.assign({}, updates, { updated_at: new Date().toISOString() });
      const { data, error } = await supabase.from('assets').update(updateData).eq('id', id).select();
      if (error) return reply.status(500).send({ error: 'update_failed', message: error.message });
      if (!data || data.length === 0) return reply.status(404).send({ error: 'asset_not_found' });
      return reply.send({ success: true, data: data[0] });
      */
      return reply.status(500).send({ error: 'asset_service_unavailable' });
    } catch (err) {
      console.error('Update asset error:', err);
      const mapped = mapError(err);
      reply.status(mapped.status || 500).send({ error: mapped.message });
    }
  });

  /**
   * Delete asset
   * DELETE /api/assets/:id
   */
  app.delete('/api/assets/:id', async (req, reply) => {
    try {
      const { id } = req.params;

      if (assetService) {
        const result = await assetService.deleteAsset(id);
        if (!result) return reply.status(404).send({ error: 'asset_not_found' });
        return reply.send({ success: true, message: 'Asset deleted' });
      }

      // LEGACY fallback commented during migration. Use assetService instead.
      /*
      const { getSupabaseClient, getSupabaseServiceClient } = require('../config/supabaseClient');
      const supabase = getSupabaseClient();
      const supabaseService = getSupabaseServiceClient();
      const { data: asset, error: fetchError } = await supabase.from('assets').select('*, asset_versions(*)').eq('id', id).single();
      if (fetchError && fetchError.code !== 'PGRST116') return reply.status(500).send({ error: 'fetch_failed', message: fetchError.message });
      if (!asset) return reply.status(404).send({ error: 'asset_not_found' });
      if (asset.asset_versions && asset.asset_versions.length > 0) {
        const storagePaths = asset.asset_versions.map(v => v.storage_path);
        for (const path of storagePaths) {
          const { error: storageError } = await supabaseService.storage.from('Assets').remove([path]);
          if (storageError) console.error('Failed to delete file from storage:', path, storageError);
        }
      }
      await supabase.from('asset_versions').delete().eq('asset_id', id);
      const { error: deleteError } = await supabase.from('assets').delete().eq('id', id);
      if (deleteError) return reply.status(500).send({ error: 'delete_failed', message: deleteError.message });
      return reply.send({ success: true, message: 'Asset deleted' });
      */
      return reply.status(500).send({ error: 'asset_service_unavailable' });
    } catch (err) {
      console.error('Delete asset error:', err);
      const mapped = mapError(err);
      reply.status(mapped.status || 500).send({ error: mapped.message });
    }
  });

  /**
   * Search assets by name
   * GET /api/search?q=query
   */
  app.get('/api/search', async (req, reply) => {
    try {
      const q = req.query.q || '';
      if (!q) return reply.send({ success: true, data: [] });

      let results;
      if (assetService) results = await assetService.searchAssets(q);
      else {
        // LEGACY fallback commented during migration. Use assetService instead.
        /*
        const { getSupabaseClient } = require('../config/supabaseClient');
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.from('assets').select('*').ilike('name', `%${q}%`).limit(20);
        if (error) return reply.status(500).send({ error: 'search_failed', message: error.message });
        results = data || [];
        */
        return reply.status(500).send({ error: 'asset_service_unavailable' });
      }

      return reply.send({ success: true, data: results });
    } catch (err) {
      console.error('Search error:', err);
      const mapped = mapError(err);
      reply.status(mapped.status || 500).send({ error: mapped.message });
    }
  });

  /**
   * Get platform statistics
   * GET /api/stats/platforms
   */
  app.get('/api/stats/platforms', async (req, reply) => {
    try {
      let data;
      if (assetService) data = await assetService.getPlatformStats();
      else {
        // LEGACY fallback commented during migration. Use assetService instead.
        /*
        const { getSupabaseClient } = require('../config/supabaseClient');
        const supabase = getSupabaseClient();
        const res = await supabase.from('assets').select('platform_origin, count(*)').group('platform_origin');
        if (res.error) return reply.status(500).send({ error: 'query_failed', message: res.error.message });
        data = res.data || [];
        */
        return reply.status(500).send({ error: 'asset_service_unavailable' });
      }
      return reply.send({ success: true, data });
    } catch (err) {
      console.error('Stats error:', err);
      const mapped = mapError(err);
      reply.status(mapped.status || 500).send({ error: mapped.message });
    }
  });
}

module.exports = registerAssetRoutes
