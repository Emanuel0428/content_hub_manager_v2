/**
 * Event Repository
 * Handles all database operations for events
 */

const BaseRepository = require('./BaseRepository')

class EventRepository extends BaseRepository {
  constructor(db) {
    super(db, 'events')
  }

  /**
   * Get recent events (default: last 200)
   */
  async getRecent(limit = 200) {
    return this.all(
      'SELECT id, type, payload, created_at FROM events ORDER BY id DESC LIMIT ?',
      [limit]
    )
  }
}

module.exports = EventRepository
