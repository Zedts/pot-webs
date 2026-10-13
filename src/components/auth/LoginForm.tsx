"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLoginForm } from "@/hooks/useLoginForm";
import { FormInput } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/Button";
import { GoogleLoginBtn } from "@/components/auth/GoogleLoginBtn";
import { showToast } from "@/lib/toast";
import { getUserDisplayName } from "@/types/user";

export function LoginForm() {
  const router = useRouter();
  const {
    identifier,
    setIdentifier,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    identifierError,
    passwordError,
    generalError,
    isLoading,
    isGoogleLoading,
    handleSubmit,
    handleGoogleLogin,
  } = useLoginForm();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await handleSubmit(e);
    if (result) {
      const name = getUserDisplayName(result.user);
      showToast.success(`Selamat datang kembali, ${name}! Presensi aktif.`);
      router.push("/home");

    }
  };

  const onGoogleSubmit = async () => {
    const result = await handleGoogleLogin();
    if (result) {
      const name = getUserDisplayName(result.user);
      showToast.success(`Selamat datang kembali, ${name}! Presensi aktif.`);
      router.push("/home");
    }
  };

  return (
    <section className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-white">
      {/* Top Brand Taglet */}
      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#A81B1B] flex items-center justify-center text-white font-extrabold text-xs shadow-sm">
          POT
        </div>
        <span className="text-xs font-bold text-[#1A1A1A] tracking-wider uppercase">PORTAL MASUK</span>
      </div>

      {/* Form Container */}
      <div className="my-auto py-6 max-w-sm mx-auto w-full">
        {/* Greetings */}
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-tight">
            Selamat Datang!
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280] font-normal mt-1">
            Masuk ke akun Anda untuk melanjutkan
          </p>
        </div>

        {/* General API Error Banner */}
        {generalError && (
          <div className="mb-4 p-3 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#B91C1C] text-xs font-medium flex items-center space-x-2 animate-in fade-in">
            <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>{generalError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormInput
            label="Email"
            id="identifierField"
            name="identifier"
            type="text"
            required
            autoComplete="username"
            placeholder="Masukan Email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            error={identifierError}
            leadingIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />

          <FormInput
            label="Password"
            id="passwordField"
            name="password"
            isPassword
            required
            autoComplete="current-password"
            placeholder="Masukkan password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
            leadingIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                <rect x="5" y="11" width="14" height="10" rx="2.5" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
                <circle cx="12" cy="16" r="1.2" fill="currentColor" />
              </svg>
            }
          />

          {/* Remember Me & Link to Register */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center space-x-2 cursor-pointer text-slate-600 hover:text-slate-800 select-none">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-[#A81B1B] focus:ring-[#A81B1B] border-[#F3E7D8]"
              />
              <span>Ingat saya</span>
            </label>

            <Link
              href="/register"
              className="text-xs text-[#A81B1B] hover:text-[#800000] font-semibold transition-colors focus:outline-none cursor-pointer"
            >
              Belum Punya Akun?
            </Link>
          </div>

          <Button type="submit" isLoading={isLoading} className="mt-2">
            Login
          </Button>

          {/* Divider */}
          <div className="flex items-center my-3 w-full">
            <div className="flex-grow border-t border-[#F3E7D8]"></div>
            <span className="px-3 text-[11px] text-slate-400 font-medium select-none">atau</span>
            <div className="flex-grow border-t border-[#F3E7D8]"></div>
          </div>

          {/* Google Sign In */}
          <GoogleLoginBtn onClick={onGoogleSubmit} isLoading={isGoogleLoading} disabled={isLoading} />
        </form>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <p>© POT - Oleh-Oleh Turki</p>
      </div>
    </section>
  );
}
