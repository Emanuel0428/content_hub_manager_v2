/**
 * Upload Routes
 * HTTP endpoints for file upload management
 * Files are stored in Supabase Storage bucket "Assets"
 */

const { getSupabaseClient } = require('../config/supabaseClient')
const { getSupabaseServiceClient } = require('../config/supabaseClient')
const mapError = require('../utils/errorMapper')
const crypto = require('crypto')
const { log, logError } = require('../middleware/observability')

function registerUploadRoutes(app) {
  /**
   * Upload file to Supabase Storage
   * POST /api/upload
   * Body: multipart/form-data with file
   */
  app.post('/api/upload', async (req, reply) => {
    
    try {
      const supabase = getSupabaseClient()
      const supabaseService = getSupabaseServiceClient()
      
      // Try to get user from Authorization header
      let userId = null
      const authHeader = req.headers.authorization
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        try {
          const { data, error } = await supabase.auth.getUser(token)
          if (data?.user) {
            userId = data.user.id
          }
        } catch (tokenError) {
          // Token validation error, continuing as anonymous
        }
      } else {
        // No auth token provided (anonymous upload)
      }
      
      const parts = req.parts()
      
      let fileCount = 0
      
      for await (const part of parts) {
        if (part.file) {
          fileCount++
          const filename = part.filename || `upload-${Date.now()}.bin`
          
          try {
            // Convert stream to buffer
            const chunks = []
            let totalBytes = 0
            
            for await (const chunk of part.file) {
              chunks.push(chunk)
              totalBytes += chunk.length
            }
            
            const fileBuffer = Buffer.concat(chunks)
            
            console.log('📊 File buffer stats:', {
              filename,
              bufferLength: fileBuffer.length,
              totalBytes,
              mimetype: part.mimetype
            })
            
            // Validate file size (max 500MB)
            const maxSize = 500 * 1024 * 1024
            if (fileBuffer.length > maxSize) {
              console.error('File too large:', fileBuffer.length)
              return reply.status(413).send({ 
                success: false,
                error: 'file_too_large',
                message: `File size ${fileBuffer.length} exceeds maximum ${maxSize} bytes`
              })
            }
            
            // Generate unique filename
            const timestamp = Date.now()
            const hash = crypto.randomBytes(8).toString('hex')
            const ext = filename.split('.').pop() || 'bin'
            const uniqueName = `${timestamp}-${hash}.${ext}`
            const storagePath = `assets/${uniqueName}`
            
            
            // Upload to Supabase Storage using service role (bypasses RLS)
            const { data: uploadData, error: uploadError } = await supabaseService.storage
              .from('Assets')
              .upload(storagePath, fileBuffer, {
                contentType: part.mimetype || 'application/octet-stream',
                upsert: false,
                cacheControl: '3600'
              })
            
            if (uploadError) {
              console.error('Supabase upload error:', uploadError)
              
              return reply.status(500).send({ 
                success: false,
                error: 'storage_upload_failed',
                message: uploadError.message || 'Failed to upload to storage',
                details: uploadError
              })
            }
            
            // Get public URL
            const { data: publicData } = supabase.storage
              .from('Assets')
              .getPublicUrl(storagePath)
            
            const publicUrl = publicData?.publicUrl || null
            
            return reply.send({ 
              success: true,
              path: storagePath,
              publicUrl: publicUrl,
              filename: uniqueName,
              size: fileBuffer.length
            })
          } catch (streamError) {
            console.error('Error processing file stream:', streamError)
            return reply.status(400).send({ 
              success: false,
              error: 'file_stream_error',
              message: 'Failed to process uploaded file: ' + streamError.message,
              details: streamError.toString()
            })
          }
        }
      }
      
      return reply.status(400).send({ 
        success: false,
        error: 'no_file',
        message: 'No file provided in upload'
      })
      
    } catch (err) {
      console.error('Upload route error:', err)
      const mapped = mapError(err)
      reply.status(mapped.status || 500).send({ 
        success: false,
        error: mapped.message || 'Upload failed',
        details: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      })
    }
  })
}

module.exports = registerUploadRoutes
