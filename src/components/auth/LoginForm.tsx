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
import { HugeIcon } from "@/components/ui/HugeIcon";
import { Mail01Icon, LockPasswordIcon, AlertCircleIcon } from "@hugeicons/core-free-icons";

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
      router.push("/dashboard");
    }
  };

  const onGoogleSubmit = async () => {
    const result = await handleGoogleLogin();
    if (result) {
      const name = getUserDisplayName(result.user);
      showToast.success(`Selamat datang kembali, ${name}! Presensi aktif.`);
      router.push("/dashboard");
    }
  };

  return (
    <section className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-white">
      {/* Top Brand Taglet */}
      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#A81B1B] flex items-center justify-center text-white font-extrabold text-xs shadow-xs">
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
            <HugeIcon icon={AlertCircleIcon} size={18} strokeWidth={2} className="shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormInput
            label="Email atau Username"
            id="identifierField"
            name="identifier"
            type="text"
            required
            autoComplete="username"
            placeholder="Masukan Email atau Username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            error={identifierError}
            leadingIcon={<HugeIcon icon={Mail01Icon} size={18} strokeWidth={1.8} />}
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
            leadingIcon={<HugeIcon icon={LockPasswordIcon} size={18} strokeWidth={1.8} />}
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
        <p>Ac POT - Oleh-Oleh Turki</p>
      </div>
    </section>
  );
}
