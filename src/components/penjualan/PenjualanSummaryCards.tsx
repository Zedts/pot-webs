"use client";

import React from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PenjualanSummaryMetrics } from "@/types/penjualan";
import { formatRupiah, formatJakartaDate } from "@/utils/shift.utils";

interface PenjualanSummaryCardsProps {
  summary?: PenjualanSummaryMetrics | null;
  isLoading?: boolean;
  targetDate?: string;
  onOpenPaymentDetail?: () => void;
}

export function PenjualanSummaryCards({
  summary,
  isLoading = false,
  targetDate,
  onOpenPaymentDetail,
}: PenjualanSummaryCardsProps) {
  const formattedDate = targetDate ? formatJakartaDate(targetDate) : "-";
  const transactionsCount = summary?.todayTransactionsCount ?? 0;
  const totalRevenue = summary?.todayTotalRevenue ?? 0;

  // Counter values for the 3 payment methods
  const qrisCount = summary?.qris?.count ?? 0;
  const transferCount = summary?.transfer?.count ?? 0;
  const tunaiCount = summary?.tunai?.count ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {/* Card 1: Total Transaksi Penjualan Hari Ini */}
      <MetricCard
        title="Transaksi Hari Ini"
        value={isLoading ? "..." : `${transactionsCount} Penjualan`}
        subtext={
          isLoading
            ? "Memuat data transaksi..."
            : `Total transaksi per ${formattedDate}`
        }
        valueColor="text-[#18314E]"
        isLoading={isLoading}
      />

      {/* Card 2: Total Omset Penjualan Hari Ini */}
      <MetricCard
        title="Total Omset Hari Ini"
        value={isLoading ? "..." : formatRupiah(totalRevenue)}
        subtext={
          isLoading
            ? "Menghitung omset..."
            : `Akumulasi dari ${transactionsCount} transaksi hari ini`
        }
        valueColor="text-[#10B981]"
        isLoading={isLoading}
      />

      {/* Card 3: Kembalian Disimpan (Keep Changes) */}
      <MetricCard
        title="Kembalian Disimpan Hari Ini"
        value={
          isLoading ? "..." : formatRupiah(summary?.totalKembalianDisimpan ?? 0)
        }
        subtext={
          isLoading
            ? "Memuat data kembalian..."
            : `Akumulasi dari ${summary?.kembalianDisimpanCount ?? 0} transaksi hari ini`
        }
        valueColor="text-[#E67E22]"
        isLoading={isLoading}
      />

      {/* Card 4: Metode Pembayaran (Special in function, identical in UI card) */}
      <MetricCard
        title="Metode Pembayaran"
        value={
          isLoading ? (
            "..."
          ) : (
            <div className="flex items-center justify-between gap-1 w-full max-w-[240px]">
              <div className="flex flex-col items-center flex-1">
                <span className="text-lg xl:text-xl font-extrabold text-purple-700 leading-none">
                  {qrisCount}
                </span>
                <span className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-tight">
                  QRIS
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200 shrink-0" />
              <div className="flex flex-col items-center flex-1">
                <span className="text-lg xl:text-xl font-extrabold text-blue-700 leading-none">
                  {transferCount}
                </span>
                <span className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-tight">
                  Transfer
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200 shrink-0" />
              <div className="flex flex-col items-center flex-1">
                <span className="text-lg xl:text-xl font-extrabold text-emerald-700 leading-none">
                  {tunaiCount}
                </span>
                <span className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-tight">
                  Tunai
                </span>
              </div>
            </div>
          )
        }
        subtext={
          isLoading
            ? "Memuat metode bayar..."
            : "Klik untuk melihat rincian nominal ↗"
        }
        onClick={
          !isLoading && summary && onOpenPaymentDetail
            ? onOpenPaymentDetail
            : undefined
        }
        isLoading={isLoading}
      />
    </div>
  );
}

