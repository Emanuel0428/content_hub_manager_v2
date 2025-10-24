/**
 * Asset Routes
 * HTTP endpoints for asset management
 */

const mapError = require('../utils/errorMapper')
const eventService = require('../services/eventService')

function registerAssetRoutes(app, repositories) {
  const { assets } = repositories

  // Get all assets with filters
  app.get('/api/assets', async (req, reply) => {
    try {
      const { platform, category, resolution } = req.query
      const data = await assets.findAllWithVersions({ platform, category, resolution })
      reply.send({ data })
    } catch (err) {
      const mapped = mapError(err)
      reply.status(mapped.status || 500).send({ error: mapped.message })
    }
  })

  // Get asset by ID
  app.get('/api/assets/:id', async (req, reply) => {
    try {
      const { id } = req.params
      const asset = await assets.findByIdWithVersions(id)
      
      if (!asset) {
        return reply.status(404).send({ error: 'not_found' })
      }
      
      reply.send({ data: asset })
    } catch (err) {
      const mapped = mapError(err)
      reply.status(mapped.status || 500).send({ error: mapped.message })
    }
  })

  // Create new asset
  app.post('/api/assets', async (req, reply) => {
    try {
      const {
        title,
        platform,
        category,
        resolution,
        width,
        height,
        tags,
        description,
        file_size,
        mime_type,
        path: assetPath
      } = req.body || {}

      if (!title || !platform || !assetPath) {
        return reply.status(400).send({ error: 'missing_fields' })
      }

      const assetId = await assets.createWithVersion(
        { title, platform, category, resolution, width, height, tags, description, file_size, mime_type },
        assetPath
      )

      // Emit event
      eventService.emit('asset.created', {
        assetId,
        title,
        platform,
        category,
        path: assetPath
      })

      reply.send({ id: assetId })
    } catch (err) {
      const mapped = mapError(err)
      reply.status(mapped.status || 500).send({ error: mapped.message })
    }
  })

  // Update asset metadata
  app.patch('/api/assets/:id', async (req, reply) => {
    try {
      const { id } = req.params
      const { title, category, resolution, width, height, tags, description } = req.body || {}

      const updateData = {}
      if (title !== undefined) updateData.title = title
      if (category !== undefined) updateData.category = category
      if (resolution !== undefined) updateData.resolution = resolution
      if (width !== undefined) updateData.width = width
      if (height !== undefined) updateData.height = height
      if (tags !== undefined) updateData.tags = tags
      if (description !== undefined) updateData.description = description

      if (Object.keys(updateData).length === 0) {
        return reply.status(400).send({ error: 'no_fields_to_update' })
      }

      const changes = await assets.updateMetadata(id, updateData)

      if (changes === 0) {
        return reply.status(404).send({ error: 'asset_not_found' })
      }

      eventService.emit('asset.updated', { assetId: id, fields: Object.keys(updateData) })
      reply.send({ ok: true })
    } catch (err) {
      const mapped = mapError(err)
      reply.status(mapped.status || 500).send({ error: mapped.message })
    }
  })

  // Search assets
  app.get('/api/search', async (req, reply) => {
    try {
      const q = req.query.q || ''
      if (!q) return reply.send({ data: [] })

      const data = await assets.search(q)
      reply.send({ data })
    } catch (err) {
      const mapped = mapError(err)
      reply.status(mapped.status || 500).send({ error: mapped.message })
    }
  })

  // Get platform statistics
  app.get('/api/stats/platforms', async (req, reply) => {
    try {
      const data = await assets.getPlatformStats()
      reply.send({ data })
    } catch (err) {
      const mapped = mapError(err)
      reply.status(mapped.status || 500).send({ error: mapped.message })
    }
  })

  // Get category statistics
  app.get('/api/stats/categories', async (req, reply) => {
    try {
      const { platform } = req.query

      if (!platform) {
        return reply.status(400).send({ error: 'platform_required' })
      }

      const data = await assets.getCategoryStats(platform)
      reply.send({ data })
    } catch (err) {
      const mapped = mapError(err)
      reply.status(mapped.status || 500).send({ error: mapped.message })
    }
  })
}

module.exports = registerAssetRoutes
