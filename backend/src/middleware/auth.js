/**
 * Authentication Middleware with Supabase Integration
 * Validates Supabase session/token on protected endpoints
 */

const { getSupabaseClient } = require('../config/supabaseClient');
const { log } = require('./observability');

/**
 * Supabase auth middleware: validates JWT tokens from Supabase Auth
 * Attaches user information to request object for downstream use
 */
async function authGuard(request, reply) {
  const authHeader = request.headers.authorization;
  
  // Skip auth for health, public endpoints, upload, and auth routes
  const publicPaths = ['/api/health', '/api/metrics', '/api/auth/', '/api/upload'];
  const isPublicPath = publicPaths.some(path => request.url.startsWith(path));
  
  if (isPublicPath) {
    return;
  }
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    log('warn', 'Auth attempt without Bearer token', { 
      url: request.url,
      ip: request.ip 
    });
    
    return reply.status(401).send({
      error: 'unauthorized',
      message: 'Missing or invalid Authorization header. Please provide a valid Bearer token.'
    });
  }
  
  const token = authHeader.substring(7); // Remove "Bearer " prefix
  
  try {
    const supabase = getSupabaseClient();
    
    // Validate token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      log('warn', 'Invalid Supabase token', { 
        url: request.url,
        error: error?.message,
        tokenPrefix: token.substring(0, 10) + '...'
      });
      
      return reply.status(401).send({
        error: 'unauthorized',
        message: 'Invalid or expired token. Please log in again.'
      });
    }
    
    // Attach user information to request for downstream use
    request.user = {
      id: data.user.id,
      email: data.user.email,
      displayName: data.user.user_metadata?.display_name || data.user.email.split('@')[0],
      emailConfirmed: data.user.email_confirmed_at != null,
      role: data.user.role || 'user'
    };
    
    log('info', 'User authenticated', { 
      userId: request.user.id,
      email: request.user.email,
      url: request.url
    });
    
  } catch (error) {
    log('error', 'Auth validation error', { 
      url: request.url,
      error: error.message,
      stack: error.stack
    });
    
    return reply.status(500).send({
      error: 'auth_error',
      message: 'Authentication service error. Please try again.'
    });
  }
}

/**
 * Express-compatible auth middleware
 * For use with Express routes that aren't using Fastify
 */
function expressAuthGuard(req, res, next) {
  const authHeader = req.headers.authorization;
  
  // Skip auth for public endpoints
  const publicPaths = ['/api/health', '/api/metrics', '/api/auth/'];
  const isPublicPath = publicPaths.some(path => req.url.startsWith(path));
  
  if (isPublicPath) {
    return next();
  }
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Missing or invalid Authorization header'
    });
  }
  
  const token = authHeader.substring(7);
  
  const supabase = getSupabaseClient();
  
  supabase.auth.getUser(token)
    .then(({ data, error }) => {
      if (error || !data.user) {
        return res.status(401).json({
          error: 'unauthorized', 
          message: 'Invalid or expired token'
        });
      }
      
      // Attach user to request
      req.user = {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.user_metadata?.display_name,
        emailConfirmed: data.user.email_confirmed_at != null,
        role: data.user.role || 'user'
      };
      
      next();
    })
    .catch(error => {
      console.error('Auth validation error:', error);
      res.status(500).json({
        error: 'auth_error',
        message: 'Authentication service error'
      });
    });
}

/**
 * Role-based access control middleware
 * @param {string[]} allowedRoles - Array of roles that can access the endpoint
 */
function requireRole(...allowedRoles) {
  return async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ 
        error: 'unauthorized',
        message: 'Authentication required'
      });
    }
    
    const userRole = request.user.role || 'user';
    const hasRole = allowedRoles.includes(userRole) || allowedRoles.includes('user');
    
    if (!hasRole) {
      log('warn', 'Access denied - insufficient role', {
        userId: request.user.id,
        userRole,
        requiredRoles: allowedRoles,
        url: request.url
      });
      
      return reply.status(403).send({
        error: 'forbidden',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }
    
    log('info', 'Role access granted', {
      userId: request.user.id,
      userRole,
      url: request.url
    });
  };
}

/**
 * Optional auth middleware - doesn't fail if no token provided
 * Useful for endpoints that work for both authenticated and anonymous users
 */
async function optionalAuth(request, reply) {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No auth provided, continue without user
    return;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser(token);
    
    if (!error && data.user) {
      request.user = {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.user_metadata?.display_name,
        emailConfirmed: data.user.email_confirmed_at != null,
        role: data.user.role || 'user'
      };
    }
  } catch (error) {
    // Ignore auth errors in optional auth
    log('info', 'Optional auth failed, continuing anonymously', {
      error: error.message
    });
  }
}

/**
 * Register auth middleware with Fastify
 */
function registerAuth(app, { enableAuth = true } = {}) {
  if (!enableAuth) {
    log('warn', '⚠️  Auth middleware disabled (dev mode). To enable: set enableAuth=true');
    return;
  }
  
  // Add auth guard as a preHandler hook
  app.addHook('preHandler', authGuard);
  log('info', '🔒 Supabase auth middleware enabled');
}

/**
 * Validate Supabase session manually (utility function)
 * @param {string} accessToken - Supabase access token
 * @returns {Promise<Object>} User data or null
 */
async function validateSupabaseSession(accessToken) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !data.user) {
      return null;
    }
    
    return {
      id: data.user.id,
      email: data.user.email,
      displayName: data.user.user_metadata?.display_name,
      emailConfirmed: data.user.email_confirmed_at != null,
      role: data.user.role || 'user'
    };
  } catch (error) {
    log('error', 'Session validation error', { error: error.message });
    return null;
  }
}

module.exports = {
  authGuard,
  expressAuthGuard,
  requireRole,
  optionalAuth,
  registerAuth,
  validateSupabaseSession
};
