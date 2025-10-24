/**
 * Checklist Routes
 * HTTP endpoints for checklist management
 */

const mapError = require('../utils/errorMapper')
const eventService = require('../services/eventService')

/**
 * Get platform-specific checklist template
 */
function getPlatformChecklist(platform) {
  const checklists = {
    'twitch': ['stream_title', 'category_tagged', 'clips_enabled', 'thumbnail_uploaded'],
    'tiktok': ['sound_selected', 'hashtags_added', 'description_complete', 'aspect_ratio_ok'],
    'youtube': ['title_optimized', 'description_seo', 'thumbnail_custom', 'tags_added'],
    'instagram': ['caption_written', 'hashtags_added', 'alt_text_added', 'location_tagged'],
    'demo': ['title_set', 'platform_selected', 'preview_ready', 'checklist_complete']
  }
  return checklists[platform] || checklists['demo']
}

function registerChecklistRoutes(app, repositories) {
  const { checklists, assets } = repositories

  // Get checklist for an asset
  app.get('/api/checklists/:assetId', async (req, reply) => {
    try {
      const { assetId } = req.params

      // Get asset to determine platform
      const asset = await assets.findById(assetId)
      if (!asset) {
        return reply.status(404).send({ error: 'not_found' })
      }

      // Load platform-specific checklist template
      const items = getPlatformChecklist(asset.platform)

      // Get existing checklist state from DB
      const completed = await checklists.findByAssetId(assetId)
      const completedMap = new Map(completed.map(c => [c.item_key, c]))

      const result = items.map(item => ({
        key: item,
        label: item.replace(/_/g, ' ').toUpperCase(),
        completed: completedMap.has(item) && completedMap.get(item).completed
      }))

      reply.send({ 
        data: { 
          assetId, 
          platform: asset.platform, 
          items: result 
        } 
      })
    } catch (err) {
      const mapped = mapError(err)
      reply.status(mapped.status || 500).send({ error: mapped.message })
    }
  })

  // Mark checklist item
  app.post('/api/checklists/:assetId/mark', async (req, reply) => {
    try {
      const { assetId } = req.params
      const { item_key, completed } = req.body || {}

      if (!item_key) {
        return reply.status(400).send({ error: 'missing_item_key' })
      }

      await checklists.markItem(assetId, item_key, completed)

      eventService.emit('checklist.updated', { assetId, item_key, completed })
      reply.send({ ok: true })
    } catch (err) {
      const mapped = mapError(err)
      reply.status(mapped.status || 500).send({ error: mapped.message })
    }
  })
}

module.exports = registerChecklistRoutes
