/**
 * Upload Routes
 * HTTP endpoints for file upload management
 */

const path = require('path')
const fs = require('fs')
const mapError = require('../utils/errorMapper')
const eventService = require('../services/eventService')

function registerUploadRoutes(app) {
  // Simple multipart upload endpoint
  app.post('/api/upload', async (req, reply) => {
    try {
      const parts = req.parts()
      
      for await (const part of parts) {
        if (part.file) {
          const filename = part.filename || 'upload.bin'
          const outPath = path.join(__dirname, '..', '..', 'public', 'uploads', filename)
          
          await fs.promises.mkdir(path.dirname(outPath), { recursive: true })
          
          const ws = fs.createWriteStream(outPath)
          await new Promise((resolve, reject) => {
            part.file.pipe(ws)
            part.file.on('end', resolve)
            part.file.on('error', reject)
          })

          // Emit event
          eventService.emit('upload.completed', { 
            filename, 
            path: '/public/uploads/' + filename 
          })
          
          return reply.send({ path: '/public/uploads/' + filename })
        }
      }
      
      return reply.status(400).send({ error: 'no_file' })
    } catch (err) {
      const mapped = mapError(err)
      reply.status(mapped.status || 500).send({ error: mapped.message })
    }
  })
}

module.exports = registerUploadRoutes
