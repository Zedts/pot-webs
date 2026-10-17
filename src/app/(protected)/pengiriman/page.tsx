"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isAdminOrOwner } from "@/types/user";
import {
  pengirimanService,
  PengirimanPageData,
} from "@/services/pengiriman.service";
import { PengirimanTabs, PengirimanTabKey } from "@/components/pengiriman/PengirimanTabs";
import { PengirimanSummaryCards } from "@/components/pengiriman/PengirimanSummaryCards";
import { PengirimanTable } from "@/components/pengiriman/PengirimanTable";
import { KonfirmasiPengirimanTable } from "@/components/pengiriman/KonfirmasiPengirimanTable";
import { showToast } from "@/lib/toast";
import { getJakartaDateString } from "@/utils/shift.utils";
import { HugeIcon } from "@/components/ui/HugeIcon";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";

export default function PengirimanPage() {
  const { user } = useAuth();
  const isPrivileged = isAdminOrOwner(user);

  const [activeTab, setActiveTab] = useState<PengirimanTabKey>("daftar");
  const [data, setData] = useState<PengirimanPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await pengirimanService.getPengirimanPageData();
      setData(result);
    } catch (err: unknown) {
      const apiErr = err as { userMessage?: string; message?: string };
      setErrorMessage(
        apiErr?.userMessage ||
          apiErr?.message ||
          "Gagal memuat data pengiriman. Silakan periksa koneksi backend."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tab 2: Confirm dispatch (status draft -> dikirim_viar)
  const handleConfirmDispatch = async (id: string) => {
    setIsConfirming(true);
    try {
      await pengirimanService.updateShipmentStatus(id, "dikirim_viar");
      showToast.success("Pengiriman berhasil dikonfirmasi dan beralih ke status Dalam Perjalanan.");

      setData((prev) => {
        if (!prev) return prev;
        const updatedRows = prev.rows.map((r) =>
          r.id === id ? { ...r, status: "dikirim_viar" as const } : r
        );
        const updatedDraftRows = prev.draftRows.filter((r) => r.id !== id);
        const updatedSummary = {
          ...prev.summary,
          draftCount: updatedDraftRows.length,
          totalDalamPerjalanan: prev.summary.totalDalamPerjalanan + 1,
        };

        return {
          ...prev,
          rows: updatedRows,
          draftRows: updatedDraftRows,
          summary: updatedSummary,
        };
      });
    } catch (err: unknown) {
      const apiErr = err as { userMessage?: string; message?: string };
      showToast.error(
        apiErr?.userMessage ||
          apiErr?.message ||
          "Gagal mengonfirmasi keberangkatan pengiriman."
      );
    } finally {
      setIsConfirming(false);
    }
  };

  // Tab 1: Delete shipment
  const handleDeletePengiriman = async (id: string) => {
    try {
      await pengirimanService.deletePengiriman(id);
      showToast.success("Dokumen Delivery Order berhasil dihapus.");

      setData((prev) => {
        if (!prev) return prev;
        const deletedRow = prev.rows.find((r) => r.id === id);
        const updatedRows = prev.rows.filter((r) => r.id !== id);
        const updatedDraftRows = prev.draftRows.filter((r) => r.id !== id);
        const wasToday =
          deletedRow?.tanggalRaw &&
          getJakartaDateString(new Date(deletedRow.tanggalRaw)) === prev.date;

        const updatedSummary = {
          ...prev.summary,
          totalPengirimanHariIni: wasToday
            ? Math.max(0, prev.summary.totalPengirimanHariIni - 1)
            : prev.summary.totalPengirimanHariIni,
          totalUnitKirim: wasToday
            ? Math.max(0, prev.summary.totalUnitKirim - (deletedRow?.qtyKirim || 0))
            : prev.summary.totalUnitKirim,
          draftCount: updatedDraftRows.length,
          totalDalamPerjalanan:
            wasToday &&
            (deletedRow?.status === "draft" || deletedRow?.status === "dikirim_viar")
              ? Math.max(0, prev.summary.totalDalamPerjalanan - 1)
              : prev.summary.totalDalamPerjalanan,
          totalStatusSelesai:
            wasToday && deletedRow?.status === "selesai"
              ? Math.max(0, prev.summary.totalStatusSelesai - 1)
              : prev.summary.totalStatusSelesai,
        };

        return {
          ...prev,
          rows: updatedRows,
          draftRows: updatedDraftRows,
          summary: updatedSummary,
        };
      });
    } catch (err: unknown) {
      const apiErr = err as { userMessage?: string; message?: string };
      showToast.error(
        apiErr?.userMessage ||
          apiErr?.message ||
          "Gagal menghapus dokumen pengiriman."
      );
      throw err;
    }
  };

  return (
    <div className="px-4 md:px-8 py-6 space-y-6">
      {/* Page Header with Tabs on the Right (Mirrors Dashboard Header & sits above Summary Cards) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#18314E] tracking-tight">
            Pengiriman
          </h1>
          <p className="text-xs md:text-sm text-[#6B7280] font-medium mt-0.5">
            Monitoring alokasi stok, Delivery Order (DO), dan pelepasan armada ke seluruh outlet
          </p>
        </div>

        {/* Tabs Bar on Top Right */}
        <div className="flex items-center">
          <PengirimanTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            draftCount={data?.summary?.draftCount || 0}
          />
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
            onClick={() => loadData()}
            className="px-3 py-1 bg-white text-[#B91C1C] rounded-lg border border-[#FCA5A5] hover:bg-rose-50 transition-colors font-bold cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* 5 Summary Cards */}
      <PengirimanSummaryCards
        summary={data?.summary}
        isLoading={isLoading}
      />

      {/* Tab Views */}
      {activeTab === "daftar" ? (
        <PengirimanTable
          rows={data?.rows || []}
          lapakList={data?.lapakList || []}
          isLoading={isLoading}
          canCreate={isPrivileged}
          canDelete={isPrivileged}
          onDelete={handleDeletePengiriman}
        />
      ) : (
        <KonfirmasiPengirimanTable
          rows={data?.draftRows || []}
          isLoading={isLoading}
          onConfirm={handleConfirmDispatch}
          isConfirming={isConfirming}
        />
      )}
    </div>
  );
}
