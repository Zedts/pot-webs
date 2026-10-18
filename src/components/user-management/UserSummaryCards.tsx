"use client";

import React from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { UserSummaryMetrics } from "@/types/user";

interface UserSummaryCardsProps {
  summary?: UserSummaryMetrics | null;
  isLoading?: boolean;
}

export function UserSummaryCards({
  summary,
  isLoading = false,
}: UserSummaryCardsProps) {
  const totalUsers = summary?.totalUsers ?? 0;
  const activeUsers = summary?.activeUsers ?? 0;
  const inactiveUsers = summary?.inactiveUsers ?? 0;
  const unassignedRoles = summary?.unassignedRolesCount ?? 0;
  const noLapak = summary?.noLapakCount ?? 0;
  const noShift = summary?.noShiftCount ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {/* Card 1: Total Pengguna */}
      <MetricCard
        title="Total Pengguna"
        value={isLoading ? "..." : `${totalUsers} Pengguna`}
        subtext={
          isLoading
            ? "Memuat data pengguna..."
            : `${activeUsers} Akun Aktif • ${inactiveUsers} Nonaktif`
        }
        valueColor="text-[#18314E]"
        isLoading={isLoading}
      />

      {/* Card 2: Role Belum Ditentukan */}
      <MetricCard
        title="Role Belum Ditentukan"
        value={isLoading ? "..." : `${unassignedRoles} Pengguna`}
        subtext={
          isLoading
            ? "Memuat data..."
            : unassignedRoles > 0
            ? "Perlu alokasi wewenang role kerja"
            : "Semua role pengguna telah terisi"
        }
        valueColor={unassignedRoles > 0 ? "text-[#EF4444]" : "text-[#10B981]"}
        isLoading={isLoading}
      />

      {/* Card 3: Belum Ada Lapak */}
      <MetricCard
        title="Belum Ada Lapak"
        value={isLoading ? "..." : `${noLapak} Pengguna`}
        subtext={
          isLoading
            ? "Memuat data..."
            : noLapak > 0
            ? "Belum dialokasikan ke outlet lapak"
            : "Semua staf memiliki penugasan lapak"
        }
        valueColor={noLapak > 0 ? "text-[#F59E0B]" : "text-[#10B981]"}
        isLoading={isLoading}
      />

      {/* Card 4: Belum Ada Shift */}
      <MetricCard
        title="Belum Ada Shift"
        value={isLoading ? "..." : `${noShift} Pengguna`}
        subtext={
          isLoading
            ? "Memuat data..."
            : noShift > 0
            ? "Jadwal shift operasional belum diatur"
            : "Semua shift pengguna terjadwal"
        }
        valueColor={noShift > 0 ? "text-[#F59E0B]" : "text-[#10B981]"}
        isLoading={isLoading}
      />
    </div>
  );
}
