"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { pengirimanService } from "@/services/pengiriman.service";
import { userService } from "@/services/user.service";
import { slpService } from "@/services/slp.service";
import { LapakSimple, PengirimanModel } from "@/types/pengiriman";
import { UserModel } from "@/types/user";
import { apiClient } from "@/lib/api-client";
import { ApiEndpoints } from "@/constants/api_endpoints";
import { SearchableSelect, SelectOption } from "@/components/ui/SearchableSelect";
import { showToast } from "@/lib/toast";
import { getJakartaDateString, formatRupiah, createJakartaISOString } from "@/utils/shift.utils";
import { HugeIcon } from "@/components/ui/HugeIcon";
import {
  Cancel01Icon,
  DeliveryTruck01Icon,
  PlusSignIcon,
  Search01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons";
import { TtdPengirimCanvas } from "./TtdPengirimCanvas";

interface ProductRowItem {
  produk_id: string;
  nama: string;
  kategori: string;
  satuan: string;
  harga: number;
  qty: number;
  availableStock?: number;
}

interface PengirimanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: string | null;
  lapakList: LapakSimple[];
  onSuccess: () => Promise<void>;
}

export function PengirimanFormModal({
  isOpen,
  onClose,
  editId,
  lapakList,
  onSuccess,
}: PengirimanFormModalProps) {
  const isEdit = Boolean(editId);

  const [tanggal, setTanggal] = useState("");
  const [isTransfer, setIsTransfer] = useState(false);
  const [selectedAsalLapakId, setSelectedAsalLapakId] = useState("");
  const [selectedLapakId, setSelectedLapakId] = useState("");
  const [selectedPengirimId, setSelectedPengirimId] = useState("");
  const [userList, setUserList] = useState<UserModel[]>([]);
  const [productItems, setProductItems] = useState<ProductRowItem[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [ttdBlob, setTtdBlob] = useState<Blob | null>(null);
  const [initialTtdUrl, setInitialTtdUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"select" | "edit">("select");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitializedRef = useRef(false);
  const masterProductsRef = useRef<ProductRowItem[]>([]);
  const editDetailRef = useRef<PengirimanModel | null>(null);

  const loadCatalogForStall = async (transferActive: boolean, originStallId: string) => {
    if (!transferActive) {
      const baseRows = masterProductsRef.current;
      const currentDetail = editDetailRef.current;
      const preselected = new Set<string>();

      const rows: ProductRowItem[] = baseRows.map((r) => {
        const found = currentDetail?.items?.find((i) => i.produk_id === r.produk_id);
        if (found && found.qty > 0) {
          preselected.add(r.produk_id);
          return { ...r, qty: found.qty, availableStock: undefined };
        }
        return { ...r, qty: 0, availableStock: undefined };
      });

      setProductItems(rows);
      if (isEdit) setSelectedProductIds(preselected);
      return;
    }

    if (!originStallId) {
      setProductItems([]);
      setSelectedProductIds(new Set());
      return;
    }

    setIsLoadingStock(true);
    try {
      const stockList = await slpService.getStokByLapakId(originStallId);
      const currentDetail = editDetailRef.current;
      const preselected = new Set<string>();
      const rows: ProductRowItem[] = [];

      for (const s of stockList) {
        const foundInEdit = currentDetail?.items?.find((i) => i.produk_id === s.produk_id);
        const existingQty = foundInEdit?.qty || 0;
        const currentStokAkhir = Number(s.stok_akhir || 0);
        const maxStock = currentStokAkhir + (isEdit && currentDetail?.asal_lapak_id === originStallId ? existingQty : 0);

        if (maxStock > 0 || existingQty > 0) {
          if (existingQty > 0) {
            preselected.add(s.produk_id);
          }
          const master = masterProductsRef.current.find((mp) => mp.produk_id === s.produk_id);
          rows.push({
            produk_id: s.produk_id,
            nama: s.produk?.nama || master?.nama || "Produk",
            kategori: s.produk?.nama_kategori || master?.kategori || "-",
            satuan: s.produk?.jenis_satuan || master?.satuan || "pcs",
            harga: Number(s.produk?.harga) || master?.harga || 0,
            qty: existingQty,
            availableStock: maxStock,
          });
        }
      }

      setProductItems(rows);
      if (isEdit && currentDetail?.asal_lapak_id === originStallId) {
        setSelectedProductIds(preselected);
      } else {
        setSelectedProductIds(new Set());
      }
    } catch (err) {
      console.error("Failed to load origin stall stock:", err);
      setProductItems([]);
    } finally {
      setIsLoadingStock(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      isInitializedRef.current = false;
      return;
    }
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    async function init() {
      setIsLoading(true);
      setError(null);
      setTanggal(getJakartaDateString());

      try {
        const [products, users] = await Promise.all([
          pengirimanService.getActiveProducts(),
          userService.getAllUsers().catch(() => []),
        ]);

        setUserList(users);

        const baseRows: ProductRowItem[] = products.map((p) => ({
          produk_id: p.id,
          nama: p.nama,
          kategori: p.nama_kategori || "-",
          satuan: p.jenis_satuan || "pcs",
          harga: Number(p.harga) || 0,
          qty: 0,
        }));
        masterProductsRef.current = baseRows;

        if (isEdit && editId) {
          const detail = await pengirimanService.getPengirimanById(editId);
          editDetailRef.current = detail;
          setSelectedLapakId(detail.lapak_id || "");
          const isTransferDoc = Boolean(detail.asal_lapak_id);
          setIsTransfer(isTransferDoc);
          setSelectedAsalLapakId(detail.asal_lapak_id || "");
          setSelectedPengirimId(detail.pengirim_id || detail.pengirim?.id || "");
          setInitialTtdUrl(detail.ttd_pengirim_url || null);
          if (detail.tanggal) {
            setTanggal(getJakartaDateString(new Date(detail.tanggal)));
          }

          await loadCatalogForStall(isTransferDoc, detail.asal_lapak_id || "");
          setViewMode("edit"); // Edit starts in edit view mode
        } else {
          editDetailRef.current = null;
          setIsTransfer(false);
          setSelectedAsalLapakId("");
          setSelectedLapakId("");
          setSelectedPengirimId("");
          setInitialTtdUrl(null);
          setTtdBlob(null);
          setSelectedProductIds(new Set());
          setViewMode("select");
          await loadCatalogForStall(false, "");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Gagal memuat data formulir.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, [isOpen, editId, isEdit]);

  const lapakOptions: SelectOption[] = useMemo(() => {
    const filtered = lapakList
      .filter((l) => !isTransfer || !selectedAsalLapakId || l.id !== selectedAsalLapakId)
      .map((l) => ({
        value: l.id,
        label: l.nama,
        sublabel: l.lokasi,
      }));
    return [{ value: "", label: "Pilih Lapak" }, ...filtered];
  }, [lapakList, isTransfer, selectedAsalLapakId]);

  const asalLapakOptions: SelectOption[] = useMemo(() => {
    const filtered = lapakList
      .filter((l) => !selectedLapakId || l.id !== selectedLapakId)
      .map((l) => ({
        value: l.id,
        label: l.nama,
        sublabel: l.lokasi,
      }));
    return [{ value: "", label: "Pilih Lapak" }, ...filtered];
  }, [lapakList, selectedLapakId]);

  const pengirimOptions: SelectOption[] = useMemo(() => {
    const userOpts = userList.map((u) => ({
      value: u.id,
      label: u.nama,
      sublabel: `${u.username ? `@${u.username}` : ""} ${u.role ? `• ${u.role}` : ""}`.trim(),
      role: u.role,
    }));
    return [{ value: "", label: "Pilih Petugas Pengirim" }, ...userOpts];
  }, [userList]);

  const handleLapakChange = (destId: string) => {
    setSelectedLapakId(destId);
    if (isTransfer && destId && destId === selectedAsalLapakId) {
      setSelectedAsalLapakId("");
      loadCatalogForStall(true, "");
    }
  };

  const handleAsalLapakChange = (originId: string) => {
    setSelectedAsalLapakId(originId);
    if (originId && originId === selectedLapakId) {
      setSelectedLapakId("");
    }
    loadCatalogForStall(true, originId);
  };

  const handleToggleTransfer = () => {
    const next = !isTransfer;
    setIsTransfer(next);
    if (!next) {
      setSelectedAsalLapakId("");
      loadCatalogForStall(false, "");
    } else {
      let targetOrigin = selectedAsalLapakId;
      if (targetOrigin && targetOrigin === selectedLapakId) {
        targetOrigin = "";
        setSelectedAsalLapakId("");
      }
      loadCatalogForStall(true, targetOrigin);
    }
  };

  const handleToggleSelect = (produkId: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(produkId)) next.delete(produkId);
      else next.add(produkId);
      return next;
    });

    setProductItems((prev) =>
      prev.map((item) => {
        if (item.produk_id === produkId && item.qty === 0) {
          const defaultQty = item.availableStock !== undefined ? Math.min(1, item.availableStock) : 1;
          return { ...item, qty: defaultQty };
        }
        return item;
      })
    );
  };

  const handleRemoveFromSelected = (produkId: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      next.delete(produkId);
      return next;
    });
    setProductItems((prev) =>
      prev.map((item) => (item.produk_id === produkId ? { ...item, qty: 0 } : item))
    );
  };

  const handleQtyChange = (produkId: string, val: number) => {
    const item = productItems.find((p) => p.produk_id === produkId);
    let safeQty = Math.max(0, Math.floor(val || 0));
    if (item && item.availableStock !== undefined) {
      safeQty = Math.min(safeQty, item.availableStock);
    }
    setProductItems((prev) =>
      prev.map((it) => (it.produk_id === produkId ? { ...it, qty: safeQty } : it))
    );
  };

  // Filtered products for Select Mode
  const availableProducts = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return productItems;
    return productItems.filter(
      (p) => p.nama.toLowerCase().includes(q) || p.kategori.toLowerCase().includes(q)
    );
  }, [productItems, searchTerm]);

  // Filtered products for Edit Mode
  const selectedProducts = useMemo(() => {
    const selectedList = productItems.filter((p) => selectedProductIds.has(p.produk_id));
    const q = searchTerm.toLowerCase().trim();
    if (!q) return selectedList;
    return selectedList.filter(
      (p) => p.nama.toLowerCase().includes(q) || p.kategori.toLowerCase().includes(q)
    );
  }, [productItems, selectedProductIds, searchTerm]);

  // Summary counts
  const { totalUnits, totalValue } = useMemo(() => {
    let units = 0;
    let value = 0;
    for (const item of productItems) {
      if (selectedProductIds.has(item.produk_id) && item.qty > 0) {
        units += item.qty;
        value += item.qty * item.harga;
      }
    }
    return { totalUnits: units, totalValue: value };
  }, [productItems, selectedProductIds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (viewMode === "select") {
      showToast.error("Klik tombol 'Pilih Produk' dan alokasikan kuantitas terlebih dahulu.");
      return;
    }
    if (!selectedLapakId) {
      setError("Pilih salah satu outlet lapak tujuan.");
      return;
    }
    if (isTransfer) {
      if (!selectedAsalLapakId) {
        setError("Pilih salah satu outlet lapak asal untuk transfer stok.");
        return;
      }
      if (selectedAsalLapakId === selectedLapakId) {
        setError("Outlet lapak asal tidak boleh sama dengan outlet lapak tujuan.");
        return;
      }
    }
    if (!selectedPengirimId) {
      setError("Pilih petugas pengirim.");
      return;
    }

    const itemsToSend = productItems
      .filter((i) => selectedProductIds.has(i.produk_id) && i.qty > 0)
      .map((i) => ({
        produk_id: i.produk_id,
        qty: i.qty,
      }));

    if (itemsToSend.length === 0) {
      setError("Alokasikan minimal 1 produk dengan jumlah kirim lebih dari 0.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const tanggalISO = createJakartaISOString(tanggal);

      if (isEdit && editId) {
        await pengirimanService.updatePengiriman(editId, {
          tanggal: tanggalISO,
          lapak_id: selectedLapakId,
          asal_lapak_id: isTransfer && selectedAsalLapakId ? selectedAsalLapakId : null,
          pengirim_id: selectedPengirimId,
          items: itemsToSend,
        });
        showToast.success("Delivery Order berhasil diperbarui.");
      } else {
        await pengirimanService.createPengiriman({
          tanggal: tanggalISO,
          lapak_id: selectedLapakId,
          asal_lapak_id: isTransfer && selectedAsalLapakId ? selectedAsalLapakId : undefined,
          pengirim_id: selectedPengirimId,
          items: itemsToSend,
          ttd_pengirim: ttdBlob || undefined,
        });
        showToast.success("Delivery Order berhasil dibuat dalam status Draft.");
      }
      await onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan pengiriman.";
      setError(msg);
      showToast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#18314E] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <HugeIcon icon={DeliveryTruck01Icon} size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold">
                {isEdit ? "Edit Pengiriman (Delivery Order)" : "Buat Pengiriman Baru (Delivery Order)"}
              </h2>
              <p className="text-xs text-white/70">
                Pilih lapak tujuan dan alokasikan stok produk yang akan dikirim
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <HugeIcon icon={Cancel01Icon} size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 flex flex-col">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <span className="font-semibold">Perhatian:</span>
              <span>{error}</span>
            </div>
          )}

          {/* Transfer Antar Lapak Toggle Switch */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div>
              <label htmlFor="transfer-toggle" className="text-xs font-bold text-slate-800 block cursor-pointer">
                Transfer Antar Lapak
              </label>
              <p className="text-[11px] text-slate-500">
                Aktifkan jika pengiriman ini merupakan transfer stok dari outlet lapak lain
              </p>
            </div>
            <button
              id="transfer-toggle"
              type="button"
              role="switch"
              aria-checked={isTransfer}
              onClick={handleToggleTransfer}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 ${
                isTransfer ? "bg-[#18314E]" : "bg-slate-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isTransfer ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Lapak, Pengirim & Tanggal Bar */}
          <div className={`grid grid-cols-1 ${isTransfer ? "sm:grid-cols-4" : "sm:grid-cols-3"} gap-3`}>
            {isTransfer && (
              <div className="animate-fadeIn">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Outlet Lapak Asal <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={asalLapakOptions}
                  value={selectedAsalLapakId}
                  onChange={handleAsalLapakChange}
                  placeholder="Pilih outlet asal..."
                  searchPlaceholder="Cari outlet lapak asal..."
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Outlet Lapak Tujuan <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={lapakOptions}
                value={selectedLapakId}
                onChange={handleLapakChange}
                placeholder="Pilih outlet lapak..."
                searchPlaceholder="Cari outlet lapak..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Petugas Pengirim <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={pengirimOptions}
                value={selectedPengirimId}
                onChange={setSelectedPengirimId}
                placeholder="Pilih nama staf / SPG..."
                searchPlaceholder="Cari user berdasarkan nama, username, atau role..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Tanggal Pengiriman <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E]"
              />
            </div>
          </div>

          {/* Mode Switch & Search Toolbar */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <HugeIcon icon={Search01Icon} size={16} />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  viewMode === "select"
                    ? "Cari varian produk untuk ditambahkan..."
                    : "Cari produk terpilih..."
                }
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E]"
              />
            </div>

            <div className="flex items-center gap-2">
              {viewMode === "select" ? (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedProductIds.size === 0) {
                      showToast.error("Pilih minimal 1 produk terlebih dahulu.");
                      return;
                    }
                    setViewMode("edit");
                    setSearchTerm("");
                  }}
                  className="px-4 py-2 bg-[#18314E] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-[#122438] cursor-pointer"
                >
                  <span>Pilih Produk ({selectedProductIds.size})</span>
                  <HugeIcon icon={ArrowRight01Icon} size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("select");
                    setSearchTerm("");
                  }}
                  className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-slate-200 border border-slate-200 cursor-pointer"
                >
                  <HugeIcon icon={ArrowLeft01Icon} size={14} />
                  <span>+ Tambah Produk Lain</span>
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden flex-1 min-h-[220px] max-h-[320px] overflow-y-auto">
            {isLoading || isLoadingStock ? (
              <div className="py-16 text-center text-slate-400 text-xs">Memuat katalog produk & stok...</div>
            ) : isTransfer && !selectedAsalLapakId ? (
              <div className="py-16 px-4 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                <div className="p-3 bg-slate-100 rounded-full text-slate-400">
                  <HugeIcon icon={DeliveryTruck01Icon} size={24} />
                </div>
                <p className="max-w-md font-medium">Pilih lapak asal terlebih dahulu untuk memuat daftar produk yang tersedia di outlet tersebut.</p>
              </div>
            ) : isTransfer && selectedAsalLapakId && productItems.length === 0 ? (
              <div className="py-16 px-4 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                <div className="p-3 bg-amber-50 rounded-full text-amber-500">
                  <HugeIcon icon={DeliveryTruck01Icon} size={24} />
                </div>
                <p className="max-w-md font-medium text-amber-800">Lapak asal yang dipilih tidak memiliki stok produk yang tersedia untuk ditransfer.</p>
              </div>
            ) : viewMode === "select" ? (
              /* View Mode: Select Products */
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-[#18314E] text-white uppercase tracking-wider font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2.5">Produk</th>
                    <th className="px-4 py-2.5">Kategori</th>
                    {isTransfer && <th className="px-4 py-2.5 text-center">Stok Asal</th>}
                    <th className="px-4 py-2.5 text-right">Harga Satuan</th>
                    <th className="px-4 py-2.5 text-center">Pilih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {availableProducts.length === 0 ? (
                    <tr>
                      <td colSpan={isTransfer ? 5 : 4} className="py-8 text-center text-slate-400">
                        Tidak ada produk yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    availableProducts.map((p) => {
                      const isSelected = selectedProductIds.has(p.produk_id);
                      return (
                        <tr key={p.produk_id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-2.5 font-medium text-slate-900">{p.nama}</td>
                          <td className="px-4 py-2.5 text-slate-500">{p.kategori}</td>
                          {isTransfer && (
                            <td className="px-4 py-2.5 text-center font-mono font-medium">
                              <span className="inline-block px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {p.availableStock ?? 0} {p.satuan}
                              </span>
                            </td>
                          )}
                          <td className="px-4 py-2.5 text-right font-mono">{formatRupiah(p.harga)}</td>
                          <td className="px-4 py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleSelect(p.produk_id)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              }`}
                            >
                              {isSelected ? "Terpilih ✓" : "+ Pilih"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            ) : (
              /* View Mode: Edit Allocations */
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-[#18314E] text-white uppercase tracking-wider font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2.5">Produk Terpilih</th>
                    <th className="px-4 py-2.5 text-right">Harga</th>
                    <th className="px-4 py-2.5 text-center w-36">Kuantitas Kirim</th>
                    <th className="px-4 py-2.5 text-right">Subtotal</th>
                    <th className="px-4 py-2.5 text-center w-12">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Belum ada produk yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    selectedProducts.map((p) => {
                      const subtotal = p.qty * p.harga;
                      return (
                        <tr key={p.produk_id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-2.5 font-medium text-slate-900">
                            <div>{p.nama}</div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                              <span>{p.kategori}</span>
                              {p.availableStock !== undefined && (
                                <span className="font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                                  Maks: {p.availableStock} {p.satuan}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono">{formatRupiah(p.harga)}</td>
                          <td className="px-4 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                disabled={p.qty <= 0}
                                onClick={() => handleQtyChange(p.produk_id, p.qty - 1)}
                                className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                max={p.availableStock !== undefined ? p.availableStock : undefined}
                                value={p.qty}
                                onChange={(e) => handleQtyChange(p.produk_id, Number(e.target.value))}
                                className="w-16 p-1 text-center font-mono font-bold border border-slate-200 rounded-md"
                              />
                              <button
                                type="button"
                                disabled={p.availableStock !== undefined && p.qty >= p.availableStock}
                                onClick={() => handleQtyChange(p.produk_id, p.qty + 1)}
                                className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-semibold">
                            {formatRupiah(subtotal)}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveFromSelected(p.produk_id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                            >
                              <HugeIcon icon={Delete02Icon} size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Digital Signature: Read-Only in Edit Mode / Interactive Canvas in Create Mode */}
          <div className="pt-2">
            {isEdit ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Tanda Tangan Petugas Pengirim
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Tercatat (Hanya dapat dilihat saat edit)
                  </span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center min-h-[110px]">
                  {initialTtdUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={initialTtdUrl}
                      alt="Tanda Tangan Petugas Pengirim"
                      className="h-20 max-h-24 max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      Tidak ada tanda tangan terlampir pada dokumen pengiriman ini.
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <TtdPengirimCanvas
                onChange={setTtdBlob}
                initialImageUrl={initialTtdUrl}
                disabled={isSubmitting}
              />
            )}
          </div>

          {/* Allocation Summary Bar */}
          <div className="p-3.5 bg-[#FDF6EE] border border-[#F3E7D8] rounded-2xl flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-[#18314E] block">Ringkasan Delivery Order</span>
              <span className="text-slate-500">
                {selectedProductIds.size} produk terpilih • {totalUnits} unit akan dikirim
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-mono font-extrabold text-[#18314E]">
                {formatRupiah(totalValue)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || viewMode === "select" || selectedProductIds.size === 0}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#A81B1B] hover:bg-[#8B1717] rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting
                ? "Menyimpan..."
                : isEdit
                ? "Perbarui Dokumen DO"
                : "Simpan & Buat DO"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
