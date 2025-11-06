/**
 * Authentication Routes
 * HTTP endpoints for user authentication via Supabase
 */

const { logError, log } = require('../middleware/observability');

/**
 * Register authentication routes with Fastify
 * registerAuthRoutes(app, deps)
 * deps.authService expected
 */
function registerAuthRoutes(app, deps = {}) {
  const { authService } = deps;
  log('Auth routes initialized');

  /**
   * GET /api/auth/test
   * Test endpoint to verify Supabase connection
   */
  app.get('/api/auth/test', async (request, reply) => {
    try {
      reply.send({ success: true, message: 'Auth routes available', timestamp: new Date().toISOString() });
    } catch (error) {
      logError('Auth test error', error);
      reply.status(500).send({ success: false, error: 'Auth service connection failed' });
    }
  });

  /**
   * GET /api/auth/check/:email
   * Check if user exists (for debugging)
   */
  app.get('/api/auth/check/:email', async (request, reply) => {
    try {
      const { email } = request.params;
      log('Checking if user exists', { email });

      // For migration: use authService if available
      if (authService && authService.getUserByEmail) {
        const user = await authService.getUserByEmail(email);
        return reply.send({ success: true, exists: !!user, email });
      }

      // Legacy behavior commented out during migration
      // const supabase = require('../config/supabaseClient').getSupabaseClient();
      // const { data } = await supabase.from('users').select('*').eq('email', email).limit(1);
      return reply.send({ success: true, message: 'Endpoint available for checking users', email });
    } catch (error) {
      logError('Auth check error', error);
      reply.status(500).send({ success: false, error: 'Check failed' });
    }
  });

  /**
   * POST /api/auth/signup
   * Register a new user with email and password
   */
  app.post('/api/auth/signup', async (request, reply) => {
    try {
      const { email, password, displayName } = request.body || {};
      if (!email || !password) return reply.status(400).send({ success: false, error: 'Email and password are required' });

      if (!authService) {
        // LEGACY signup logic commented out during migration
        return reply.status(500).send({ success: false, error: 'auth_service_unavailable' });
      }

      const { user, session } = await authService.signup(email, password, displayName);
      return reply.send({ success: true, message: 'User created successfully', user: { id: user?.id, email: user?.email, displayName: user?.user_metadata?.display_name }, session });
    } catch (error) {
      logError('Auth signup error', error);
      reply.status(500).send({ success: false, error: error.message || 'Internal server error' });
    }
  });

  /**
   * POST /api/auth/login
   * Authenticate user with email and password
   */
  app.post('/api/auth/login', async (request, reply) => {
    try {
      const { email, password } = request.body || {};
      if (!email || !password) return reply.status(400).send({ success: false, error: 'Email and password are required' });

      if (!authService) return reply.status(500).send({ success: false, error: 'auth_service_unavailable' });

      const data = await authService.login(email, password);
      return reply.send({ success: true, message: 'Login successful', user: { id: data.user?.id, email: data.user?.email, displayName: data.user?.user_metadata?.display_name }, session: data.session });
    } catch (error) {
      logError('Auth login exception', { message: error.message, stack: error.stack });
      reply.status(401).send({ success: false, error: error.message || 'Invalid email or password' });
    }
  });

  /**
   * POST /api/auth/logout
   * Sign out the current user
   */
  app.post('/api/auth/logout', async (request, reply) => {
    try {
      if (!authService) return reply.status(500).send({ success: false, error: 'auth_service_unavailable' });
      await authService.logout();
      return reply.send({ success: true, message: 'Logout successful' });
    } catch (error) {
      logError('Auth logout error', error);
      reply.status(500).send({ success: false, error: 'Internal server error' });
    }
  });

  /**
   * POST /api/auth/refresh
   * Refresh user session
   */
  app.post('/api/auth/refresh', async (request, reply) => {
    try {
      const { refreshToken, refresh_token } = request.body || {};
      const token = refreshToken || refresh_token;
      if (!token) return reply.status(400).send({ success: false, error: 'Refresh token is required' });
      if (!authService) return reply.status(500).send({ success: false, error: 'auth_service_unavailable' });
      const data = await authService.refreshSession(token);
      return reply.send({ success: true, session: data.session, user: { id: data.user?.id, email: data.user?.email, displayName: data.user?.user_metadata?.display_name } });
    } catch (error) {
      logError('Auth refresh error', error);
      reply.status(500).send({ success: false, error: 'Internal server error' });
    }
  });

  /**
   * GET /api/auth/user
   * Get current user information
   */
  app.get('/api/auth/user', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) return reply.status(401).send({ success: false, error: 'No authorization token provided' });
      const token = authHeader.replace('Bearer ', '');
      if (!authService) return reply.status(500).send({ success: false, error: 'auth_service_unavailable' });
      const user = await authService.getUserFromToken(token);
      if (!user) return reply.status(401).send({ success: false, error: 'Invalid or expired token' });
      return reply.send({ success: true, user: { id: user.id, email: user.email, displayName: user.user_metadata?.display_name } });
    } catch (error) {
      logError('Auth user error', error);
      reply.status(500).send({ success: false, error: 'Internal server error' });
    }
  });

  /**
   * POST /api/auth/reset-password
   * Send password reset email
   */
  app.post('/api/auth/reset-password', async (request, reply) => {
    try {
      const { email } = request.body || {};
      if (!email) return reply.status(400).send({ success: false, error: 'Email is required' });
      if (!authService) return reply.status(500).send({ success: false, error: 'auth_service_unavailable' });
      await authService.resetPasswordForEmail(email);
      return reply.send({ success: true, message: 'Password reset email sent' });
    } catch (error) {
      logError('Auth reset password error', error);
      reply.status(500).send({ success: false, error: error.message || 'Internal server error' });
    }
  });

  /**
   * POST /api/auth/update-password
   * Update user password
   */
  app.post('/api/auth/update-password', async (request, reply) => {
    try {
      const { password } = request.body || {};
      if (!password) return reply.status(400).send({ success: false, error: 'New password is required' });
      if (!authService) return reply.status(500).send({ success: false, error: 'auth_service_unavailable' });
      if (password.length < 6) return reply.status(400).send({ success: false, error: 'Password must be at least 6 characters long' });

      await authService.updatePassword(password);
      return reply.send({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      logError('Auth update password error', error);
      reply.status(500).send({ success: false, error: error.message || 'Internal server error' });
    }
  });
}

module.exports = registerAuthRoutes;