"use client";

import React, { useEffect } from "react";
import { PenjualanSummaryMetrics } from "@/types/penjualan";
import { formatRupiah, formatJakartaDate } from "@/utils/shift.utils";
import { HugeIcon } from "@/components/ui/HugeIcon";
import {
  Cancel01Icon,
  Invoice01Icon,
  CreditCardIcon,
  CashIcon,
  QrCodeIcon,
} from "@hugeicons/core-free-icons";

interface MetodePembayaranDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: PenjualanSummaryMetrics | null;
  targetDate?: string;
}

export function MetodePembayaranDetailModal({
  isOpen,
  onClose,
  summary,
  targetDate,
}: MetodePembayaranDetailModalProps) {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !summary) return null;

  const dateLabel = targetDate ? formatJakartaDate(targetDate) : "-";

  const paymentItems = [
    {
      label: "QRIS",
      count: summary.qris.count,
      totalNominal: summary.qris.totalNominal,
      percentage: summary.qris.percentage,
      icon: QrCodeIcon,
      badgeClass: "bg-purple-100 text-purple-700 border-purple-200",
      accentBg: "bg-purple-50",
      barColor: "bg-purple-600",
      textColor: "text-purple-700",
    },
    {
      label: "Transfer Bank",
      count: summary.transfer.count,
      totalNominal: summary.transfer.totalNominal,
      percentage: summary.transfer.percentage,
      icon: CreditCardIcon,
      badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
      accentBg: "bg-blue-50",
      barColor: "bg-blue-600",
      textColor: "text-blue-700",
    },
    {
      label: "Tunai (Cash)",
      count: summary.tunai.count,
      totalNominal: summary.tunai.totalNominal,
      percentage: summary.tunai.percentage,
      icon: CashIcon,
      badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
      accentBg: "bg-emerald-50",
      barColor: "bg-emerald-600",
      textColor: "text-emerald-700",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#18314E] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <HugeIcon icon={Invoice01Icon} size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold">
                Rincian Nominal Metode Pembayaran
              </h2>
              <p className="text-xs text-white/70">
                Penerimaan omset hari ini • {dateLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <HugeIcon icon={Cancel01Icon} size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Payment Method Cards */}
          <div className="space-y-3">
            {paymentItems.map((item) => (
              <div
                key={item.label}
                className={`p-4 rounded-2xl border border-slate-200/80 ${item.accentBg} transition-all hover:shadow-xs`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-white shadow-xs text-slate-700">
                      <HugeIcon icon={item.icon} size={18} />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-[#18314E]">
                        {item.label}
                      </span>
                      <p className="text-xs text-slate-500 font-medium">
                        {item.count} transaksi dicatat
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-base font-extrabold ${item.textColor}`}>
                      {formatRupiah(item.totalNominal)}
                    </span>
                    <p className="text-[11px] font-semibold text-slate-500">
                      {item.percentage.toFixed(1)}% dari total omset
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 w-full bg-white/80 h-2 rounded-full overflow-hidden border border-slate-200/50">
                  <div
                    className={`h-full ${item.barColor} transition-all duration-300 rounded-full`}
                    style={{
                      width: `${Math.min(Math.max(item.percentage, 0), 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Total Summary Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                Total Penerimaan Omset
              </span>
              <p className="text-lg font-extrabold text-[#18314E] mt-0.5">
                {formatRupiah(summary.todayTotalRevenue)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                Volume Penjualan
              </span>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {summary.todayTransactionsCount} Transaksi
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#18314E] hover:bg-[#13273E] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
