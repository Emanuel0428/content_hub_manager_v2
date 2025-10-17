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
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta
  }
  
  const logLine = JSON.stringify(logEntry)
  
  // Console output (color-coded)
  const colors = { info: '\x1b[36m', warn: '\x1b[33m', error: '\x1b[31m', reset: '\x1b[0m' }
  console.log(`${colors[level] || ''}[${timestamp}] ${level.toUpperCase()}: ${message}${colors.reset}`, meta.requestId ? `(${meta.requestId})` : '')
}

/**
 * Fastify hook: preHandler - Log incoming requests
 */
async function preHandler(request, reply) {
  request.id = request.id || generateRequestId()
  request.startTime = Date.now()
  
  metrics.requests++
  
  log('info', `${request.method} ${request.url}`, {
    requestId: request.id,
    method: request.method,
    path: request.url,
    userAgent: request.headers['user-agent']
  })
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
  log(logLevel, `${request.method} ${request.url} → ${statusCode}`, {
    requestId: request.id,
    statusCode,
    duration: `${duration}ms`,
    method: request.method,
    path: request.url
  })
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
  
  log('info', 'Observability middleware registered')
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
