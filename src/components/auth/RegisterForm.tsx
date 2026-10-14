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
import { HugeIcon } from "@/components/ui/HugeIcon";
import {
  UserIcon,
  UserCircleIcon,
  Mail01Icon,
  SmartPhone01Icon,
  LockPasswordIcon,
  CheckmarkBadge01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";

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
      router.push("/dashboard");
    } else if (generalError) {
      showToast.error(generalError);
    }
  };

  const onGoogleSubmit = async () => {
    const result = await handleGoogleRegister();
    if (result) {
      const name = getUserDisplayName(result.user);
      showToast.success(`Selamat datang, ${name}! Pendaftaran Google berhasil.`);
      router.push("/dashboard");
    }
  };

  return (
    <section className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-white overflow-y-auto max-h-[85vh] lg:max-h-none">
      {/* Top Taglet */}
      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#A81B1B] flex items-center justify-center text-white font-extrabold text-xs shadow-xs">
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
            <HugeIcon icon={AlertCircleIcon} size={18} strokeWidth={2} className="shrink-0" />
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
            leadingIcon={<HugeIcon icon={UserIcon} size={18} strokeWidth={1.8} />}
          />

          <FormInput
            label="Username"
            id="usernameField"
            name="username"
            placeholder="Contoh: budi_santoso"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={usernameError}
            leadingIcon={<HugeIcon icon={UserCircleIcon} size={18} strokeWidth={1.8} />}
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
            leadingIcon={<HugeIcon icon={Mail01Icon} size={18} strokeWidth={1.8} />}
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
            leadingIcon={<HugeIcon icon={SmartPhone01Icon} size={18} strokeWidth={1.8} />}
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
            leadingIcon={<HugeIcon icon={LockPasswordIcon} size={18} strokeWidth={1.8} />}
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
            leadingIcon={<HugeIcon icon={CheckmarkBadge01Icon} size={18} strokeWidth={1.8} />}
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
