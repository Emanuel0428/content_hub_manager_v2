/**
 * Authentication Service for Frontend
 * 
 * Handles all authentication operations with the backend API.
 * Manages tokens, user sessions, and auth state persistence.
 */

export interface User {
  id: string;
  email: string;
  displayName: string;
  emailConfirmed: boolean;
  lastSignIn?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  session?: AuthSession;
  message?: string;
  error?: string;
}

export interface SignupData {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

class AuthService {
  private baseUrl = 'http://localhost:3001/api/auth';
  private storageKeys = {
    user: 'content_hub_user',
    session: 'content_hub_session'
  };

  /**
   * Test backend connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/test`);
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Sign up a new user
   */
  async signup(signupData: SignupData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Server error: ${response.status} ${response.statusText}`
        };
      }

      const data = await response.json();

      if (data.success && data.user) {
        if (data.session) {
          this.setSession(data.user, data.session);
        }
        // If no session, just store the user without session
        // User will need to login again or token will be obtained on next operation
      }

      return data;
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: 'Network error during signup. Please try again.'
      };
    }
  }

  /**
   * Sign in existing user
   */
  async login(loginData: LoginData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Login failed: ${response.status} ${response.statusText}`
        };
      }

      const data = await response.json();

      if (data.success && data.user) {
        if (data.session) {
          this.setSession(data.user, data.session);
        }
        // If no session, just store the user without session
        // User will need to login again or token will be obtained on next operation
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Network error during login. Please try again.'
      };
    }
  }

  /**
   * Sign out current user
   */
  async logout(): Promise<AuthResponse> {
    try {
      const session = this.getStoredSession();
      
      if (session) {
        const response = await fetch(`${this.baseUrl}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({
            refreshToken: session.refreshToken
          }),
        });

        const data = await response.json();
        
        // Clear local storage regardless of API response
        this.clearSession();
        
        return data;
      }

      // No session to logout
      this.clearSession();
      return {
        success: true,
        message: 'Logged out successfully'
      };

    } catch (error) {
      console.error('Logout error:', error);
      // Clear session even if API call fails
      this.clearSession();
      return {
        success: true,
        message: 'Logged out locally'
      };
    }
  }

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<AuthResponse> {
    try {
      const session = this.getStoredSession();
      
      if (!session?.refreshToken) {
        return {
          success: false,
          error: 'No refresh token available'
        };
      }

      const response = await fetch(`${this.baseUrl}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: session.refreshToken
        }),
      });

      const data = await response.json();

      if (data.success && data.user && data.session) {
        this.setSession(data.user, data.session);
      } else {
        // Refresh failed, clear session
        this.clearSession();
      }

      return data;
    } catch (error) {
      console.error('Refresh error:', error);
      this.clearSession();
      return {
        success: false,
        error: 'Failed to refresh session'
      };
    }
  }

  /**
   * Get current user info from API
   */
  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const session = this.getStoredSession();
      
      if (!session?.accessToken) {
        return {
          success: false,
          error: 'No access token available'
        };
      }

      const response = await fetch(`${this.baseUrl}/user`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      const data = await response.json();

      if (data.success && data.user) {
        // Update stored user data
        this.setUser(data.user);
      } else if (response.status === 401) {
        // Token expired, try to refresh
        const refreshResult = await this.refreshSession();
        if (refreshResult.success) {
          return this.getCurrentUser(); // Retry with new token
        } else {
          this.clearSession();
        }
      }

      return data;
    } catch (error) {
      console.error('Get user error:', error);
      return {
        success: false,
        error: 'Failed to get user information'
      };
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      return await response.json();
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: 'Failed to send reset email'
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const session = this.getStoredSession();
    
    if (!session?.accessToken) {
      return false;
    }

    // Check if token is expired
    // expiresAt is typically in seconds (from Supabase) but could be milliseconds
    // Convert to milliseconds for consistent comparison
    let expiresAtMs = session.expiresAt;
    if (session.expiresAt && session.expiresAt < 1000000000000) {
      // Likely in seconds, convert to milliseconds
      expiresAtMs = session.expiresAt * 1000;
    }
    
    const now = Date.now();
    if (expiresAtMs && expiresAtMs < now) {
      // Token expired, try to refresh silently
      this.refreshSession();
      return false;
    }

    return true;
  }

  /**
   * Get stored user data
   */
  getUser(): User | null {
    try {
      const userData = localStorage.getItem(this.storageKeys.user);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error reading user data:', error);
      return null;
    }
  }

  /**
   * Get stored session data
   */
  getStoredSession(): AuthSession | null {
    try {
      const sessionData = localStorage.getItem(this.storageKeys.session);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('Error reading session data:', error);
      // If localStorage is corrupted, clear it
      try {
        localStorage.removeItem(this.storageKeys.session);
      } catch (e) {
        console.error('Error clearing corrupted session:', e);
      }
      return null;
    }
  }

  /**
   * Get authorization header for API requests
   */
  getAuthHeader(): { Authorization: string } | {} {
    const session = this.getStoredSession();
    
    if (session?.accessToken) {
      return { Authorization: `Bearer ${session.accessToken}` };
    }
    
    return {};
  }

  /**
   * Make authenticated API request
   */
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const authHeaders = this.getAuthHeader();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...authHeaders,
      },
    });

    // Handle token expiration
    if (response.status === 401) {
      const refreshResult = await this.refreshSession();
      
      if (refreshResult.success) {
        // Retry with new token
        const newAuthHeaders = this.getAuthHeader();
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            ...newAuthHeaders,
          },
        });
      } else {
        // Refresh failed, redirect to login
        this.clearSession();
        window.location.href = '/login';
      }
    }

    return response;
  }

  /**
   * Store user and session data
   * Normalizes session data from Supabase to internal format
   */
  private setSession(user: User, session: any): void {
    try {
      // Normalize session from Supabase format to our format
      const accessToken = session.access_token || session.accessToken || '';
      const refreshToken = session.refresh_token || session.refreshToken || '';
      const expiresAt = session.expires_at || session.expiresAt || 0;
      
      const normalizedSession: AuthSession = {
        accessToken,
        refreshToken,
        expiresAt
      };
      
      localStorage.setItem(this.storageKeys.user, JSON.stringify(user));
      localStorage.setItem(this.storageKeys.session, JSON.stringify(normalizedSession));
    } catch (error) {
      console.error('Error storing session:', error);
    }
  }

  /**
   * Update stored user data
   */
  private setUser(user: User): void {
    try {
      localStorage.setItem(this.storageKeys.user, JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  }

  /**
   * Clear stored session and user data
   */
  private clearSession(): void {
    try {
      localStorage.removeItem(this.storageKeys.user);
      localStorage.removeItem(this.storageKeys.session);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  /**
   * Initialize auth service and check existing session
   * If token is expired, tries silent refresh
   * Returns true only if we have a valid token (either existing or refreshed)
   */
  async initialize(): Promise<boolean> {
    const session = this.getStoredSession();
    
    if (!session?.accessToken) {
      return false;
    }

    // Check if token is expired
    let expiresAtMs = session.expiresAt;
    if (session.expiresAt && session.expiresAt < 1000000000000) {
      // Likely in seconds, convert to milliseconds
      expiresAtMs = session.expiresAt * 1000;
    }
    
    const now = Date.now();
    const isExpired = expiresAtMs && expiresAtMs < now;
    
    if (isExpired) {
      if (session.refreshToken) {
        // Try to refresh the token
        const refreshResult = await this.refreshSession();
        return refreshResult.success;
      } else {
        // No refresh token, clear session
        this.clearSession();
        return false;
      }
    }

    // Token is valid
    return true;
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;