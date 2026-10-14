"use client";

import React from "react";
import { HugeIcon } from "@/components/ui/HugeIcon";
import type { IconSvgElement } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Clock01Icon,
  AlertCircleIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";

export type ClosingStatus = "terverifikasi" | "pending" | "perlu_revisi" | "belum_closing";

const STATUS_CONFIG: Record<ClosingStatus, { label: string; icon: IconSvgElement; style: string }> = {
  terverifikasi: {
    label: "Selesai",
    icon: CheckmarkCircle02Icon,
    style: "bg-[#E6F9F0] text-[#0E9F6E] border-[#A7F3D0]/60",
  },
  pending: {
    label: "Proses",
    icon: Clock01Icon,
    style: "bg-[#FFF4E5] text-[#D97706] border-[#FDE68A]/60",
  },
  perlu_revisi: {
    label: "Perlu Revisi",
    icon: AlertCircleIcon,
    style: "bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]/60",
  },
  belum_closing: {
    label: "Belum Closing",
    icon: Cancel01Icon,
    style: "bg-[#F1F5F9] text-[#64748B] border-slate-200/80",
  },
};

export function ClosingStatusBadge({ status }: { status: ClosingStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.belum_closing;

  return (
    <span
      className={`inline-flex items-center justify-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-[0_1px_2px_rgba(0,0,0,0.02)] min-w-[95px] ${cfg.style}`}
    >
      <HugeIcon icon={cfg.icon} size={14} strokeWidth={2} />
      <span>{cfg.label}</span>
    </span>
  );
}
