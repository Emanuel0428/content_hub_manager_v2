/**
 * Event Routes
 * HTTP endpoints for event management
 */

const mapError = require('../utils/errorMapper')

function registerEventRoutes(app, repositories) {
  const { events } = repositories

  // Get recent events
  app.get('/api/events', async (req, reply) => {
    try {
      const data = await events.getRecent(200)
      reply.send({ data })
    } catch (err) {
      const mapped = mapError(err)
      reply.status(mapped.status || 500).send({ error: mapped.message })
    }
  })
}

module.exports = registerEventRoutes
