/**
 * Upload Routes
 * HTTP endpoints for file upload management
 * Files are stored in Supabase Storage bucket "Assets"
 */

const mapError = require('../utils/errorMapper')
const { log, logError } = require('../middleware/observability')

/**
 * registerUploadRoutes(app, deps)
 * deps.uploadService expected
 */
function registerUploadRoutes(app, deps = {}) {
  const { uploadService, supabase } = deps;

  app.post('/api/upload', async (req, reply) => {
    try {
      // Prefer UploadService if available
      if (!uploadService) {
        // LEGACY: direct supabase implementation commented out for migration.
        // const supabase = require('../config/supabaseClient').getSupabaseClient();
        // const supabaseService = require('../config/supabaseClient').getSupabaseServiceClient();
        return reply.status(500).send({ success: false, error: 'upload_service_unavailable' });
      }

      // Process multipart and upload first file found
      const parts = req.parts();
      for await (const part of parts) {
        if (!part.file) continue;

        const chunks = [];
        for await (const chunk of part.file) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);

        // Validate size
        const maxSize = 500 * 1024 * 1024;
        if (buffer.length > maxSize) return reply.status(413).send({ success: false, error: 'file_too_large' });

        const filename = part.filename || `upload-${Date.now()}.bin`;
        const storagePath = uploadService.generateStoragePath(filename);

        const uploaded = await uploadService.uploadBuffer(storagePath, buffer, part.mimetype || 'application/octet-stream');
        return reply.send({ success: true, path: uploaded.path, publicUrl: uploaded.publicUrl, filename: filename, size: buffer.length });
      }

      return reply.status(400).send({ success: false, error: 'no_file', message: 'No file provided in upload' });
    } catch (err) {
      console.error('Upload route error:', err);
      const mapped = mapError(err);
      reply.status(mapped.status || 500).send({ success: false, error: mapped.message || 'Upload failed', details: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });
    }
  });
}

module.exports = registerUploadRoutes
