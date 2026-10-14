"use client";

import React, { createContext, useEffect, useState, useCallback } from "react";
import { UserModel } from "@/types/user";
import { AuthResponse, LoginPayload, RegisterPayload } from "@/types/auth";
import { authService } from "@/services/auth.service";
import { GoogleAuthService } from "@/services/google-auth.service";
import { AuthStorage } from "@/lib/auth-storage";

export interface AuthContextType {
  user: UserModel | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  loginWithGoogle: () => Promise<AuthResponse | null>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserModel | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Always initialize synchronously to identical SSR defaults to prevent hydration mismatch
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserModel | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session from client storage and verify profile after mount (zero SSR divergence)
  useEffect(() => {
    const savedToken = AuthStorage.getToken();
    const savedUser = AuthStorage.getUser();

    if (savedToken) {
      setToken(savedToken);
      if (savedUser) {
        setUser(savedUser);
      }

      // Background re-verification
      authService
        .getProfile()
        .then((freshUser) => {
          setUser(freshUser);
          AuthStorage.saveUser(freshUser);
        })
        .catch((err: unknown) => {
          const apiErr = err as { statusCode?: number };
          if (apiErr?.statusCode === 401 || !savedUser) {
            AuthStorage.clear();
            setToken(null);
            setUser(null);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await authService.login(payload);
    setToken(response.token);
    setUser(response.user);
    setIsLoading(false);
    return response;
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<AuthResponse> => {
    const response = await authService.register(payload);
    setToken(response.token);
    setUser(response.user);
    setIsLoading(false);
    return response;
  }, []);

  const loginWithGoogle = useCallback(async (): Promise<AuthResponse | null> => {
    const idToken = await GoogleAuthService.signIn();
    if (!idToken) return null;

    const response = await authService.loginWithGoogle(idToken);
    setToken(response.token);
    setUser(response.user);
    setIsLoading(false);
    return response;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await authService.logout();
    setToken(null);
    setUser(null);
    setIsLoading(false);
  }, []);

  const refreshProfile = useCallback(async (): Promise<UserModel | null> => {
    try {
      const freshUser = await authService.getProfile();
      setUser(freshUser);
      return freshUser;
    } catch {
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
