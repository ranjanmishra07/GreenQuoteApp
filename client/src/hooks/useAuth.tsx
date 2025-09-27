import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import type { AuthUser, User } from '@/types';
import { apiService } from '@/services/api';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  authUser: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decode JWT token to get user info
        const payload = JSON.parse(atob(token.split('.')[1]));
        setAuthUser(payload);
        
        // Fetch full user profile
        apiService.getProfile()
          .then(setUser)
          .catch(() => {
            localStorage.removeItem('token');
            setAuthUser(null);
            setUser(null);
            navigate('/login');
          })
          .finally(() => setIsLoading(false));
      } catch (error) {
        localStorage.removeItem('token');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiService.login({ email, password });
    if (response.success && response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      
      // Decode token
      const payload = JSON.parse(atob(response.data.token.split('.')[1]));
      setAuthUser(payload);
      
      if (response.data.user) {
        setUser(response.data.user);
      } else {
        // Fetch full user profile
        const profile = await apiService.getProfile();
        setUser(profile);
      }
    } else {
      throw new Error(response.message || 'Login failed');
    }
  };


  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setAuthUser(null);
    queryClient.clear(); // Clear all queries from the cache
    toast.success('Logged out successfully!');
    navigate('/login');
  };

  const value: AuthContextType = {
    user,
    authUser,
    isLoading,
    login,
    logout,
    isAuthenticated: !!authUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
