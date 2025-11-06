const { getSupabaseClient, getSupabaseServiceClient } = require('./supabaseClient');
const AssetRepository = require('../repositories/AssetRepository');
const AssetService = require('../services/AssetService');
const UploadService = require('../services/UploadService');
const AuthService = require('../services/AuthService');

function createDependencies() {
  const supabase = getSupabaseClient();
  const supabaseService = (() => {
    try {
      return getSupabaseServiceClient();
    } catch (err) {
      // In local dev, service client may not be available; allow undefined but warn
      console.warn('Supabase service client not configured:', err.message || err);
      return undefined;
    }
  })();

  // Repositories
  const assetRepository = new AssetRepository(supabase);

  // Services
  const assetService = new AssetService({ assetRepository, supabaseServiceClient: supabaseService });
  const uploadService = new UploadService(supabaseService);
  const authService = new AuthService(supabase, supabaseService);

  return {
    supabase,
    supabaseService,
    assetRepository,
    assetService,
    uploadService,
    authService
  };
}

module.exports = { createDependencies };
