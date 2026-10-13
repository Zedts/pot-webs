"use client";

import { useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import { Validators } from "@/lib/validators";
import { AuthResponse } from "@/types/auth";
import { ApiError } from "@/types/api";
import { showToast } from "@/lib/toast";

export function useLoginForm() {
  const { login, loginWithGoogle } = useAuth();

  const [identifier, setIdentifierState] = useState("");
  const [password, setPasswordState] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const setIdentifier = useCallback((value: string) => {
    setIdentifierState(value);
    setIdentifierError(null);
    setGeneralError(null);
  }, []);

  const setPassword = useCallback((value: string) => {
    setPasswordState(value);
    setPasswordError(null);
    setGeneralError(null);
  }, []);

  const validate = useCallback((): boolean => {
    const idErr = Validators.validateIdentifier(identifier);
    const passErr = Validators.validatePassword(password);

    setIdentifierError(idErr);
    setPasswordError(passErr);
    setGeneralError(null);

    return !idErr && !passErr;
  }, [identifier, password]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent): Promise<AuthResponse | null> => {
      if (e) e.preventDefault();

      if (!validate()) {
        return null;
      }

      setIsLoading(true);
      setGeneralError(null);

      try {
        const response = await login({
          identifier,
          password,
          rememberMe,
        });
        return response;
      } catch (err) {
        let msg = "Terjadi kesalahan sistem. Silakan coba lagi.";
        if (err instanceof ApiError) {
          msg = err.userMessage;
        }
        setGeneralError(msg);
        showToast.error(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [identifier, password, rememberMe, validate, login]
  );

  const handleGoogleLogin = useCallback(async (): Promise<AuthResponse | null> => {
    setIsGoogleLoading(true);
    setGeneralError(null);

    try {
      const response = await loginWithGoogle();
      return response;
    } catch (err) {
      let msg = "Gagal menghubungkan autentikasi Akun Google.";
      if (err instanceof ApiError) {
        msg = err.userMessage;
      }
      setGeneralError(msg);
      showToast.error(msg);
      return null;
    } finally {
      setIsGoogleLoading(false);
    }
  }, [loginWithGoogle]);

  return {
    identifier,
    setIdentifier,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    identifierError,
    passwordError,
    generalError,
    setGeneralError,
    isLoading,
    isGoogleLoading,
    handleSubmit,
    handleGoogleLogin,
  };
}
