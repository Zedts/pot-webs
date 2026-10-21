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

      {/* 2. Total Unit yang Dikirim Hari Ini */}
      <MetricCard
        title="Total Unit yang Dikirim Hari Ini"
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
            <div className="flex items-center justify-around gap-2 w-full max-w-[200px]">
              <div className="flex flex-col items-center flex-1">
                <span className="text-lg xl:text-xl font-extrabold text-[#10B981] leading-none">
                  {sesuaiCount}
                </span>
                <span className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-tight">
                  Sesuai
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200 shrink-0" />
              <div className="flex flex-col items-center flex-1">
                <span
                  className={`text-lg xl:text-xl font-extrabold leading-none ${
                    selisihCount > 0 ? "text-[#EF4444]" : "text-slate-400"
                  }`}
                >
                  {selisihCount}
                </span>
                <span className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-tight">
                  Selisih
                </span>
              </div>
            </div>
          )
        }
        subtext={isLoading ? undefined : "Status Verifikasi Penerimaan"}
        isLoading={isLoading}
      />
    </div>
  );
}
