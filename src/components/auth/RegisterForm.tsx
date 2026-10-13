"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRegisterForm } from "@/hooks/useRegisterForm";
import { FormInput } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/Button";
import { GoogleLoginBtn } from "@/components/auth/GoogleLoginBtn";
import { showToast } from "@/lib/toast";
import { getUserDisplayName } from "@/types/user";

export function RegisterForm() {
  const router = useRouter();
  const {
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
    isLoading,
    isGoogleLoading,
    handleSubmit,
    handleGoogleRegister,
  } = useRegisterForm();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await handleSubmit(e);
    if (result) {
      const name = getUserDisplayName(result.user);
      showToast.success(`Pendaftaran berhasil! Selamat datang, ${name}.`);
      router.push("/home");
    } else if (generalError) {
      showToast.error(generalError);
    }
  };

  const onGoogleSubmit = async () => {
    const result = await handleGoogleRegister();
    if (result) {
      const name = getUserDisplayName(result.user);
      showToast.success(`Selamat datang, ${name}! Pendaftaran Google berhasil.`);
      router.push("/home");
    }
  };

  return (
    <section className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-white overflow-y-auto max-h-[85vh] lg:max-h-none">
      {/* Top Taglet */}
      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#A81B1B] flex items-center justify-center text-white font-extrabold text-xs shadow-sm">
          POT
        </div>
        <span className="text-xs font-bold text-[#1A1A1A] tracking-wider uppercase">DAFTAR AKUN BARU</span>
      </div>

      {/* Form Container */}
      <div className="my-auto py-4 max-w-sm mx-auto w-full">
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-tight">
            Registrasi Akun
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280] font-normal mt-1">
            Lengkapi informasi di bawah untuk membuat akun baru
          </p>
        </div>

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

        <form onSubmit={onSubmit} className="space-y-3.5" noValidate>
          <FormInput
            label="Nama Lengkap"
            id="nameField"
            name="nama"
            placeholder="Contoh: Budi Santoso"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            error={nameError}
            leadingIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />

          <FormInput
            label="Username"
            id="usernameField"
            name="username"
            placeholder="Contoh: budi_santoso"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={usernameError}
            leadingIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          <FormInput
            label="Email"
            id="emailField"
            name="email"
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
            leadingIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />

          <FormInput
            label="Nomor Handphone (Opsional)"
            id="phoneField"
            name="phone"
            type="tel"
            placeholder="081234567890"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={phoneError}
            leadingIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            }
          />

          <FormInput
            label="Password"
            id="passwordField"
            name="password"
            isPassword
            placeholder="Minimal 6 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
            leadingIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                <rect x="5" y="11" width="14" height="10" rx="2.5" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
              </svg>
            }
          />

          <FormInput
            label="Konfirmasi Password"
            id="confirmPasswordField"
            name="confirmPassword"
            isPassword
            placeholder="Ulangi password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={confirmPasswordError}
            leadingIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          <Button type="submit" isLoading={isLoading} className="mt-2">
            Daftar Sekarang
          </Button>

          <div className="flex items-center my-3 w-full">
            <div className="flex-grow border-t border-[#F3E7D8]"></div>
            <span className="px-3 text-[11px] text-slate-400 font-medium select-none">atau</span>
            <div className="flex-grow border-t border-[#F3E7D8]"></div>
          </div>

          <GoogleLoginBtn
            onClick={onGoogleSubmit}
            isLoading={isGoogleLoading}
            disabled={isLoading}
            label="Daftar dengan Google"
          />
        </form>

        <p className="text-center text-xs text-[#6B7280] mt-4">
          Sudah memiliki akun?{" "}
          <Link href="/login" className="font-semibold text-[#A81B1B] hover:text-[#800000] transition-colors">
            Masuk di sini
          </Link>
        </p>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <p>© POT - Oleh-Oleh Turki</p>
        <Link href="/login" className="text-slate-400 hover:text-slate-600">
          Kembali ke Login
        </Link>
      </div>
    </section>
  );
}
