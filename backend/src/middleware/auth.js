/**
 * Authentication Middleware (Stub)
 * Provides basic auth gating for API endpoints.
 * In production, this would integrate with your auth provider (OAuth2, JWT, etc.)
 */

const { log } = require('./observability')

/**
 * Simple auth stub: checks for Authorization header
 * For MVP/dev, accepts any valid Bearer token
 */
async function authGuard(request, reply) {
  const authHeader = request.headers.authorization
  
  // Skip auth for health and public endpoints
  if (request.url === '/api/health' || request.url.startsWith('/api/metrics')) {
    return
  }
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      error: 'unauthorized',
      message: 'Missing or invalid Authorization header'
    })
  }
  
  const token = authHeader.substring(7) // Remove "Bearer " prefix
  
  // In dev/MVP, accept any token > 10 chars
  // In production, validate the token against your auth provider
  if (token.length < 10) {
    return reply.status(401).send({
      error: 'invalid_token',
      message: 'Token too short'
    })
  }
  
  // Decode token to get user info (in production, validate signature)
  // For MVP, just extract payload from simple JWT-like format
  try {
    const payload = decodeToken(token)
    request.user = payload
  } catch (err) {
    // Token decode failed, but we'll allow it in dev mode
    request.user = {
      id: 'dev-user',
      email: 'dev@example.com',
      roles: ['admin']
    }
  }
}

/**
 * Simple JWT-like token decoder (no signature validation in stub)
 */
function decodeToken(token) {
  try {
    // Assume format: base64(header).base64(payload).signature
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid token format')
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'))
    return payload
  } catch (err) {
    throw new Error('Failed to decode token')
  }
}

/**
 * Role-based access control
 * @param {string[]} allowedRoles - Array of roles that can access the endpoint
 */
function requireRole(...allowedRoles) {
  return async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'unauthorized' })
    }
    
    const userRoles = request.user.roles || []
    const hasRole = allowedRoles.some(role => userRoles.includes(role))
    
    if (!hasRole) {
      return reply.status(403).send({
        error: 'forbidden',
        message: `Required roles: ${allowedRoles.join(', ')}`
      })
    }
  }
}

/**
 * Register auth middleware with Fastify
 */
function registerAuth(app, { enableAuth = false } = {}) {
  if (!enableAuth) {
    log('warn', '⚠️  Auth middleware disabled (dev mode). To enable: set ENABLE_AUTH=true')
    return
  }
  
  // Add auth guard as a preHandler hook
  app.addHook('preHandler', authGuard)
  log('info', '🔒 Auth middleware enabled')
}

module.exports = {
  authGuard,
  requireRole,
  registerAuth,
  decodeToken
}
