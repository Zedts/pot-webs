"use client";

import React from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SlpSummaryMetrics } from "@/types/slp";

interface SlpSummaryCardsProps {
  summary?: SlpSummaryMetrics | null;
  isLoading?: boolean;
}

export function SlpSummaryCards({
  summary,
  isLoading = false,
}: SlpSummaryCardsProps) {
  const criticalCount = (summary?.lowStockCount || 0) + (summary?.outOfStockCount || 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
      {/* Card 1: Total Outlet Lapak */}
      <MetricCard
        title="Total Outlet Lapak"
        value={isLoading ? "..." : `${summary?.totalLapak ?? 0} Lapak`}
        subtext={
          isLoading
            ? "Memuat data..."
            : (summary?.totalLapak ?? 0) > 0 && (summary?.lapakWithoutSpg ?? 0) === 0
            ? `Semua Lapak Terisi SPG (${summary?.unassignedUsersCount ?? 0} Belum Ada Lapak)`
            : `${summary?.lapakWithSpg ?? 0} Terisi SPG (${summary?.lapakWithoutSpg ?? 0} Perlu Penugasan)`
        }
        isLoading={isLoading}
      />

      {/* Card 2: Kondisi Stok Kritis */}
      <MetricCard
        title="Kondisi Stok Kritis"
        value={isLoading ? "..." : `${criticalCount} Varian`}
        subtext={
          isLoading
            ? "Memuat data..."
            : criticalCount > 0
            ? `${summary?.outOfStockCount ?? 0} Habis, ${summary?.lowStockCount ?? 0} Sisa <= 5 unit`
            : "Semua varian stok aman"
        }
        valueColor={criticalCount > 0 ? "text-[#EF4444]" : "text-[#10B981]"}
        isLoading={isLoading}
      />

      {/* Card 3: Master Produk */}
      <MetricCard
        title="Master Produk"
        value={isLoading ? "..." : `${summary?.totalProduk ?? 0} Produk`}
        subtext={
          isLoading
            ? "Memuat data..."
            : `${summary?.totalKategori ?? 0} Kategori, ${summary?.totalSatuan ?? 0} Satuan`
        }
        isLoading={isLoading}
      />
    </div>
  );
}
