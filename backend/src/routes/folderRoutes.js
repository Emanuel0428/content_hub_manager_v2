/**
 * Folder Routes
 * HTTP endpoints for folder management
 */

const mapError = require('../utils/errorMapper')
const eventService = require('../services/eventService')

function registerFolderRoutes(app, repositories) {
  const { folders } = repositories

  // Get all folders
  app.get('/api/folders', async (req, reply) => {
    try {
      const data = await folders.findAllOrdered()
      reply.send({ data })
    } catch (err) {
      const mapped = mapError(err)
      reply.status(mapped.status || 500).send({ error: mapped.message })
    }
  })

  // Get folder by ID with assets
  app.get('/api/folders/:id', async (req, reply) => {
    try {
      const { id } = req.params
      const folder = await folders.findByIdWithAssets(id)

      if (!folder) {
        return reply.status(404).send({ error: 'not_found' })
      }

      reply.send({ data: folder })
    } catch (err) {
      const mapped = mapError(err)
      reply.status(mapped.status || 500).send({ error: mapped.message })
    }
  })

  // Create new folder
  app.post('/api/folders', async (req, reply) => {
    try {
      const { name } = req.body || {}

      if (!name) {
        return reply.status(400).send({ error: 'missing_name' })
      }

      const folderId = await folders.create({ name })

      eventService.emit('folder.created', { folderId, name })
      reply.send({ id: folderId })
    } catch (err) {
      const mapped = mapError(err)
      reply.status(mapped.status || 500).send({ error: mapped.message })
    }
  })

  // Update folder
  app.put('/api/folders/:id', async (req, reply) => {
    try {
      const { id } = req.params
      const { name } = req.body || {}

      if (!name) {
        return reply.status(400).send({ error: 'missing_name' })
      }

      await folders.update(id, { name })

      eventService.emit('folder.updated', { folderId: id, name })
      reply.send({ ok: true })
    } catch (err) {
      const mapped = mapError(err)
      reply.status(mapped.status || 500).send({ error: mapped.message })
    }
  })

  // Delete folder
  app.delete('/api/folders/:id', async (req, reply) => {
    try {
      const { id } = req.params
      await folders.delete(id)

      eventService.emit('folder.deleted', { folderId: id })
      reply.send({ ok: true })
    } catch (err) {
      const mapped = mapError(err)
      reply.status(mapped.status || 500).send({ error: mapped.message })
    }
  })
}

module.exports = registerFolderRoutes
