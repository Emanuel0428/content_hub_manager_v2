/**
 * Observability Middleware
 * Provides structured logging, request/response tracking, and basic metrics.
 */

const fs = require('fs')
const path = require('path')

// Simple metrics store (in-memory for MVP)
const metrics = {
  requests: 0,
  errors: 0,
  totalResponseTime: 0,
  endpointMetrics: {},
  migration: {
    totalJobs: 0,
    runningJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    totalAssetsProcessed: 0,
    totalUploadedBytes: 0,
    averageJobDuration: 0
  }
}

/**
 * Log an event to console and optionally to file
 * @param {string} level - Log level (info, warn, error)
 * @param {string} message - Log message
 * @param {object} meta - Additional metadata
 */
function log(level, message, meta = {}) {
  const timestamp = new Date().toISOString()
  
  // Console output (human-readable format)
  const colors = { 
    info: '\x1b[36m',    // Cyan
    warn: '\x1b[33m',    // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'     // Reset
  }
  
  const levelColor = colors[level] || ''
  const resetColor = colors.reset
  const levelUpper = level.toUpperCase().padEnd(5)
  
  // Build readable log message
  let logMessage = `${levelColor}[${timestamp}] ${levelUpper}${resetColor} ${message}`

  /*if (meta.requestId) {
    logMessage += ` ${colors.info}(${meta.requestId})${resetColor}`
  }*/
  
  // console.log(logMessage)
}

/**
 * Fastify hook: preHandler - Log incoming requests
 */
async function preHandler(request, reply) {
  request.id = request.id || generateRequestId()
  request.startTime = Date.now()
  
  metrics.requests++
  
  /*log('info', `→ ${request.method} ${request.url}`, {
    requestId: request.id
  })*/
}

/**
 * Fastify hook: onResponse - Log responses and track metrics
 */
async function onResponse(request, reply) {
  const duration = Date.now() - request.startTime
  const statusCode = reply.statusCode
  
  // Track endpoint metrics
  const endpoint = `${request.method} ${request.url.split('?')[0]}`
  if (!metrics.endpointMetrics[endpoint]) {
    metrics.endpointMetrics[endpoint] = {
      count: 0,
      totalTime: 0,
      errors: 0
    }
  }
  metrics.endpointMetrics[endpoint].count++
  metrics.endpointMetrics[endpoint].totalTime += duration
  
  // Track errors
  if (statusCode >= 400) {
    metrics.errors++
    metrics.endpointMetrics[endpoint].errors++
  }
  
  metrics.totalResponseTime += duration
  
  const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'
  const statusIcon = statusCode < 400 ? '✓' : '✗'
  
  /*log(logLevel, `${statusIcon} ${request.method} ${request.url.split('?')[0]} → ${statusCode} (${duration}ms)`, {
    requestId: request.id
  })*/
}

/**
 * Generate a unique request ID
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Register observability hooks with Fastify
 */
function registerObservability(app) {
  app.addHook('preHandler', preHandler)
  app.addHook('onResponse', onResponse)
  
  // Health/metrics endpoint
  app.get('/api/metrics', (req, reply) => {
    const avgResponseTime = metrics.requests > 0 
      ? Math.round(metrics.totalResponseTime / metrics.requests) 
      : 0
    
    const endpointStats = Object.entries(metrics.endpointMetrics).map(([endpoint, stats]) => ({
      endpoint,
      requests: stats.count,
      errors: stats.errors,
      avgTime: Math.round(stats.totalTime / stats.count)
    }))
    
    return reply.send({
      metrics: {
        totalRequests: metrics.requests,
        totalErrors: metrics.errors,
        errorRate: metrics.requests > 0 
          ? ((metrics.errors / metrics.requests) * 100).toFixed(2) + '%'
          : '0%',
        avgResponseTime: `${avgResponseTime}ms`,
        endpoints: endpointStats
      },
      timestamp: new Date().toISOString()
    })
  })

  // log('info', '✓ Observability middleware registered')
}

/**
 * Log an error for troubleshooting
 */
function logError(error, context = {}) {
  log('error', error.message, {
    ...context,
    stack: error.stack,
    errorType: error.constructor.name
  })
}

/**
 * Log migration events with structured data
 */
