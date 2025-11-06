const fs = require('fs');
const path = require('path');
const { createReadStream } = require('fs');
const { promisify } = require('util');
const stat = promisify(fs.stat);

/**
 * Supabase Storage Upload Helper
 * 
 * Provides streaming upload capabilities for migrating assets to Supabase Storage.
 * Handles file validation, path generation, and upload progress tracking.
 */
class StorageUploader {
  
  constructor(supabaseClient, options = {}) {
    this.supabase = supabaseClient;
    this.bucketName = options.bucketName || process.env.STORAGE_BUCKET_NAME || 'assets';
    this.maxFileSize = options.maxFileSize || 50 * 1024 * 1024; // 50MB default
    this.allowedMimeTypes = options.allowedMimeTypes || [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'application/pdf'
    ];
    this.uploadStats = {
      totalUploads: 0,
      successfulUploads: 0,
      failedUploads: 0,
      totalBytes: 0
    };
  }

  /**
   * Generate storage path for an asset
   * @param {Object} asset - Asset metadata
   * @param {string} asset.platform - Platform (youtube, tiktok, twitch)
   * @param {string} asset.mime_type - MIME type
   * @param {number} asset.id - Asset ID
   * @returns {string} Generated storage path
   */
  generateStoragePath(asset) {
    const { platform, mime_type, id } = asset;
    
    // Determine file extension from MIME type
    const extensionMap = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/quicktime': 'mov',
      'application/pdf': 'pdf'
    };
    
    const extension = extensionMap[mime_type] || 'bin';
    
    // Determine category from MIME type
    let category = 'other';
    if (mime_type.startsWith('image/')) category = 'images';
    else if (mime_type.startsWith('video/')) category = 'videos';
    else if (mime_type === 'application/pdf') category = 'documents';
    
    // Generate path: category/platform/asset-id-timestamp.extension
    const timestamp = Date.now();
    const fileName = `asset-${id}-${timestamp}.${extension}`;
    
