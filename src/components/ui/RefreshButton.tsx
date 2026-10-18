"use client";

import React from "react";
import { HugeIcon } from "@/components/ui/HugeIcon";
import { ArrowReloadHorizontalIcon } from "@hugeicons/core-free-icons";

interface RefreshButtonProps {
  onClick: () => void | Promise<void>;
  isRefreshing?: boolean;
  disabled?: boolean;
  title?: string;
  className?: string;
}

export function RefreshButton({
  onClick,
  isRefreshing = false,
  disabled = false,
  title = "Segarkan data",
  className = "",
}: RefreshButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isRefreshing}
      title={title}
      className={`p-1.5 text-slate-400 hover:text-[#18314E] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${className}`}
      aria-label={title}
    >
      <HugeIcon
        icon={ArrowReloadHorizontalIcon}
        size={16}
        className={isRefreshing ? "animate-spin text-[#18314E]" : ""}
      />
    </button>
  );
}
