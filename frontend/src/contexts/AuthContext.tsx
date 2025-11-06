import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, type User } from '../services/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, displayName?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on app load
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    setIsLoading(true);
    
    try {
      // Check if there's a valid session
      const hasValidSession = await authService.initialize();
      
      if (hasValidSession) {
        // Session is valid, load user from localStorage
        const storedUser = authService.getUser();
        if (storedUser) {
          setUser(storedUser);
        }
      } else {
        // No valid session, user is not authenticated
        setUser(null);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await authService.login({ email, password });
      
      if (result.success && result.user) {
        // Get user from service (which includes what's in localStorage)
        const storedUser = authService.getUser();
        if (storedUser) {
          setUser(storedUser);
        } else {
          // Fallback to response user if not in storage yet
          setUser(result.user);
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const signup = async (email: string, password: string, displayName?: string): Promise<boolean> => {
    try {
      const result = await authService.signup({ email, password, displayName });
      
      if (result.success && result.user) {
        // Get user from service (which includes what's in localStorage)
        const storedUser = authService.getUser();
        if (storedUser) {
          setUser(storedUser);
        } else {
          // Fallback to response user if not in storage yet
          setUser(result.user);
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const result = await authService.getCurrentUser();
      
      if (result.success && result.user) {
        setUser(result.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Higher-order component for protecting routes/components
interface ProtectedProps {
  children: ReactNode;
  fallback?: ReactNode;
  requiredAuth?: boolean;
}

export const Protected: React.FC<ProtectedProps> = ({ 
  children, 
  fallback = null,
  requiredAuth = true 
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (requiredAuth && !isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Hook for conditional rendering based on auth state
export const useAuthState = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  return {
    user,
    isAuthenticated,
    isLoading,
    isGuest: !isAuthenticated && !isLoading,
  };
};

export default AuthContext;