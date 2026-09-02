import React, { createContext, useContext, useState, ReactNode } from 'react';
import { setAuthToken } from '../../shared';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'investigator' | 'analyst' | 'viewer';
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // In-memory token storage (Spec Section 4.3 decision)
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    setAuthToken(newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
