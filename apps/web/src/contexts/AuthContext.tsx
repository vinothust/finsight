import React, { createContext, useContext } from 'react';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STUB_USER: User = {
  id: 'stub-user',
  name: 'Preview User',
  email: 'preview@finsight.dev',
  role: 'admin',
};

// Sub-phase 1 stub: no real auth yet. Sub-phase 2 replaces this file's
// internals with cookie-based /auth/* calls, keeping this same useAuth() shape.
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value: AuthContextType = {
    user: STUB_USER,
    isAuthenticated: true,
    login: async () => true,
    logout: () => {},
    isLoading: false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