    return `${category}/${platform}/${fileName}`;
  }

  /**
   * Validate file before upload
   * @param {string} filePath - Local file path
   * @param {Object} asset - Asset metadata
   * @returns {Promise<Object>} Validation result
   */
  async validateFile(filePath, asset) {
    const result = {
      valid: false,
      errors: [],
      fileStats: null
    };

    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        result.errors.push('File does not exist');
        return result;
      }

      // Get file stats
      result.fileStats = await stat(filePath);

      // Check file size
      if (result.fileStats.size > this.maxFileSize) {
        result.errors.push(`File size (${result.fileStats.size}) exceeds maximum (${this.maxFileSize})`);
      }

      // Check MIME type
      if (asset.mime_type && !this.allowedMimeTypes.includes(asset.mime_type)) {
        result.errors.push(`MIME type ${asset.mime_type} not allowed`);
      }

      // Validate file can be read
      try {
        const stream = createReadStream(filePath, { start: 0, end: 1024 });
        await new Promise((resolve, reject) => {
          stream.on('data', () => resolve());
          stream.on('error', reject);
        });
      } catch (readError) {
        result.errors.push('File cannot be read');
      }

      result.valid = result.errors.length === 0;
      return result;

    } catch (error) {
      result.errors.push(`Validation failed: ${error.message}`);
      return result;
    }
  }

  /**
   * Upload file to Supabase Storage with streaming
   * @param {string} localPath - Local file path
   * @param {Object} asset - Asset metadata
   * @param {Object} options - Upload options
   * @param {boolean} options.dryRun - If true, simulate upload without actual transfer
   * @param {Function} options.onProgress - Progress callback function
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile(localPath, asset, options = {}) {
    const { dryRun = false, onProgress } = options;
    
    const result = {
      success: false,
      storagePath: null,
      publicUrl: null,
      uploadedBytes: 0,
      error: null,
      dryRun
    };

    try {
      // Validate file first
      const validation = await this.validateFile(localPath, asset);
      if (!validation.valid) {
        result.error = validation.errors.join(', ');
        this.uploadStats.failedUploads++;
        return result;
      }

      // Generate storage path
      result.storagePath = this.generateStoragePath(asset);

      if (dryRun) {
        // Simulate upload for dry run
        result.success = true;
        result.publicUrl = this.generatePublicUrl(result.storagePath);
        result.uploadedBytes = validation.fileStats.size;
        this.uploadStats.totalUploads++;
        this.uploadStats.successfulUploads++;
        this.uploadStats.totalBytes += validation.fileStats.size;
        return result;
      }

      // Perform actual upload
      const fileBuffer = fs.readFileSync(localPath);
      
      // Report progress if callback provided
      if (onProgress) {
        onProgress({
          phase: 'uploading',
          bytesUploaded: 0,
          totalBytes: fileBuffer.length,
          asset: asset
        });
      }

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(result.storagePath, fileBuffer, {
          contentType: asset.mime_type,
          upsert: false // Don't overwrite existing files
        });

      if (error) {
        result.error = error.message;
        this.uploadStats.failedUploads++;
        return result;
      }

      // Generate public URL
      result.publicUrl = this.generatePublicUrl(result.storagePath);
      result.success = true;
      result.uploadedBytes = fileBuffer.length;

      // Update statistics
      this.uploadStats.totalUploads++;
      this.uploadStats.successfulUploads++;
      this.uploadStats.totalBytes += fileBuffer.length;

      // Report completion
      if (onProgress) {
        onProgress({
          phase: 'completed',
          bytesUploaded: fileBuffer.length,
          totalBytes: fileBuffer.length,
          asset: asset
        });
      }

      return result;

    } catch (error) {
      result.error = error.message;
      this.uploadStats.failedUploads++;
      
      if (onProgress) {
        onProgress({
          phase: 'error',
          error: error.message,
          asset: asset
        });
      }

      return result;
    }
  }

  /**
   * Generate public URL for uploaded file
   * @param {string} storagePath - Storage path
   * @returns {string} Public URL
   */
  generatePublicUrl(storagePath) {
    const { data } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(storagePath);
    
    return data.publicUrl;
  }

  /**
   * Upload multiple files with concurrency control
   * @param {Array} uploads - Array of {localPath, asset} objects
   * @param {Object} options - Upload options
   * @param {boolean} options.dryRun - Simulate uploads
   * @param {number} options.concurrency - Max concurrent uploads
   * @param {Function} options.onProgress - Progress callback
   * @returns {Promise<Array>} Array of upload results
   */
  async uploadBatch(uploads, options = {}) {
    const { 
      dryRun = false, 
      concurrency = 5,
      onProgress 
    } = options;

    const results = [];
    const chunks = this.chunkArray(uploads, concurrency);

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(({ localPath, asset }) => 
        this.uploadFile(localPath, asset, { 
          dryRun, 
          onProgress: (progress) => {
            if (onProgress) {
              onProgress({
                ...progress,
                batchProgress: {
                  completed: results.length,
                  total: uploads.length
                }
              });
            }
          }
        })
      );

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);

      // Brief pause between chunks to avoid rate limiting
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Split array into chunks
   * @param {Array} array - Array to chunk
   * @param {number} chunkSize - Size of each chunk
   * @returns {Array} Array of chunks
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Get upload statistics
   * @returns {Object} Upload statistics
   */
  getStats() {
    return { ...this.uploadStats };
  }

  /**
   * Reset upload statistics
   */
  resetStats() {
    this.uploadStats = {
      totalUploads: 0,
      successfulUploads: 0,
      failedUploads: 0,
      totalBytes: 0
    };
  }

  /**
   * Check if storage bucket exists and is accessible
   * @returns {Promise<boolean>} True if bucket is accessible
   */
  async validateBucket() {
    try {
      const { data, error } = await this.supabase.storage.getBucket(this.bucketName);
      return !error && data;
    } catch (error) {
      return false;
    }
  }
}

module.exports = StorageUploader;