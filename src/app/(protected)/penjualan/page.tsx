"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isAdminOrOwner, getUserDisplayName } from "@/types/user";
import { PenjualanModel, PenjualanTableRow } from "@/types/penjualan";
import { LapakModel } from "@/types/slp";
import { penjualanService } from "@/services/penjualan.service";
import { apiClient } from "@/lib/api-client";
import { ApiEndpoints } from "@/constants/api_endpoints";
import { showToast } from "@/lib/toast";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { PenjualanSummaryCards } from "@/components/penjualan/PenjualanSummaryCards";
import { PenjualanTable } from "@/components/penjualan/PenjualanTable";
import { PenjualanDetailModal } from "@/components/penjualan/PenjualanDetailModal";
import { PenjualanEditModal } from "@/components/penjualan/PenjualanEditModal";
import { MetodePembayaranDetailModal } from "@/components/penjualan/MetodePembayaranDetailModal";
import { getJakartaDateString } from "@/utils/shift.utils";
import { PenjualanSummaryMetrics } from "@/types/penjualan";
import { HugeIcon } from "@/components/ui/HugeIcon";
import { AlertCircleIcon, UserIcon } from "@hugeicons/core-free-icons";

export default function PenjualanPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const isPrivileged = isAdminOrOwner(user);

  const [sales, setSales] = useState<PenjualanModel[]>([]);
  const [lapakList, setLapakList] = useState<LapakModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Client-computed summary and current date state (deferred to avoid prerender new Date() error)
  const [summaryMetrics, setSummaryMetrics] = useState<PenjualanSummaryMetrics | null>(null);
  const [currentDate, setCurrentDate] = useState<string>("");

  // Modals state
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [editingSale, setEditingSale] = useState<PenjualanModel | null>(null);
  const [isPaymentDetailOpen, setIsPaymentDetailOpen] = useState(false);

  // Initialize Jakarta date on client mount
  useEffect(() => {
    setCurrentDate(getJakartaDateString());
  }, []);

  // Load sales transactions and outlet directory
  const loadData = useCallback(async (isRefresh = false) => {
    if (!isPrivileged) return;
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const [salesData, lapakRes] = await Promise.all([
        penjualanService.getAllPenjualan(),
        apiClient
          .get<LapakModel[]>(ApiEndpoints.lapak, { requiresAuth: true })
          .catch(() => null),
      ]);

      setSales(salesData);

      const stalls = Array.isArray(lapakRes?.data) ? lapakRes!.data : [];
      setLapakList(stalls);

      const todayStr = getJakartaDateString();
      setCurrentDate(todayStr);
      setSummaryMetrics(penjualanService.computeDailyMetrics(salesData, todayStr));
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Gagal memuat data transaksi penjualan. Silakan periksa koneksi backend.";
      setErrorMessage(msg);
      showToast.error(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isPrivileged]);

  useEffect(() => {
    if (!isAuthLoading && isPrivileged) {
      void loadData(false);
    }
  }, [isAuthLoading, isPrivileged, loadData]);

  // Map to table rows
  const tableRows: PenjualanTableRow[] = useMemo(() => {
    return penjualanService.mapToTableRows(sales);
  }, [sales]);

  // Handle Delete Penjualan
  const handleDeletePenjualan = async (id: string) => {
    try {
      await penjualanService.deletePenjualan(id);
      showToast.success(
        "Transaksi penjualan berhasil dihapus dan inventaris stok telah dikembalikan."
      );
      await loadData(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Gagal menghapus transaksi penjualan.";
      showToast.error(msg);
      throw err;
    }
  };

  // Auth Loading State
  if (isAuthLoading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#18314E] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[#18314E]">
            Memuat sesi akun...
          </p>
        </div>
      </div>
    );
  }

  // Non-Admin User View: Restricted Access
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
            Halaman data penjualan dan perputaran omset hanya dapat diakses oleh Administrator dan Owner. Gunakan menu navigasi di sebelah kiri untuk mengakses fitur sesuai dengan wewenang akun Anda.
          </p>

          <div className="mt-6 pt-6 border-t border-[#F3E7D8] flex flex-wrap items-center justify-center gap-3 text-xs text-[#6B7280]">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-semibold rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
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

  return (
    <div className="px-4 md:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-extrabold text-[#18314E] tracking-tight">
              Penjualan
            </h1>
            <RefreshButton
              onClick={() => loadData(true)}
              isRefreshing={isRefreshing}
              disabled={isLoading}
            />
          </div>
          <p className="text-xs md:text-sm text-[#6B7280] font-medium mt-0.5">
            Monitoring transaksi harian, rincian pembayaran, dan rekapitulasi penjualan outlet
          </p>
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
            onClick={() => loadData(false)}
            className="px-3 py-1 bg-white text-[#B91C1C] rounded-lg border border-[#FCA5A5] hover:bg-rose-50 transition-colors font-bold cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* 2. Metric Cards (3 Cards) */}
      <PenjualanSummaryCards
        summary={summaryMetrics}
        isLoading={isLoading}
        targetDate={currentDate}
        onOpenPaymentDetail={() => setIsPaymentDetailOpen(true)}
      />

      {/* 3. Penjualan Table */}
      <PenjualanTable
        rows={tableRows}
        lapakList={lapakList}
        isLoading={isLoading}
        canManage={isPrivileged}
        currentDate={currentDate}
        onPreview={(row) => setPreviewId(row.id)}
        onEdit={(row) => setEditingSale(row.raw)}
        onDelete={handleDeletePenjualan}
      />

      {/* Payment Method Financial Details Modal */}
      <MetodePembayaranDetailModal
        isOpen={isPaymentDetailOpen}
        onClose={() => setIsPaymentDetailOpen(false)}
        summary={summaryMetrics}
        targetDate={currentDate}
      />

      {/* Preview Modal (GET by ID) */}
      <PenjualanDetailModal
        penjualanId={previewId}
        isOpen={Boolean(previewId)}
        canManage={isPrivileged}
        onClose={() => setPreviewId(null)}
        onEdit={(sale) => setEditingSale(sale)}
      />

      {/* Edit Modal (PUT metadata) */}
      <PenjualanEditModal
        sale={editingSale}
        isOpen={Boolean(editingSale)}
        onClose={() => setEditingSale(null)}
        onSuccess={async () => {
          await loadData(true);
        }}
      />
    </div>
  );
}
