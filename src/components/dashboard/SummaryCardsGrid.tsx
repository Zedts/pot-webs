"use client";

import { MetricCard } from "./MetricCard";
import { DashboardSummary } from "@/services/dashboard.service";
import { formatRupiah } from "@/utils/shift.utils";

interface SummaryCardsGridProps {
  summary: DashboardSummary | null;
  isLoading: boolean;
}

export function SummaryCardsGrid({ summary, isLoading }: SummaryCardsGridProps) {
  const totalPenjualanStr = formatRupiah(summary?.totalPenjualan ?? 0);
  const totalPengirimanStr = `${summary?.totalPengiriman ?? 0} Pengiriman`;
  const spgRatioStr = `${summary?.spgAktifCount ?? 0}/${summary?.totalStallsCount ?? 0}`;
  const selisihCount = summary?.selisihStokCount ?? 0;
  const selisihStr = `${selisihCount} Lapak`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
      {/* Card 1: Total Penjualan */}
      <MetricCard
        title="Total Penjualan"
        value={totalPenjualanStr}
        subtext="Shift Aktif Hari Ini"
        valueColor="text-[#18314E]"
        isLoading={isLoading}
      />

      {/* Card 2: Total Pengiriman */}
      <MetricCard
        title="Total Pengiriman"
        value={totalPengirimanStr}
        subtext="Pasokan Hari Ini"
        valueColor="text-[#18314E]"
        isLoading={isLoading}
      />

      {/* Card 3: SPG Aktif */}
      <MetricCard
        title="SPG Aktif"
        value={spgRatioStr}
        subtext="Presensi Hadir / Terlambat"
        valueColor="text-[#10B981]"
        isLoading={isLoading}
      />

      {/* Card 4: Selisih Stok */}
      <MetricCard
        title="Selisih Stok"
        value={selisihStr}
        subtext={selisihCount > 0 ? "Perlu Rekonsiliasi" : "Semua Stok Sesuai"}
        valueColor={selisihCount > 0 ? "text-[#EF4444]" : "text-[#10B981]"}
        isLoading={isLoading}
      />
    </div>
  );
}
