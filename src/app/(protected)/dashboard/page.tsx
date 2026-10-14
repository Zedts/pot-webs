"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLayout } from "@/context/LayoutContext";
import { isAdminOrOwner, getUserDisplayName } from "@/types/user";
import {
  dashboardService,
  DashboardDataResult,
} from "@/services/dashboard.service";
import { SummaryCardsGrid } from "@/components/dashboard/SummaryCardsGrid";
import { StatusLapakTable } from "@/components/dashboard/StatusLapakTable";
import { SHIFT_CONFIG } from "@/utils/shift.utils";
import { HugeIcon } from "@/components/ui/HugeIcon";
import {
  AlertCircleIcon,
  Time04Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";

export default function DashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { activeShift } = useLayout();

  const [data, setData] = useState<DashboardDataResult | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPrivileged = isAdminOrOwner(user);

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (!isPrivileged) return;
      if (isRefresh) setIsRefreshing(true);
      setErrorMessage(null);

      try {
        const result = await dashboardService.getDashboardData(activeShift);
        setData(result);
      } catch (err: unknown) {
        const apiErr = err as { userMessage?: string; message?: string };
        setErrorMessage(
          apiErr?.userMessage ||
            apiErr?.message ||
            "Gagal memuat data dashboard operasional. Silakan periksa koneksi backend."
        );
      } finally {
        if (isRefresh) setIsRefreshing(false);
      }
    },
    [activeShift, isPrivileged]
  );

  useEffect(() => {
    if (!isAuthLoading && isPrivileged) {
      loadData(false);
    }
  }, [isAuthLoading, isPrivileged, loadData]);

  if (isAuthLoading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#A81B1B] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-[#18314E]">Memuat sesi akun...</p>
        </div>
      </div>
    );
  }

  // Non-Admin User View: Reusable Sidebar & Header ONLY
  if (!isPrivileged) {
    const roleTitle = user?.role ? user.role.toUpperCase() : "STAF";
    const displayName = getUserDisplayName(user);

    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl p-8 border border-[#F3E7D8] shadow-[0_2px_12px_rgba(0,0,0,0.04)] text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#FFF8F0] border border-[#F3E7D8] flex items-center justify-center mx-auto mb-4 text-[#A81B1B]">
            <HugeIcon icon={UserIcon} size={32} strokeWidth={1.8} />
          </div>

          <h1 className="text-2xl font-extrabold text-[#18314E] tracking-tight">
            Selamat Datang, {displayName}!
          </h1>
          <p className="text-sm font-semibold text-[#A81B1B] mt-1 uppercase tracking-wider">
            Portal POT - {roleTitle}
          </p>
          <p className="text-xs text-[#6B7280] max-w-md mx-auto mt-2 leading-relaxed">
            Anda telah berhasil masuk ke sistem. Gunakan navigasi menu di sebelah kiri untuk mengakses fitur dan tugas operasional harian sesuai dengan wewenang akun Anda.
          </p>

          <div className="mt-6 pt-6 border-t border-[#F3E7D8] flex flex-wrap items-center justify-center gap-3 text-xs text-[#6B7280]">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-semibold rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Sesi Aktif</span>
            </span>
            <span className="px-3 py-1 bg-[#FDF6EE] text-[#18314E] font-medium rounded-full border border-[#F3E7D8]">
              Peran: {roleTitle}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Admin & Owner View: Operational Dashboard
  const currentDateStr = data?.date || "Hari Ini";
  const currentShiftConfig = SHIFT_CONFIG[activeShift];
  const isLoading = (!data && !errorMessage) || isRefreshing;

  return (
    <div className="px-4 md:px-8 py-6 space-y-6">
      {/* Page Title & Shift Information Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#18314E] tracking-tight">
            Dashboard Operasional
          </h1>
          <p className="text-xs md:text-sm text-[#6B7280] font-medium mt-0.5">
            Data real-time presensi, pengiriman, dan ringkasan penjualan hari ini
          </p>
        </div>

        {/* Date & Shift Badge */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-white border border-[#F3E7D8] text-[#18314E] font-bold shadow-2xs">
            {currentDateStr}
          </span>
          <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#A81B1B] text-white font-bold shadow-2xs">
            <HugeIcon icon={Time04Icon} size={14} strokeWidth={2} />
            <span>{currentShiftConfig.label}</span>
          </span>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#B91C1C] flex items-center justify-between text-xs font-semibold animate-in fade-in">
          <div className="flex items-center space-x-2">
            <HugeIcon icon={AlertCircleIcon} size={18} strokeWidth={2} />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => loadData(true)}
            className="px-3 py-1 bg-white text-[#B91C1C] rounded-lg border border-[#FCA5A5] hover:bg-rose-50 transition-colors font-bold cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* 4 Summary Cards Grid */}
      <SummaryCardsGrid summary={data?.summary || null} isLoading={isLoading} />

      {/* Status Lapak Table */}
      <StatusLapakTable rows={data?.rows || []} isLoading={isLoading} />
    </div>
  );
}
