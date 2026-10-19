"use client";

import React from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PengirimanSummary } from "@/types/pengiriman";

interface PengirimanSummaryCardsProps {
  summary?: PengirimanSummary | null;
  isLoading?: boolean;
}

export function PengirimanSummaryCards({
  summary,
  isLoading = false,
}: PengirimanSummaryCardsProps) {
  const selisihCount = summary?.totalSelisih || 0;
  const sesuaiCount = summary?.totalSesuai || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Total Pengiriman Hari Ini */}
      <MetricCard
        title="Total Pengiriman Hari Ini"
        value={isLoading ? "-" : `${summary?.totalPengirimanHariIni || 0} Pengiriman`}
        subtext={isLoading ? undefined : `${summary?.totalLapakTujuan || 0} Lapak Tujuan`}
        valueColor="text-[#18314E]"
        isLoading={isLoading}
      />

      {/* 2. Total Unit yang Dikirim */}
      <MetricCard
        title="Total Unit yang Dikirim"
        value={isLoading ? "-" : `${summary?.totalUnitKirim || 0} Unit`}
        subtext={isLoading ? undefined : `Dari ${summary?.totalVarian || 0} Varian Produk`}
        valueColor="text-[#18314E]"
        isLoading={isLoading}
      />

      {/* 3. Total Status Selesai */}
      <MetricCard
        title="Total Status Selesai"
        value={isLoading ? "-" : `${summary?.totalStatusSelesai || 0} Pengiriman`}
        subtext="Telah Diterima & Terverifikasi"
        valueColor="text-[#10B981]"
        isLoading={isLoading}
      />

      {/* 4. Total Dalam Perjalanan */}
      <MetricCard
        title="Total Dalam Perjalanan"
        value={isLoading ? "-" : `${summary?.totalDalamPerjalanan || 0} Pengiriman`}
        subtext={
          isLoading
            ? undefined
            : `${summary?.draftCount || 0} Menunggu Pelepasan`
        }
        valueColor="text-[#F59E0B]"
        isLoading={isLoading}
      />

      {/* 5. Total Sesuai & Selisih */}
      <MetricCard
        title="Total Sesuai & Selisih"
        value={
          isLoading ? (
            "-"
          ) : (
            <div className="flex items-center gap-1.5 whitespace-nowrap text-lg xl:text-xl font-extrabold tracking-tight">
              <span className="text-[#10B981]">{sesuaiCount} Sesuai</span>
              <span className="text-slate-300 font-normal">|</span>
              <span className={selisihCount > 0 ? "text-[#EF4444]" : "text-slate-400"}>
                {selisihCount} Selisih
              </span>
            </div>
          )
        }
        subtext={isLoading ? undefined : "Status Verifikasi Penerimaan"}
        isLoading={isLoading}
      />
    </div>
  );
}
