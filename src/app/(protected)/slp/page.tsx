"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { isAdminOrOwner } from "@/types/user";
import { slpService } from "@/services/slp.service";
import {
  SlpHubData,
  SlpTabKey,
  CreateLapakPayload,
  UpdateLapakPayload,
  CreateStokLapakPayload,
  UpdateStokLapakPayload,
  CreateProdukPayload,
  UpdateProdukPayload,
  CreateKategoriPayload,
  UpdateKategoriPayload,
  CreateSatuanPayload,
  UpdateSatuanPayload,
} from "@/types/slp";
import { SlpTabs } from "@/components/slp/SlpTabs";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { SlpSummaryCards } from "@/components/slp/SlpSummaryCards";
import { LapakTabContent } from "@/components/slp/LapakTabContent";
import { StokLapakTabContent } from "@/components/slp/StokLapakTabContent";
import { ProdukTabContent } from "@/components/slp/ProdukTabContent";
import { showToast } from "@/lib/toast";
import { HugeIcon } from "@/components/ui/HugeIcon";
import { AlertCircleIcon, ArrowReloadHorizontalIcon } from "@hugeicons/core-free-icons";

function SlpLoadingSkeleton() {
  return (
    <div className="px-4 md:px-8 py-6 space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-slate-200 rounded-lg" />
          <div className="h-4 w-96 bg-slate-100 rounded-lg" />
        </div>
        <div className="h-10 w-72 bg-slate-200 rounded-xl" />
      </div>

      {/* Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-28 bg-slate-100 rounded-2xl border border-slate-200/60" />
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="h-96 bg-slate-100 rounded-2xl border border-slate-200/60" />
    </div>
  );
}

function SlpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isPrivileged = isAdminOrOwner(user);

  // Read initial tab from URL query param if present
  const urlTab = searchParams.get("tab") as SlpTabKey | null;
  const [activeTab, setActiveTab] = useState<SlpTabKey>(
    urlTab === "stok" || urlTab === "produk" ? urlTab : "lapak"
  );

  const [data, setData] = useState<SlpHubData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync tab with URL
  const handleTabChange = (tab: SlpTabKey) => {
    setActiveTab(tab);
    router.replace(`/slp?tab=${tab}`, { scroll: false });
  };

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const result = await slpService.getSlpHubData();
      setData(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memuat data master Stok, Lapak, dan Produk.";
      setErrorMessage(msg);
      showToast.error(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tab 1: Lapak Handlers
  const handleCreateLapak = async (payload: CreateLapakPayload) => {
    await slpService.createLapak(payload);
    showToast.success("Outlet lapak baru berhasil ditambahkan.");
    await loadData(true);
  };

  const handleUpdateLapak = async (
    id: string,
    payload: UpdateLapakPayload,
    prevSpgIds?: string[]
  ) => {
    await slpService.updateLapak(id, payload, prevSpgIds);
    showToast.success("Data outlet lapak berhasil diperbarui.");
    await loadData(true);
  };

  const handleDeleteLapak = async (id: string) => {
    await slpService.deleteLapak(id);
    showToast.success("Outlet lapak berhasil dihapus.");
    await loadData(true);
  };

  // Tab 2: Stok Lapak Handlers
  const handleCreateStok = async (payload: CreateStokLapakPayload) => {
    await slpService.createStokLapak(payload);
    showToast.success("Inisialisasi stok produk lapak berhasil disimpan.");
    await loadData(true);
  };

  const handleUpdateStok = async (id: string, payload: UpdateStokLapakPayload) => {
    await slpService.updateStokLapak(id, payload);
    showToast.success("Penyesuaian stok produk lapak berhasil diperbarui.");
    await loadData(true);
  };

  const handleDeleteStok = async (id: string) => {
    await slpService.deleteStokLapak(id);
    showToast.success("Pencatatan stok produk lapak berhasil dihapus.");
    await loadData(true);
  };

  // Tab 3: Produk Handlers
  const handleCreateProduk = async (payload: CreateProdukPayload) => {
    await slpService.createProduk(payload);
    showToast.success("Produk baru berhasil ditambahkan.");
    await loadData(true);
  };

  const handleUpdateProduk = async (id: string, payload: UpdateProdukPayload) => {
    await slpService.updateProduk(id, payload);
    showToast.success("Data produk berhasil diperbarui.");
    await loadData(true);
  };

  const handleToggleProdukStatus = async (id: string, currentStatus: string) => {
    const current = (currentStatus || "").toLowerCase().trim();
const nextStatus = current === "active" || current === "aktif" ? "inactive" : "active";
    await slpService.updateProdukStatus(id, nextStatus);
    showToast.success(`Status produk berhasil diubah menjadi ${nextStatus === "active" ? "Aktif" : "Nonaktif"}.`);
    await loadData(true);
  };

  const handleDeleteProduk = async (id: string) => {
    await slpService.deleteProduk(id);
    showToast.success("Produk berhasil dihapus.");
    await loadData(true);
  };

  // Kategori Handlers
  const handleCreateKategori = async (payload: CreateKategoriPayload) => {
    await slpService.createKategori(payload);
    showToast.success("Kategori produk berhasil ditambahkan.");
    await loadData(true);
  };

  const handleUpdateKategori = async (id: string, payload: UpdateKategoriPayload) => {
    await slpService.updateKategori(id, payload);
    showToast.success("Kategori produk berhasil diperbarui.");
    await loadData(true);
  };

  const handleDeleteKategori = async (id: string) => {
    await slpService.deleteKategori(id);
    showToast.success("Kategori produk berhasil dihapus.");
    await loadData(true);
  };

  // Satuan Handlers
  const handleCreateSatuan = async (payload: CreateSatuanPayload) => {
    await slpService.createSatuan(payload);
    showToast.success("Satuan produk berhasil ditambahkan.");
    await loadData(true);
  };

  const handleUpdateSatuan = async (id: string, payload: UpdateSatuanPayload) => {
    await slpService.updateSatuan(id, payload);
    showToast.success("Satuan produk berhasil diperbarui.");
    await loadData(true);
  };

  const handleDeleteSatuan = async (id: string) => {
    await slpService.deleteSatuan(id);
    showToast.success("Satuan produk berhasil dihapus.");
    await loadData(true);
  };

  return (
    <div className="px-4 md:px-8 py-6 space-y-6">
      {/* Page Header with Tabs on Top Right */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-extrabold text-[#18314E] tracking-tight">
              Stok, Lapak & Produk
            </h1>
            <RefreshButton onClick={() => loadData(true)} isRefreshing={isRefreshing} disabled={isLoading} />
          </div>
          <p className="text-xs md:text-sm text-[#6B7280] font-medium mt-0.5">
            Pusat manajemen operasional outlet lapak, inventaris stok produk, dan master katalog
          </p>
        </div>

        {/* Tab Navigator */}
        <div className="flex items-center">
          <SlpTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            lapakCount={data?.lapakList?.length || 0}
            stokCount={data?.stokList?.length || 0}
            produkCount={data?.produkList?.length || 0}
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

      {/* Summary KPI Metrics */}
      <SlpSummaryCards
        summary={data?.summary || null}
        isLoading={isLoading}
      />

      {/* Tab Content Display */}
      {activeTab === "lapak" && (
        <LapakTabContent
          rows={data?.lapakList || []}
          spgUsers={data?.spgUsers || []}
          todayAbsensi={data?.absensiList || []}
          isLoading={isLoading}
          canManage={isPrivileged}
          onCreate={handleCreateLapak}
          onUpdate={handleUpdateLapak}
          onDelete={handleDeleteLapak}
        />
      )}

      {activeTab === "stok" && (
        <StokLapakTabContent
          rows={data?.stokList || []}
          lapakList={data?.lapakList || []}
          produkList={data?.produkList || []}
          isLoading={isLoading}
          canManage={isPrivileged}
          onCreate={handleCreateStok}
          onUpdate={handleUpdateStok}
          onDelete={handleDeleteStok}
        />
      )}

      {activeTab === "produk" && (
        <ProdukTabContent
          rows={data?.produkList || []}
          kategoriList={data?.kategoriList || []}
          satuanList={data?.satuanList || []}
          isLoading={isLoading}
          canManage={isPrivileged}
          onCreateProduk={handleCreateProduk}
          onUpdateProduk={handleUpdateProduk}
          onToggleStatus={handleToggleProdukStatus}
          onDeleteProduk={handleDeleteProduk}
          onCreateKategori={handleCreateKategori}
          onUpdateKategori={handleUpdateKategori}
          onDeleteKategori={handleDeleteKategori}
          onCreateSatuan={handleCreateSatuan}
          onUpdateSatuan={handleUpdateSatuan}
          onDeleteSatuan={handleDeleteSatuan}
        />
      )}
    </div>
  );
}

export default function SlpPage() {
  return (
    <Suspense fallback={<SlpLoadingSkeleton />}>
      <SlpContent />
    </Suspense>
  );
}
