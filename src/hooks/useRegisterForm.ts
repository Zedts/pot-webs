"use client";

import { useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import { Validators } from "@/lib/validators";
import { AuthResponse } from "@/types/auth";
import { ApiError } from "@/types/api";
import { showToast } from "@/lib/toast";

export function useRegisterForm() {
  const { register, loginWithGoogle } = useAuth();

  const [nama, setNamaState] = useState("");
  const [username, setUsernameState] = useState("");
  const [email, setEmailState] = useState("");
  const [phone, setPhoneState] = useState("");
  const [password, setPasswordState] = useState("");
  const [confirmPassword, setConfirmPasswordState] = useState("");

  const [nameError, setNameError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Field setters with reactive error clearing
  const setNama = useCallback((val: string) => {
    setNamaState(val);
    setNameError(null);
    setGeneralError(null);
  }, []);

  const setUsername = useCallback((val: string) => {
    setUsernameState(val);
    setUsernameError(null);
    setGeneralError(null);
  }, []);

  const setEmail = useCallback((val: string) => {
    setEmailState(val);
    setEmailError(null);
    setGeneralError(null);
  }, []);

  const setPhone = useCallback((val: string) => {
    setPhoneState(val);
    setPhoneError(null);
    setGeneralError(null);
  }, []);

  const setPassword = useCallback((val: string) => {
    setPasswordState(val);
    setPasswordError(null);
    setGeneralError(null);
  }, []);

  const setConfirmPassword = useCallback((val: string) => {
    setConfirmPasswordState(val);
    setConfirmPasswordError(null);
    setGeneralError(null);
  }, []);

  const validate = useCallback((): boolean => {
    const nErr = Validators.validateName(nama);
    const uErr = Validators.validateUsername(username);
    const eErr = Validators.validateEmail(email);
    const phErr = Validators.validatePhone(phone);
    const passErr = Validators.validatePassword(password);
    const cPassErr = Validators.validateConfirmPassword(confirmPassword, password);

    setNameError(nErr);
    setUsernameError(uErr);
    setEmailError(eErr);
    setPhoneError(phErr);
    setPasswordError(passErr);
    setConfirmPasswordError(cPassErr);
    setGeneralError(null);

    return !nErr && !uErr && !eErr && !phErr && !passErr && !cPassErr;
  }, [nama, username, email, phone, password, confirmPassword]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent): Promise<AuthResponse | null> => {
      if (e) e.preventDefault();

      if (!validate()) {
        return null;
      }

      setIsLoading(true);
      setGeneralError(null);

      try {
        const response = await register({
          nama,
          username,
          email,
          password,
          no_hp: phone.trim() ? phone.trim() : undefined,
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
    [nama, username, email, phone, password, confirmPassword, validate, register]
  );

  const handleGoogleRegister = useCallback(async (): Promise<AuthResponse | null> => {
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
    nama,
    setNama,
    username,
    setUsername,
    email,
    setEmail,
    phone,
    setPhone,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    nameError,
    usernameError,
    emailError,
    phoneError,
    passwordError,
    confirmPasswordError,
    generalError,
    setGeneralError,
    isLoading,
    isGoogleLoading,
    handleSubmit,
    handleGoogleRegister,
  };
}
