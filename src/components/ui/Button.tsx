import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: "primary" | "secondary" | "outline";
}

export function Button({
  children,
  isLoading = false,
  variant = "primary",
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center space-x-2 select-none active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none";

  const variantStyles = {
    primary: "bg-[#A81B1B] hover:bg-[#800000] text-white shadow-btn",
    secondary: "bg-[#FDF6EE] hover:bg-[#F3E7D8] text-[#1A1A1A] border border-[#F3E7D8]",
    outline: "bg-white hover:bg-slate-50 text-[#1A1A1A] border border-[#F3E7D8]",
  }[variant];

  return (
    <button className={`${baseStyles} ${variantStyles} ${className}`} disabled={disabled || isLoading} {...props}>
      <span>{children}</span>
      {isLoading && (
        <svg className="w-4 h-4 text-current animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
    </button>
  );
}
