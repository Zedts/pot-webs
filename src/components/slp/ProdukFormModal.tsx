"use client";

import React, { useState, useEffect } from "react";
import {
  ProdukModel,
  KategoriModel,
  SatuanModel,
  CreateProdukPayload,
  UpdateProdukPayload,
} from "@/types/slp";
import { SearchableSelect, SelectOption } from "@/components/ui/SearchableSelect";
import { HugeIcon } from "@/components/ui/HugeIcon";
import { Cancel01Icon, PackageIcon } from "@hugeicons/core-free-icons";

interface ProdukFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ProdukModel | null;
  kategoriList: KategoriModel[];
  satuanList: SatuanModel[];
  onSubmitCreate: (payload: CreateProdukPayload) => Promise<void>;
  onSubmitUpdate: (id: string, payload: UpdateProdukPayload) => Promise<void>;
}

export function ProdukFormModal({
  isOpen,
  onClose,
  initialData,
  kategoriList,
  satuanList,
  onSubmitCreate,
  onSubmitUpdate,
}: ProdukFormModalProps) {
  const isEdit = Boolean(initialData);

  const [nama, setNama] = useState("");
  const [hargaInput, setHargaInput] = useState("");
  const [kategoriId, setKategoriId] = useState("");
  const [satuanId, setSatuanId] = useState("");
  const [isActive, setIsActive] = useState("active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setNama(initialData.nama || "");
      const rawHarga = initialData.harga ?? 0;
      setHargaInput(rawHarga ? Number(rawHarga).toLocaleString("id-ID") : "0");
      setKategoriId(initialData.kategori_id || "");
      setSatuanId(initialData.satuan_id || "");
      const stat = (initialData.is_active || "active").toLowerCase().trim();
      setIsActive(stat === "aktif" || stat === "active" ? "active" : "inactive");
    } else {
      setNama("");
      setHargaInput("");
      setKategoriId(kategoriList[0]?.id || "");
      setSatuanId(satuanList[0]?.id || "");
      setIsActive("active");
    }
    setError(null);
  }, [initialData, isOpen, kategoriList, satuanList]);

  if (!isOpen) return null;

  // Handle Rupiah typing with thousand separator
  const handleHargaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, "");
    if (!rawVal) {
      setHargaInput("");
      return;
    }
    const num = parseInt(rawVal, 10);
    setHargaInput(num.toLocaleString("id-ID"));
  };

  const numericHarga = parseInt(hargaInput.replace(/[^0-9]/g, ""), 10) || 0;

  // Options for Kategori & Satuan
  const kategoriOptions: SelectOption[] = kategoriList.map((k) => ({
    value: k.id,
    label: k.nama_kategori,
  }));

  const satuanOptions: SelectOption[] = satuanList.map((s) => ({
    value: s.id,
    label: s.jenis_satuan,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || nama.trim().length < 2) {
      setError("Nama produk wajib diisi (minimal 2 karakter).");
      return;
    }
    if (numericHarga < 0) {
      setError("Harga satuan harus berupa angka tidak negatif.");
      return;
    }
    if (!kategoriId) {
      setError("Pilih salah satu kategori produk.");
      return;
    }
    if (!satuanId) {
      setError("Pilih salah satu satuan produk.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      if (isEdit && initialData) {
        await onSubmitUpdate(initialData.id, {
          nama: nama.trim(),
          harga: numericHarga,
          kategori_id: kategoriId,
          satuan_id: satuanId,
          is_active: isActive,
        });
      } else {
        await onSubmitCreate({
          nama: nama.trim(),
          harga: numericHarga,
          kategori_id: kategoriId,
          satuan_id: satuanId,
          is_active: isActive,
        });
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan produk.";
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
                {isEdit ? "Ubah Data Produk" : "Tambah Produk Baru"}
              </h2>
              <p className="text-xs text-white/70">
                {isEdit
                  ? "Perbarui informasi produk master katalog"
                  : "Daftarkan produk baru ke dalam sistem"}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <span className="font-semibold">Perhatian:</span>
              <span>{error}</span>
            </div>
          )}

          {/* Nama Produk */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Nama Produk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Risoles Mayo Spesial"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E] transition-all"
            />
          </div>

          {/* Harga Satuan with Live Rupiah Formatter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Harga Satuan (Rp) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-bold">
                Rp
              </span>
              <input
                type="text"
                required
                value={hargaInput}
                onChange={handleHargaChange}
                placeholder="0"
                className="w-full pl-12 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E] transition-all font-mono font-semibold"
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Format otomatis rupiah dengan pemisah ribuan
            </span>
          </div>

          {/* Kategori & Satuan with SearchableSelect */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Kategori <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={kategoriOptions}
                value={kategoriId}
                onChange={setKategoriId}
                placeholder="Pilih Kategori..."
                searchPlaceholder="Cari kategori..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Satuan <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={satuanOptions}
                value={satuanId}
                onChange={setSatuanId}
                placeholder="Pilih Satuan..."
                searchPlaceholder="Cari satuan..."
                required
              />
            </div>
          </div>

          {/* Status Produk */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Status Produk
            </label>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={isActive === "active"}
                  onChange={() => setIsActive("active")}
                  className="w-4 h-4 text-[#A81B1B] focus:ring-[#A81B1B]"
                />
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Aktif (Dijual)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={isActive === "inactive"}
                  onChange={() => setIsActive("inactive")}
                  className="w-4 h-4 text-[#A81B1B] focus:ring-[#A81B1B]"
                />
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  Nonaktif (Diarsipkan)
                </span>
              </label>
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
              {isSubmitting ? "Menyimpan..." : isEdit ? "Perbarui Produk" : "Simpan Produk"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
