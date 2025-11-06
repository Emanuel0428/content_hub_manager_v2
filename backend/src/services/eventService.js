const { getSupabaseClient } = require('../config/supabaseClient')

module.exports = {
  emit: async function(eventType, payload) {
    try {
      const supabase = getSupabaseClient()
      
      // Insert event into Supabase (optional - doesn't fail if events table has issues)
      await supabase.from('events').insert({
        event_type: eventType,
        payload: payload || {},
        user_id: payload?.userId || null
      }).catch(err => {
        // Silently ignore event logging errors - not critical
        console.debug('Event log skipped:', eventType)
      })
    } catch (err) {
      // Silently fail - event logging is not critical
      console.debug('Event service error:', err.message)
    }
  }
}
