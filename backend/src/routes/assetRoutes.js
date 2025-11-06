/**
 * Asset Routes
 * HTTP endpoints for asset management using Supabase
 */

const { getSupabaseClient } = require('../config/supabaseClient')
const mapError = require('../utils/errorMapper')
const crypto = require('crypto')

function registerAssetRoutes(app) {
  const supabase = getSupabaseClient()

  /**
   * Get all assets with filters
   * GET /api/assets?platform=twitch&category=overlay
   */
  app.get('/api/assets', async (req, reply) => {
    try {
      const { platform, category, resolution, userId } = req.query
      
      let query = supabase
        .from('assets')
        .select('*, asset_versions(*)')
        .order('created_at', { ascending: false })
      
      // Apply filters if provided
      if (userId) query = query.eq('user_id', userId)
      if (platform) query = query.eq('platform_origin', platform)
      if (category) {
        // Category is stored in metadata JSON
        query = query.contains('metadata', { category })
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Asset query error:', error)
        return reply.status(500).send({ error: 'query_failed', message: error.message })
      }
      
      return reply.send({ 
        success: true,
        data: data || [] 
      })
    } catch (err) {
      console.error('Get assets error:', err)
      const mapped = mapError(err)
      reply.status(mapped.status || 500).send({ error: mapped.message })
    }
  })

  /**
   * Get asset by ID
   * GET /api/assets/:id
   */
  app.get('/api/assets/:id', async (req, reply) => {
    try {
      const { id } = req.params
      
      const { data, error } = await supabase
        .from('assets')
        .select('*, asset_versions(*)')
        .eq('id', id)
        .single()
      
      if (error && error.code === 'PGRST116') {
        return reply.status(404).send({ error: 'not_found' })
      }
      
      if (error) {
        return reply.status(500).send({ error: 'query_failed', message: error.message })
      }
      
      return reply.send({ success: true, data })
    } catch (err) {
      console.error('Get asset error:', err)
      const mapped = mapError(err)
      reply.status(mapped.status || 500).send({ error: mapped.message })
    }
  })

  /**
   * Create new asset with metadata
   * POST /api/assets
   * Body: { name, platform_origin, type, metadata, storagePath, size_bytes }
   */
  app.post('/api/assets', async (req, reply) => {
    try {
      const {
        name,
        platform_origin,
        type,
        metadata = {},
        storagePath,
        size_bytes,
        userId
      } = req.body || {}

      console.log('📝 Creating asset:', { name, platform_origin, storagePath })

      if (!name || !platform_origin || !storagePath) {
        return reply.status(400).send({ 
          error: 'missing_fields',
          message: 'name, platform_origin, and storagePath are required' 
        })
      }

      const assetId = crypto.randomUUID()
      
      // Create asset record
      const { data: assetData, error: assetError } = await supabase
        .from('assets')
        .insert({
          id: assetId,
          user_id: userId,
          name,
          type: type || 'file',
          size_bytes,
          platform_origin,
          metadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
      
      if (assetError) {
        console.error('Asset creation error:', assetError)
        return reply.status(500).send({ 
          error: 'asset_creation_failed',
          message: assetError.message 
        })
      }

      // Create asset version record
      const versionId = crypto.randomUUID()
      const { error: versionError } = await supabase
        .from('asset_versions')
        .insert({
          id: versionId,
          asset_id: assetId,
          version_number: 1,
          storage_path: storagePath,
          checksum: null,
          created_at: new Date().toISOString(),
          created_by: userId
        })
      
      if (versionError) {
        console.error('Version creation error:', versionError)
        // Asset was created but version failed - log warning
        console.warn('Asset created but version record failed for asset:', assetId)
      }

      return reply.send({ 
        success: true,
        id: assetId,
        data: assetData?.[0] 
      })
    } catch (err) {
      console.error('Create asset error:', err)
      const mapped = mapError(err)
      reply.status(mapped.status || 500).send({ error: mapped.message })
    }
  })

  /**
   * Update asset metadata
   * PATCH /api/assets/:id
   */
  app.patch('/api/assets/:id', async (req, reply) => {
    try {
      const { id } = req.params
      const { name, platform_origin, metadata } = req.body || {}

      const updateData = {
        updated_at: new Date().toISOString()
      }
      
      if (name !== undefined) updateData.name = name
      if (platform_origin !== undefined) updateData.platform_origin = platform_origin
      if (metadata !== undefined) updateData.metadata = metadata

      const { data, error } = await supabase
        .from('assets')
        .update(updateData)
        .eq('id', id)
        .select()
      
      if (error) {
        return reply.status(500).send({ 
          error: 'update_failed',
          message: error.message 
        })
      }

      if (!data || data.length === 0) {
        return reply.status(404).send({ error: 'asset_not_found' })
      }

      return reply.send({ success: true, data: data[0] })
    } catch (err) {
      console.error('Update asset error:', err)
      const mapped = mapError(err)
      reply.status(mapped.status || 500).send({ error: mapped.message })
    }
  })

  /**
   * Delete asset
   * DELETE /api/assets/:id
   */
  app.delete('/api/assets/:id', async (req, reply) => {
    try {
      const { id } = req.params
      const supabaseService = getSupabaseServiceClient()
      
      // Get asset first to get storage paths
      const { data: asset, error: fetchError } = await supabase
        .from('assets')
        .select('*, asset_versions(*)')
        .eq('id', id)
        .single()
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        return reply.status(500).send({ error: 'fetch_failed', message: fetchError.message })
      }

      if (!asset) {
        return reply.status(404).send({ error: 'asset_not_found' })
      }

      // Delete from storage using service role to bypass RLS
      if (asset.asset_versions && asset.asset_versions.length > 0) {
        const storagePaths = asset.asset_versions.map(v => v.storage_path)
        for (const path of storagePaths) {
          const { error: storageError } = await supabaseService.storage.from('Assets').remove([path])
          if (storageError) {
            console.error('Failed to delete file from storage:', path, storageError)
          }
        }
      }

      // Delete asset versions
      await supabase
        .from('asset_versions')
        .delete()
        .eq('asset_id', id)

      // Delete asset
      const { error: deleteError } = await supabase
        .from('assets')
        .delete()
        .eq('id', id)
      
      if (deleteError) {
        return reply.status(500).send({ 
          error: 'delete_failed',
          message: deleteError.message 
        })
      }

      return reply.send({ success: true, message: 'Asset deleted' })
    } catch (err) {
      console.error('Delete asset error:', err)
      const mapped = mapError(err)
      reply.status(mapped.status || 500).send({ error: mapped.message })
    }
  })

  /**
   * Search assets by name
   * GET /api/search?q=query
   */
  app.get('/api/search', async (req, reply) => {
    try {
      const q = req.query.q || ''
      
      if (!q) {
        return reply.send({ success: true, data: [] })
      }

      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .ilike('name', `%${q}%`)
        .limit(20)
      
      if (error) {
        return reply.status(500).send({ error: 'search_failed', message: error.message })
      }

      return reply.send({ success: true, data: data || [] })
    } catch (err) {
      console.error('Search error:', err)
      const mapped = mapError(err)
      reply.status(mapped.status || 500).send({ error: mapped.message })
    }
  })

  /**
   * Get platform statistics
   * GET /api/stats/platforms
   */
  app.get('/api/stats/platforms', async (req, reply) => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('platform_origin, count(*)')
        .group('platform_origin')
      
      if (error) {
        return reply.status(500).send({ error: 'query_failed', message: error.message })
      }

      return reply.send({ success: true, data: data || [] })
    } catch (err) {
      console.error('Stats error:', err)
      const mapped = mapError(err)
      reply.status(mapped.status || 500).send({ error: mapped.message })
    }
  })
}

module.exports = registerAssetRoutes
