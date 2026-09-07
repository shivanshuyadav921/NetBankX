import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { ApiClient } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { username: string; password: string; expectedRole?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('nbx_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [role, setRole] = useState<UserRole | null>(() => {
    return (localStorage.getItem('nbx_role') as UserRole) || null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('nbx_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifySession() {
      if (token) {
        try {
          const profile = await ApiClient.getProfile();
          if (profile?.user) {
            setUser(profile.user);
            setRole(profile.user.roleId);
            localStorage.setItem('nbx_user', JSON.stringify(profile.user));
            localStorage.setItem('nbx_role', profile.user.roleId);
          }
        } catch (err) {
          console.warn('Session verification failed, clearing auth');
          localStorage.removeItem('nbx_token');
          localStorage.removeItem('nbx_user');
          localStorage.removeItem('nbx_role');
          setUser(null);
          setRole(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    }
    verifySession();
  }, [token]);

  const login = async (credentials: { username: string; password: string; expectedRole?: string }) => {
    setIsLoading(true);
    try {
      const data = await ApiClient.login(credentials);
      setUser(data.user);
      setRole(data.role);
      setToken(data.token);
      localStorage.setItem('nbx_token', data.token);
      localStorage.setItem('nbx_user', JSON.stringify(data.user));
      localStorage.setItem('nbx_role', data.role);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await ApiClient.logout();
    setUser(null);
    setRole(null);
    setToken(null);
    localStorage.removeItem('nbx_token');
    localStorage.removeItem('nbx_user');
    localStorage.removeItem('nbx_role');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
