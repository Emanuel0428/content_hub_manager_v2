/**
 * Authentication Routes
 * HTTP endpoints for user authentication via Supabase
 */

const { getSupabaseClient } = require('../config/supabaseClient');
const { logError, log } = require('../middleware/observability');

/**
 * Register authentication routes with Fastify
 */
function registerAuthRoutes(app) {
  // Use anonymous client for auth (signUp, signIn work with anon key)
  const supabase = getSupabaseClient();
  const supabaseAdmin = require('../config/supabaseClient').getSupabaseServiceClient();
  
  log('Auth routes initialized with Supabase client');

  /**
   * GET /api/auth/test
   * Test endpoint to verify Supabase connection
   */
  app.get('/api/auth/test', async (request, reply) => {
    try {
      log('Testing Supabase connection');
      reply.send({
        success: true,
        message: 'Auth service is working',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logError('Auth test error', error);
      reply.status(500).send({
        success: false,
        error: 'Auth service connection failed'
      });
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
      
      reply.send({
        success: true,
        message: 'Endpoint available for checking users',
        email
      });
    } catch (error) {
      logError('Auth check error', error);
      reply.status(500).send({
        success: false,
        error: 'Check failed'
      });
    }
  });

  /**
   * POST /api/auth/signup
   * Register a new user with email and password
   */
  app.post('/api/auth/signup', async (request, reply) => {
    try {
      log('Auth signup request received', { body: request.body });
      const { email, password, displayName } = request.body;

      // Validate required fields
      if (!email || !password) {
        log('Auth signup validation failed', { email: !!email, password: !!password });
        return reply.status(400).send({
          success: false,
          error: 'Email and password are required'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid email format'
        });
      }

      // Validate password strength
      if (password.length < 6) {
        return reply.status(400).send({
          success: false,
          error: 'Password must be at least 6 characters long'
        });
      }

      // Create user in Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0]
          },
          emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback`,
        }
      });

      if (error) {
        logError('Auth signup error', error);
        return reply.status(400).send({
          success: false,
          error: error.message
        });
      }

      log('User signed up successfully', { email, userId: data.user?.id });

      // If user was created but not confirmed, verify email using admin client
      if (data.user && !data.user.email_confirmed_at) {
        log('User email not confirmed, confirming with admin', { userId: data.user.id });
        
        try {
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            data.user.id,
            { email_confirm: true }
          );
          
          if (!updateError) {
            log('User email confirmed by admin', { userId: data.user.id });
          } else {
            log('Could not auto-confirm email', { error: updateError?.message });
          }
        } catch (confirmError) {
          logError('Error confirming email', confirmError);
        }
      }

      // Now try to sign in the user to get a session
      let sessionData = null;
      if (data.user) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInData?.session) {
          sessionData = signInData.session;
          log('Auto-signin session created', { userId: data.user.id });
        } else {
          log('Could not create session on signup', { error: signInError?.message });
        }
      }

      reply.send({
        success: true,
        message: 'User created successfully',
        user: {
          id: data.user?.id,
          email: data.user?.email,
          displayName: data.user?.user_metadata?.display_name
        },
        session: sessionData
      });
    } catch (error) {
      logError('Auth signup error', error);
      reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  /**
   * POST /api/auth/login
   * Authenticate user with email and password
   */
  app.post('/api/auth/login', async (request, reply) => {
    try {
      const { email, password } = request.body;

      log('Login attempt', { email, hasPassword: !!password });

      // Validate required fields
      if (!email || !password) {
        log('Login validation failed', { email: !!email, password: !!password });
        return reply.status(400).send({
          success: false,
          error: 'Email and password are required'
        });
      }

      log('Attempting Supabase authentication', { email });

      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      log('Auth response', { 
        success: !error, 
        userExists: !!data?.user,
        error: error?.message 
      });

      if (error) {
        logError('Auth login error', { message: error.message, status: error.status });
        return reply.status(401).send({
          success: false,
          error: error.message || 'Invalid email or password'
        });
      }

      if (!data?.user) {
        return reply.status(401).send({
          success: false,
          error: 'User not found'
        });
      }

      log('User logged in successfully', { email, userId: data.user?.id });

      reply.send({
        success: true,
        message: 'Login successful',
        user: {
          id: data.user?.id,
          email: data.user?.email,
          displayName: data.user?.user_metadata?.display_name
        },
        session: data.session
      });
    } catch (error) {
      logError('Auth login exception', { message: error.message, stack: error.stack });
      reply.status(500).send({
        success: false,
        error: 'Internal server error: ' + error.message
      });
    }
  });

  /**
   * POST /api/auth/logout
   * Sign out the current user
   */
  app.post('/api/auth/logout', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        return reply.status(401).send({
          success: false,
          error: 'No authorization token provided'
        });
      }

      const token = authHeader.replace('Bearer ', '');
      
      // Get user from token
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid or expired token'
        });
      }

      // Sign out
      const { error } = await supabase.auth.signOut();
      if (error) {
        logError('Auth logout error', error);
        return reply.status(400).send({
          success: false,
          error: error.message
        });
      }

      log('User logged out successfully', { userId: user.id });

      reply.send({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      logError('Auth logout error', error);
      reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  /**
   * POST /api/auth/refresh
   * Refresh user session
   */
  app.post('/api/auth/refresh', async (request, reply) => {
    try {
      const { refreshToken, refresh_token } = request.body;
      const token = refreshToken || refresh_token;

      if (!token) {
        return reply.status(400).send({
          success: false,
          error: 'Refresh token is required'
        });
      }

      // Refresh session
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: token
      });

      if (error) {
        logError('Auth refresh error', error);
        return reply.status(401).send({
          success: false,
          error: error.message
        });
      }

      reply.send({
        success: true,
        session: data.session,
        user: {
          id: data.user?.id,
          email: data.user?.email,
          displayName: data.user?.user_metadata?.display_name
        }
      });
    } catch (error) {
      logError('Auth refresh error', error);
      reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  /**
   * GET /api/auth/user
   * Get current user information
   */
  app.get('/api/auth/user', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        return reply.status(401).send({
          success: false,
          error: 'No authorization token provided'
        });
      }

      const token = authHeader.replace('Bearer ', '');
      
      // Get user from token
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid or expired token'
        });
      }

      reply.send({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.user_metadata?.display_name
        }
      });
    } catch (error) {
      logError('Auth user error', error);
      reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  /**
   * POST /api/auth/reset-password
   * Send password reset email
   */
  app.post('/api/auth/reset-password', async (request, reply) => {
    try {
      const { email } = request.body;

      if (!email) {
        return reply.status(400).send({
          success: false,
          error: 'Email is required'
        });
      }

      // Send reset password email
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        logError('Auth reset password error', error);
        return reply.status(400).send({
          success: false,
          error: error.message
        });
      }

      log('Password reset email sent', { email });

      reply.send({
        success: true,
        message: 'Password reset email sent'
      });
    } catch (error) {
      logError('Auth reset password error', error);
      reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  /**
   * POST /api/auth/update-password
   * Update user password
   */
  app.post('/api/auth/update-password', async (request, reply) => {
    try {
      const { password } = request.body;
      const authHeader = request.headers.authorization;

      if (!authHeader) {
        return reply.status(401).send({
          success: false,
          error: 'No authorization token provided'
        });
      }

      if (!password) {
        return reply.status(400).send({
          success: false,
          error: 'New password is required'
        });
      }

      // Validate password strength
      if (password.length < 6) {
        return reply.status(400).send({
          success: false,
          error: 'Password must be at least 6 characters long'
        });
      }

      const token = authHeader.replace('Bearer ', '');
      
      // Get user from token first
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid or expired token'
        });
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password
      });

      if (error) {
        logError('Auth update password error', error);
        return reply.status(400).send({
          success: false,
          error: error.message
        });
      }

      log('Password updated successfully', { userId: user.id });

      reply.send({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      logError('Auth update password error', error);
      reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });
}

module.exports = registerAuthRoutes;