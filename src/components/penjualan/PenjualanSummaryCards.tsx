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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
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

      {/* Card 3: Metode Pembayaran (Special in function, identical in UI card) */}
      <MetricCard
        title="Metode Pembayaran"
        value={
          isLoading ? (
            "..."
          ) : (
            <div className="flex items-center gap-2 whitespace-nowrap text-lg xl:text-xl font-extrabold tracking-tight">
              <span className="text-purple-700">{qrisCount} QRIS</span>
              <span className="text-slate-300 font-normal">|</span>
              <span className="text-blue-700">{transferCount} Transfer</span>
              <span className="text-slate-300 font-normal">|</span>
              <span className="text-emerald-700">{tunaiCount} Tunai</span>
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

