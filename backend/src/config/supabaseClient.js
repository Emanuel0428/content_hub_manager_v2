const { createClient } = require('@supabase/supabase-js');

/**
 * Supabase client factory for Content Hub Manager
 * 
 * Creates appropriate client instances based on usage context:
 * - Anonymous client for public operations
 * - Service role client for admin/migration operations
 */

let supabaseAnon = null;
let supabaseService = null;

/**
 * Get Supabase client with anonymous key
 * Used for: public API operations, client-side auth
 * Row Level Security: Enforced
 */
function getSupabaseClient() {
  if (!supabaseAnon) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration: SUPABASE_URL and SUPABASE_ANON_KEY required');
    }
    
    supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  }
  
  return supabaseAnon;
}

/**
 * Get Supabase client with service role key
 * Used for: migration scripts, admin operations, bypassing RLS
 * Row Level Security: BYPASSED - use with caution
 * 
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
function getSupabaseServiceClient() {
  if (!supabaseService) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase service configuration: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
    }
    
    supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  
  return supabaseService;
}

/**
 * Validate Supabase connection
 * Tests both anonymous and service clients
 */
async function validateSupabaseConnection() {
  try {
    // Test anonymous client
    const anon = getSupabaseClient();
    const { error: anonError } = await anon.from('assets').select('count', { count: 'exact', head: true });
    
    // Test service client  
    const service = getSupabaseServiceClient();
    const { error: serviceError } = await service.from('assets').select('count', { count: 'exact', head: true });
    
    return {
      anonymous: !anonError,
      service: !serviceError,
      errors: {
        anonymous: anonError?.message,
        service: serviceError?.message
      }
    };
  } catch (error) {
    return {
      anonymous: false,
      service: false,
      errors: {
        connection: error.message
      }
    };
  }
}

module.exports = {
  getSupabaseClient,
  getSupabaseServiceClient,
  validateSupabaseConnection
};