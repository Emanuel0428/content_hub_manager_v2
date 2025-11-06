const crypto = require('crypto');

class UploadService {
  /**
   * @param {import('@supabase/supabase-js').SupabaseClient} supabaseService
   */
  constructor(supabaseService) {
    this.supabaseService = supabaseService;
    this.bucket = 'Assets';
  }

  async uploadBuffer(storagePath, buffer, contentType = 'application/octet-stream') {
    if (!this.supabaseService) throw new Error('Supabase service client not configured');

    const { data, error } = await this.supabaseService.storage.from(this.bucket).upload(storagePath, buffer, {
      contentType,
      upsert: false,
      cacheControl: '3600'
    });

    if (error) throw error;

    const { data: publicData } = this.supabaseService.storage.from(this.bucket).getPublicUrl(storagePath);
    return {
      path: storagePath,
      publicUrl: publicData?.publicUrl || null,
      data
    };
  }

  async deleteFile(storagePath) {
    if (!this.supabaseService) throw new Error('Supabase service client not configured');
    const { error } = await this.supabaseService.storage.from(this.bucket).remove([storagePath]);
    if (error) throw error;
    return true;
  }

  generateStoragePath(filename, prefix = 'assets') {
    const timestamp = Date.now();
    const hash = crypto.randomBytes(6).toString('hex');
    const ext = filename.split('.').pop() || 'bin';
    return `${prefix}/${timestamp}-${hash}.${ext}`;
  }
}

module.exports = UploadService;
