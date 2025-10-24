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
  endpointMetrics: {}
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

module.exports = {
  registerObservability,
  log,
  logError,
  metrics,
  generateRequestId
}
