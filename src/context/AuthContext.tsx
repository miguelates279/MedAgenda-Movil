import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';
import authApi from '../api/auth';
import {
  CreateUserDto,
  LoginDto,
  LoginResponse,
  UserProfile,
} from '../api/types';

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  roles: { isAdmin: boolean; isDoctor: boolean } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (dto: LoginDto) => Promise<LoginResponse>;
  signUp: (dto: CreateUserDto) => Promise<void>;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<{ isAdmin: boolean; isDoctor: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const setAuthToken = (newToken: string | null) => {
    setTokenState(newToken);
    apiClient.setToken(newToken);
  };

  const refreshProfile = async () => {
    if (!token && !apiClient.getToken()) return;
    try {
      const profile = await authApi.getProfile();
      setUser(profile);
    } catch (error) {
      console.warn('Failed to load user profile:', error);
    }
  };

  const signIn = async (dto: LoginDto): Promise<LoginResponse> => {
    setIsLoading(true);
    try {
      const res = await authApi.login(dto);
      setAuthToken(res.token);
      setRoles({ isAdmin: res.isAdmin, isDoctor: res.isDoctor });
      try {
        const profile = await authApi.getProfile();
        setUser(profile);
      } catch (err) {
        console.warn('Could not fetch user profile immediately after login:', err);
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (dto: CreateUserDto): Promise<void> => {
    setIsLoading(true);
    try {
      await authApi.register(dto);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    setAuthToken(null);
    setUser(null);
    setRoles(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        roles,
        isLoading,
        isAuthenticated: !!token,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
