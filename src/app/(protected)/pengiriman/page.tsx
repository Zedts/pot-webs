"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isAdminOrOwner } from "@/types/user";
import {
  pengirimanService,
  PengirimanPageData,
} from "@/services/pengiriman.service";
import { PengirimanTableRow } from "@/types/pengiriman";
import { PengirimanTabs, PengirimanTabKey } from "@/components/pengiriman/PengirimanTabs";
import { PengirimanSummaryCards } from "@/components/pengiriman/PengirimanSummaryCards";
import { PengirimanTable } from "@/components/pengiriman/PengirimanTable";
import { KonfirmasiPengirimanTable } from "@/components/pengiriman/KonfirmasiPengirimanTable";
import { PengirimanFormModal } from "@/components/pengiriman/PengirimanFormModal";
import { PengirimanDetailModal } from "@/components/pengiriman/PengirimanDetailModal";
import { RefreshButton } from "@/components/ui/RefreshButton";
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
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
      setIsRefreshing(false);
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
      await loadData(true);
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
      await loadData(true);
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

  const handleOpenCreate = () => {
    setEditingId(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (row: PengirimanTableRow) => {
    setEditingId(row.id);
    setIsFormModalOpen(true);
  };

  const handleOpenPreview = (row: PengirimanTableRow) => {
    setPreviewId(row.id);
  };

  return (
    <div className="px-4 md:px-8 py-6 space-y-6">
      {/* Page Header with RefreshButton & Tabs on Top Right */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-extrabold text-[#18314E] tracking-tight">
              Pengiriman
            </h1>
            <RefreshButton
              onClick={() => loadData(true)}
              isRefreshing={isRefreshing}
              disabled={isLoading}
            />
          </div>
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

      {/* KPI Metric Summary Cards */}
      <PengirimanSummaryCards
        summary={data?.summary}
        isLoading={isLoading}
      />

      {/* Tab 1: Daftar Pengiriman */}
      {activeTab === "daftar" && (
        <PengirimanTable
          rows={data?.rows || []}
          lapakList={data?.lapakList || []}
          isLoading={isLoading}
          canCreate={isPrivileged}
          canDelete={isPrivileged}
          onDelete={handleDeletePengiriman}
          onCreate={handleOpenCreate}
          onEdit={handleOpenEdit}
          onPreview={handleOpenPreview}
        />
      )}

      {/* Tab 2: Konfirmasi Pelepasan Pengiriman */}
      {activeTab === "konfirmasi" && (
        <KonfirmasiPengirimanTable
          rows={data?.draftRows || []}
          isLoading={isLoading}
          isConfirming={isConfirming}
          onConfirm={handleConfirmDispatch}
          onViewDetail={handleOpenPreview}
        />
      )}

      {/* Form Modal (Create & Edit DO) */}
      <PengirimanFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        editId={editingId}
        lapakList={data?.lapakList || []}
        onSuccess={() => loadData(true)}
      />

      {/* Detail Modal (Preview DO) */}
      <PengirimanDetailModal
        pengirimanId={previewId}
        onClose={() => setPreviewId(null)}
        onEdit={(id) => {
          setEditingId(id);
          setIsFormModalOpen(true);
        }}
      />
    </div>
  );
}
