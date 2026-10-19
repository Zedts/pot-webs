"use client";

import React from "react";
import { MetodePembayaranType } from "@/types/penjualan";

interface PenjualanPaymentBadgeProps {
  method?: MetodePembayaranType | string;
  className?: string;
}

export function PenjualanPaymentBadge({
  method = "tunai",
  className = "",
}: PenjualanPaymentBadgeProps) {
  const normalized = (method || "tunai").toLowerCase().trim();

  switch (normalized) {
    case "qris":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 select-none ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          QRIS
        </span>
      );

    case "transfer":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 select-none ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Transfer
        </span>
      );

    case "tunai":
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 select-none ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Tunai
        </span>
      );
  }
}
