"use client";

import React, { useState, useEffect, useMemo } from "react";
import { pengirimanService } from "@/services/pengiriman.service";
import { LapakSimple, PengirimanModel } from "@/types/pengiriman";
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

interface ProductRowItem {
  produk_id: string;
  nama: string;
  kategori: string;
  satuan: string;
  harga: number;
  qty: number;
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
  const [selectedLapakId, setSelectedLapakId] = useState("");
  const [productItems, setProductItems] = useState<ProductRowItem[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"select" | "edit">("select");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function init() {
      setIsLoading(true);
      setError(null);
      setTanggal(getJakartaDateString());

      try {
        const products = await pengirimanService.getActiveProducts();
        const baseRows: ProductRowItem[] = products.map((p) => ({
          produk_id: p.id,
          nama: p.nama,
          kategori: p.nama_kategori || "-",
          satuan: p.jenis_satuan || "pcs",
          harga: Number(p.harga) || 0,
          qty: 0,
        }));

        if (isEdit && editId) {
          const detail = await pengirimanService.getPengirimanById(editId);
          setSelectedLapakId(detail.lapak_id || "");
          if (detail.tanggal) {
            setTanggal(getJakartaDateString(new Date(detail.tanggal)));
          }

          const preselected = new Set<string>();
          const updatedRows = baseRows.map((r) => {
            const found = detail.items?.find((i) => i.produk_id === r.produk_id);
            if (found && found.qty > 0) {
              preselected.add(r.produk_id);
              return { ...r, qty: found.qty };
            }
            return r;
          });

          setProductItems(updatedRows);
          setSelectedProductIds(preselected);
          setViewMode("edit"); // Edit starts in edit view mode
        } else {
          setProductItems(baseRows);
          setSelectedProductIds(new Set());
          setSelectedLapakId(lapakList[0]?.id || "");
          setViewMode("select");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Gagal memuat data formulir.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, [isOpen, editId, isEdit, lapakList]);

  const lapakOptions: SelectOption[] = lapakList.map((l) => ({
    value: l.id,
    label: l.nama,
    sublabel: l.lokasi,
  }));

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
          return { ...item, qty: 1 };
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
    const safeQty = Math.max(0, Math.floor(val || 0));
    setProductItems((prev) =>
      prev.map((item) => (item.produk_id === produkId ? { ...item, qty: safeQty } : item))
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
        });
        showToast.success("Delivery Order berhasil diperbarui.");
      } else {
        await pengirimanService.createPengiriman({
          tanggal: tanggalISO,
          lapak_id: selectedLapakId,
          items: itemsToSend,
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

          {/* Lapak & Tanggal Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Outlet Lapak Tujuan <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={lapakOptions}
                value={selectedLapakId}
                onChange={setSelectedLapakId}
                placeholder="Pilih outlet lapak..."
                searchPlaceholder="Cari outlet lapak..."
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
            {isLoading ? (
              <div className="py-16 text-center text-slate-400 text-xs">Memuat katalog produk...</div>
            ) : viewMode === "select" ? (
              /* View Mode: Select Products */
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-[#18314E] text-white uppercase tracking-wider font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2.5">Produk</th>
                    <th className="px-4 py-2.5">Kategori</th>
                    <th className="px-4 py-2.5 text-right">Harga Satuan</th>
                    <th className="px-4 py-2.5 text-center">Pilih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {availableProducts.map((p) => {
                    const isSelected = selectedProductIds.has(p.produk_id);
                    return (
                      <tr key={p.produk_id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-2.5 font-medium text-slate-900">{p.nama}</td>
                        <td className="px-4 py-2.5 text-slate-500">{p.kategori}</td>
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
                  })}
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
                            <div className="text-[10px] text-slate-400">{p.kategori}</div>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono">{formatRupiah(p.harga)}</td>
                          <td className="px-4 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleQtyChange(p.produk_id, p.qty - 1)}
                                className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 font-bold"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={p.qty}
                                onChange={(e) => handleQtyChange(p.produk_id, Number(e.target.value))}
                                className="w-16 p-1 text-center font-mono font-bold border border-slate-200 rounded-md"
                              />
                              <button
                                type="button"
                                onClick={() => handleQtyChange(p.produk_id, p.qty + 1)}
                                className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 font-bold"
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
                              className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
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