function logMigrationEvent(event, data = {}) {
  const migrationEvent = {
    timestamp: new Date().toISOString(),
    event,
    ...data
  }

  // Update migration metrics
  updateMigrationMetrics(event, data)

  log('info', `Migration: ${event}`, migrationEvent)
}

/**
 * Update migration metrics based on events
 */
function updateMigrationMetrics(event, data) {
  switch (event) {
    case 'job_started':
      metrics.migration.totalJobs++
      metrics.migration.runningJobs++
      break
      
    case 'job_completed':
      metrics.migration.runningJobs--
      metrics.migration.completedJobs++
      if (data.assetsProcessed) {
        metrics.migration.totalAssetsProcessed += data.assetsProcessed
      }
      if (data.uploadedBytes) {
        metrics.migration.totalUploadedBytes += data.uploadedBytes
      }
      if (data.duration) {
        const totalCompleted = metrics.migration.completedJobs
        const currentAvg = metrics.migration.averageJobDuration
        metrics.migration.averageJobDuration = 
          ((currentAvg * (totalCompleted - 1)) + data.duration) / totalCompleted
      }
      break
      
    case 'job_failed':
      metrics.migration.runningJobs--
      metrics.migration.failedJobs++
      break
      
    case 'asset_uploaded':
      if (data.uploadedBytes) {
        metrics.migration.totalUploadedBytes += data.uploadedBytes
      }
      break
      
    case 'batch_processed':
      if (data.assetsProcessed) {
        metrics.migration.totalAssetsProcessed += data.assetsProcessed
      }
      break
  }
}

/**
 * Get migration metrics for monitoring
 */
function getMigrationMetrics() {
  return {
    ...metrics.migration,
    successRate: metrics.migration.totalJobs > 0 
      ? (metrics.migration.completedJobs / metrics.migration.totalJobs) * 100 
      : 0,
    averageUploadSize: metrics.migration.totalAssetsProcessed > 0
      ? metrics.migration.totalUploadedBytes / metrics.migration.totalAssetsProcessed
      : 0
  }
}

/**
 * Create migration logger for specific job
 */
function createMigrationLogger(jobId) {
  return {
    jobStarted: (metadata = {}) => {
      logMigrationEvent('job_started', { jobId, ...metadata })
    },
    
    jobCompleted: (stats = {}) => {
      logMigrationEvent('job_completed', { jobId, ...stats })
    },
    
    jobFailed: (error, stats = {}) => {
      logMigrationEvent('job_failed', { 
        jobId, 
        error: error.message || error,
        ...stats 
      })
    },
    
    batchStarted: (batchNumber, batchSize) => {
      logMigrationEvent('batch_started', { jobId, batchNumber, batchSize })
    },
    
    batchCompleted: (batchNumber, stats) => {
      logMigrationEvent('batch_processed', { 
        jobId, 
        batchNumber, 
        assetsProcessed: stats.processed,
        uploadedBytes: stats.uploadedBytes,
        failed: stats.failed
      })
    },
    
    assetUploaded: (assetId, uploadedBytes, storagePath) => {
      logMigrationEvent('asset_uploaded', { 
        jobId, 
        assetId, 
        uploadedBytes, 
        storagePath 
      })
    },
    
    assetFailed: (assetId, error, phase = 'unknown') => {
      logMigrationEvent('asset_failed', { 
        jobId, 
        assetId, 
        error: error.message || error,
        phase 
      })
    },
    
    progress: (processed, total, currentAsset = null) => {
      const percentage = Math.round((processed / total) * 100)
      logMigrationEvent('progress_update', { 
        jobId, 
        processed, 
        total, 
        percentage,
        currentAsset: currentAsset?.title || currentAsset?.id
      })
    },
    
    info: (message, metadata = {}) => {
      log('info', `Migration ${jobId}: ${message}`, metadata)
    },
    
    warn: (message, metadata = {}) => {
      log('warn', `Migration ${jobId}: ${message}`, metadata)
    },
    
    error: (message, metadata = {}) => {
      log('error', `Migration ${jobId}: ${message}`, metadata)
    }
  }
}

module.exports = {
  registerObservability,
  log,
  logError,
  logMigrationEvent,
  createMigrationLogger,
  getMigrationMetrics,
  metrics,
  generateRequestId
}
