"use client";

import React from "react";
import { PengirimanStatus, PenerimaanStatus } from "@/types/pengiriman";

interface PengirimanStatusBadgeProps {
  status: PengirimanStatus;
  receiptStatus?: PenerimaanStatus | null;
}

export function PengirimanStatusBadge({
  status,
  receiptStatus,
}: PengirimanStatusBadgeProps) {
  let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
  let label = "Draft";

  switch (status) {
    case "draft":
      badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
      label = "Draft";
      break;
    case "dikirim_viar":
      badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
      label = "Dalam Perjalanan";
      break;
    case "diterima_spg":
      badgeStyle = "bg-blue-50 text-blue-700 border-blue-200";
      label = "Diterima SPG";
      break;
    case "selesai":
      badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
      label = "Selesai";
      break;
    default:
      badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
      label = status;
  }

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeStyle}`}
      >
        {label}
      </span>
      {receiptStatus === "sesuai" && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
          Sesuai
        </span>
      )}
      {receiptStatus === "selisih" && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-rose-50 text-rose-700 border-rose-200">
          Selisih
        </span>
      )}
    </div>
  );
}
