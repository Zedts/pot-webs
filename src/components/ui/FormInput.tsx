"use client";

import React, { useState } from "react";
import { HugeIcon } from "@/components/ui/HugeIcon";
import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string | null;
  leadingIcon?: React.ReactNode;
  isPassword?: boolean;
}

export function FormInput({
  label,
  id,
  error,
  leadingIcon,
  isPassword = false,
  type = "text",
  className = "",
  ...props
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const resolvedType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
        {label}
      </label>
      <div
        className={`form-input-field flex items-center px-4 py-3 rounded-xl relative ${
          error ? "border-[#A81B1B] ring-1 ring-[#A81B1B]/30" : "border-[#F3E7D8]"
        }`}
      >
        {leadingIcon && <span className="text-slate-400 mr-3 shrink-0">{leadingIcon}</span>}
        <input
          id={id}
          type={resolvedType}
          className={`w-full bg-transparent text-sm text-[#1A1A1A] placeholder-slate-400 focus:outline-none font-medium ${
            isPassword ? "pr-8" : ""
          } ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 text-slate-400 hover:text-slate-600 active:scale-95 transition-transform p-1 cursor-pointer focus:outline-none"
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showPassword ? (
              <HugeIcon icon={ViewIcon} size={18} strokeWidth={1.8} />
            ) : (
              <HugeIcon icon={ViewOffSlashIcon} size={18} strokeWidth={1.8} />
            )}
          </button>
        )}
      </div>
      {error && <p className="text-[11px] text-[#A81B1B] font-medium mt-1 px-1">{error}</p>}
    </div>
  );
}
