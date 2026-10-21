"use client";

import React, { useState, useEffect } from "react";
import {
  StokLapakModel,
  LapakModel,
  ProdukModel,
  CreateStokLapakPayload,
  UpdateStokLapakPayload,
} from "@/types/slp";
import { SearchableSelect, SelectOption } from "@/components/ui/SearchableSelect";
import { HugeIcon } from "@/components/ui/HugeIcon";
import { Cancel01Icon, PackageIcon } from "@hugeicons/core-free-icons";

interface StokLapakFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: StokLapakModel | null;
  mode?: "create" | "edit";
  lapakList: LapakModel[];
  produkList: ProdukModel[];
  onSubmit?: (payload: CreateStokLapakPayload | UpdateStokLapakPayload) => Promise<void>;
  onSubmitCreate?: (payload: CreateStokLapakPayload) => Promise<void>;
  onSubmitUpdate?: (id: string, payload: UpdateStokLapakPayload) => Promise<void>;
}

export function StokLapakFormModal({
  isOpen,
  onClose,
  initialData,
  mode,
  lapakList,
  produkList,
  onSubmit,
  onSubmitCreate,
  onSubmitUpdate,
}: StokLapakFormModalProps) {
  const isEdit = mode === "edit" || Boolean(initialData);

  const [lapakId, setLapakId] = useState("");
  const [produkId, setProdukId] = useState("");
  const [stokAwal, setStokAwal] = useState<number>(0);
  const [stokMasuk, setStokMasuk] = useState<number>(0);
  const [stokTerjual, setStokTerjual] = useState<number>(0);
  const [stokTransfer, setStokTransfer] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setLapakId(initialData.lapak_id || "");
      setProdukId(initialData.produk_id || "");
      setStokAwal(initialData.stok_awal ?? 0);
      setStokMasuk(initialData.stok_masuk ?? 0);
      setStokTerjual(initialData.stok_terjual ?? 0);
      setStokTransfer(initialData.stok_transfer ?? 0);
    } else {
      setLapakId(lapakList[0]?.id || "");
      setProdukId(produkList[0]?.id || "");
      setStokAwal(0);
      setStokMasuk(0);
      setStokTerjual(0);
      setStokTransfer(0);
    }
    setError(null);
  }, [initialData, isOpen, lapakList, produkList]);

  if (!isOpen) return null;

  const stokAkhirCalculated = Number(stokAwal) + Number(stokMasuk) - Number(stokTerjual) - Number(stokTransfer);

  // Options for Lapak & Produk
  const lapakOptions: SelectOption[] = lapakList.map((l) => ({
    value: l.id,
    label: l.nama,
    sublabel: l.lokasi,
  }));

  const produkOptions: SelectOption[] = produkList.map((p) => ({
    value: p.id,
    label: p.nama,
    sublabel: p.nama_kategori ? `${p.nama_kategori} • ${p.jenis_satuan || 'Pcs'}` : undefined,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!lapakId) {
      setError("Pilih salah satu outlet lapak tujuan.");
      return;
    }
    if (!produkId) {
      setError("Pilih salah satu varian produk.");
      return;
    }
    if (stokAwal < 0 || stokMasuk < 0 || stokTerjual < 0 || stokTransfer < 0) {
      setError("Kuantitas stok tidak boleh berupa angka negatif.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = isEdit
        ? {
            stok_awal: Number(stokAwal),
            stok_masuk: Number(stokMasuk),
            stok_terjual: Number(stokTerjual),
          }
        : {
            lapak_id: lapakId,
            produk_id: produkId,
            stok_awal: Number(stokAwal),
            stok_masuk: 0,
            stok_terjual: 0,
            stok_transfer: 0,
          };

      if (onSubmit) {
        await onSubmit(payload as CreateStokLapakPayload | UpdateStokLapakPayload);
      } else if (isEdit && initialData && onSubmitUpdate) {
        await onSubmitUpdate(initialData.id, payload as UpdateStokLapakPayload);
      } else if (onSubmitCreate) {
        await onSubmitCreate(payload as CreateStokLapakPayload);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan data stok lapak.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#18314E] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <HugeIcon icon={PackageIcon} size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold">
                {isEdit ? "Sesuaikan Stok Lapak" : "Inisialisasi Stok Produk"}
              </h2>
              <p className="text-xs text-white/70">
                {isEdit
                  ? "Koreksi saldo stok awal, penerimaan, atau penjualan"
                  : "Tetapkan kuantitas stok baseline awal untuk produk di lapak"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <HugeIcon icon={Cancel01Icon} size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <span className="font-semibold">Perhatian:</span>
              <span>{error}</span>
            </div>
          )}

          {/* Pilih Lapak */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Outlet Lapak <span className="text-red-500">*</span>
            </label>
            {isEdit ? (
              <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700">
                {initialData?.lapak?.nama || initialData?.lapak_id}
              </div>
            ) : (
              <SearchableSelect
                options={lapakOptions}
                value={lapakId}
                onChange={setLapakId}
                placeholder="Pilih Outlet Lapak..."
                searchPlaceholder="Cari nama lapak atau alamat..."
                required
              />
            )}
          </div>

          {/* Pilih Produk */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Varian Produk <span className="text-red-500">*</span>
            </label>
            {isEdit ? (
              <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700">
                {initialData?.produk?.nama || initialData?.produk_id}
              </div>
            ) : (
              <SearchableSelect
                options={produkOptions}
                value={produkId}
                onChange={setProdukId}
                placeholder="Pilih Varian Produk..."
                searchPlaceholder="Cari produk atau kategori..."
                required
              />
            )}
          </div>

          {/* Stock Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                Stok Awal
              </label>
              <input
                type="number"
                min="0"
                required
                value={stokAwal}
                onChange={(e) => setStokAwal(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E]"
              />
            </div>

            {isEdit && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                    Masuk (+)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stokMasuk}
                    onChange={(e) => setStokMasuk(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                    Terjual (-)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stokTerjual}
                    onChange={(e) => setStokTerjual(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider flex items-center justify-between">
                    <span>Transfer (-)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Otomatis DO</span>
                  </label>
                  <input
                    type="number"
                    readOnly
                    disabled
                    value={stokTransfer}
                    title="Kuantitas transfer stok dikelola otomatis oleh sistem pengiriman antar lapak (DO) dan tidak dapat diubah manual."
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 bg-slate-100 text-slate-500 rounded-xl font-mono cursor-not-allowed select-none"
                  />
                </div>
              </>
            )}
          </div>

          {/* Live Balance Preview */}
          <div className="p-3.5 bg-[#FDF6EE] border border-[#F3E7D8] rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#18314E] block">
                Estimasi Saldo Stok Akhir
              </span>
              <span className="text-[11px] text-slate-500">
                Formula: Awal ({stokAwal}) + Masuk ({stokMasuk}) - Terjual ({stokTerjual}) - Transfer ({stokTransfer})
              </span>
            </div>
            <div className="text-right">
              <span
                className={`text-lg font-mono font-extrabold ${
                  stokAkhirCalculated <= 0
                    ? "text-rose-600"
                    : stokAkhirCalculated <= 5
                    ? "text-amber-600"
                    : "text-emerald-700"
                }`}
              >
                {stokAkhirCalculated} Unit
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#A81B1B] hover:bg-[#8B1717] rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : isEdit ? "Perbarui Stok" : "Simpan Inisialisasi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
