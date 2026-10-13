"use client";

import React, { useState } from "react";

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
            className="absolute right-3.5 text-slate-400 hover:text-slate-600 active:scale-95 transition-transform p-1"
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showPassword ? (
              <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.8">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.8">
                <path
                  d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && <p className="text-[11px] text-[#A81B1B] font-medium mt-1 px-1">{error}</p>}
    </div>
  );
}
