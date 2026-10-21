"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PenjualanModel, UpdatePenjualanPayload } from "@/types/penjualan";
import { penjualanService } from "@/services/penjualan.service";
import { showToast } from "@/lib/toast";
import { SearchableSelect, SelectOption } from "@/components/ui/SearchableSelect";
import { formatJakartaDateTime, formatRupiah } from "@/utils/shift.utils";
import { HugeIcon } from "@/components/ui/HugeIcon";
import {
  Cancel01Icon,
  Edit01Icon,
  Image01Icon,
  Store01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";

interface PenjualanEditModalProps {
  sale: PenjualanModel | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

export function PenjualanEditModal({
  sale,
  isOpen,
  onClose,
  onSuccess,
}: PenjualanEditModalProps) {
  const [metodePembayaran, setMetodePembayaran] = useState<string>("tunai");
  const [customerCashInput, setCustomerCashInput] = useState<string>("");
  const [isKembalianDisimpan, setIsKembalianDisimpan] = useState<boolean>(false);
  const [catatan, setCatatan] = useState<string>("");
  const [buktiFile, setBuktiFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const metodeOptions: SelectOption[] = [
    { value: "tunai", label: "Tunai (Cash)" },
    { value: "qris", label: "QRIS" },
    { value: "transfer", label: "Transfer Bank" },
  ];

  // Initialize form fields when modal opens
  useEffect(() => {
    if (sale && isOpen) {
      const normalizedMetode = (sale.metode_pembayaran || "tunai").toLowerCase().trim();
      const isTunaiInit = normalizedMetode === "tunai";
      setMetodePembayaran(normalizedMetode);
      setCatatan(sale.catatan || "");
      setBuktiFile(null);
      setPreviewUrl(sale.bukti_bayar_url || sale.bukti_qris_url || null);
      setErrorMessage(null);

      const existingKembalian = Number(sale.kembalian_disimpan || 0);
      if (isTunaiInit) {
        setIsKembalianDisimpan(existingKembalian > 0);
        const initialCash = Number(sale.total_harga || 0) + existingKembalian;
        setCustomerCashInput(initialCash > 0 ? initialCash.toLocaleString("id-ID") : "");
      } else {
        setIsKembalianDisimpan(false);
        setCustomerCashInput("");
      }
    }
  }, [sale, isOpen]);

  const isTunai = metodePembayaran === "tunai";

  const handleCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, "");
    if (!rawVal) {
      setCustomerCashInput("");
      return;
    }
    const num = parseInt(rawVal, 10);
    setCustomerCashInput(num.toLocaleString("id-ID"));
  };

  const numericCustomerCash = parseInt(customerCashInput.replace(/[^0-9]/g, ""), 10) || 0;

  const calculatedKembalian = useMemo(() => {
    if (!isTunai || numericCustomerCash <= 0) return 0;
    const diff = numericCustomerCash - (sale?.total_harga || 0);
    return diff > 0 ? diff : 0;
  }, [isTunai, numericCustomerCash, sale?.total_harga]);

  const handleMetodeChange = (val: string) => {
    setMetodePembayaran(val);
    if (val !== "tunai") {
      setIsKembalianDisimpan(false);
    }
  };

  // Clean up object URLs on unmount / change
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !sale) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("File bukti pembayaran harus berupa file gambar (JPG/PNG).");
      return;
    }

    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setBuktiFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    // Validation Guard: Cash received must not be less than transaction total
    if (isTunai && numericCustomerCash > 0 && numericCustomerCash < sale.total_harga) {
      const msg = `Uang diterima tidak boleh kurang dari total transaksi (${formatRupiah(sale.total_harga)}).`;
      setErrorMessage(msg);
      showToast.error(msg);
      setIsSubmitting(false);
      return;
    }

    try {
      const payload: UpdatePenjualanPayload = {
        metode_pembayaran: metodePembayaran,
        catatan: catatan.trim(),
        kembalian_disimpan: isTunai && isKembalianDisimpan ? calculatedKembalian : 0,
      };

      if (buktiFile) {
        payload.bukti_bayar = buktiFile;
      }

      await penjualanService.updatePenjualan(sale.id, payload);
      showToast.success("Data transaksi penjualan berhasil diperbarui.");
      await onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Gagal memperbarui transaksi penjualan.";
      setErrorMessage(msg);
      showToast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#18314E] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <HugeIcon icon={Edit01Icon} size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold">
                Edit Transaksi Penjualan
              </h2>
              <p className="text-xs text-white/70">ID: {sale.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Tutup modal"
          >
            <HugeIcon icon={Cancel01Icon} size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Read-Only Context Summary */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <HugeIcon icon={Store01Icon} size={12} />
                Outlet Lapak
              </span>
              <span className="font-bold text-slate-800 text-xs mt-0.5 block truncate">
                {sale.lapak?.nama || "Lapak Tidak Diketahui"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <HugeIcon icon={UserIcon} size={12} />
                Petugas SPG
              </span>
              <span className="font-bold text-slate-800 text-xs mt-0.5 block truncate">
                {sale.spg?.nama || "SPG Belum Ditugaskan"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">
                Total Transaksi
              </span>
              <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">
                {formatRupiah(sale.total_harga)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">
                Waktu Transaksi
              </span>
              <span className="font-bold text-slate-800 text-[11px] mt-0.5 block">
                {formatJakartaDateTime(sale.tanggal)}
              </span>
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Form Field 1: Metode Pembayaran */}
          <div>
            <label className="block text-xs font-bold text-[#18314E] uppercase tracking-wider mb-1.5">
              Metode Pembayaran
            </label>
            <SearchableSelect
              options={metodeOptions}
              value={metodePembayaran}
              onChange={handleMetodeChange}
              placeholder="Pilih Metode Pembayaran"
            />
          </div>

          {/* Cash Payment Section (Only for Tunai) */}
          {isTunai && (
            <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl animate-fadeIn">
              {/* Cash Input with Live Rupiah Formatter */}
              <div>
                <label className="block text-xs font-bold text-[#18314E] uppercase tracking-wider mb-1.5">
                  Uang Diterima (Tunai)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold">
                    Rp
                  </span>
                  <input
                    type="text"
                    value={customerCashInput}
                    onChange={handleCashChange}
                    placeholder="0"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E] text-slate-800 font-mono font-semibold transition-all"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Masukkan nominal uang tunai yang diterima dari pelanggan
                </span>
              </div>

              {/* Kembalian Display Row */}
              <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200/60 rounded-xl">
                <span className="text-xs font-semibold text-slate-600">
                  Kembalian:
                </span>
                <span
                  className={`font-mono text-xs font-bold ${
                    calculatedKembalian > 0 ? "text-rose-600" : "text-slate-400"
                  }`}
                >
                  {formatRupiah(calculatedKembalian)}
                </span>
              </div>

              {/* Simpan Kembalian Toggle Switch */}
              {calculatedKembalian > 0 && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-amber-950 block">
                      Simpan Kembalian ke Pembukuan
                    </span>
                    <span className="text-[11px] text-amber-800/90 block mt-0.5 leading-snug">
                      {isKembalianDisimpan
                        ? `Kembalian sebesar ${formatRupiah(calculatedKembalian)} dicatat sebagai kas tersimpan`
                        : "Kembalian diberikan langsung kepada pelanggan"}
                    </span>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={isKembalianDisimpan}
                    onClick={() => setIsKembalianDisimpan(!isKembalianDisimpan)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 ${
                      isKembalianDisimpan ? "bg-[#18314E]" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isKembalianDisimpan ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Form Field 2: Catatan Transaksi */}
          <div>
            <label className="block text-xs font-bold text-[#18314E] uppercase tracking-wider mb-1.5">
              Catatan Transaksi
            </label>
            <textarea
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tambahkan catatan atau keterangan transaksi..."
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E] text-slate-800 resize-none font-medium leading-relaxed"
            />
          </div>

          {/* Form Field 3: Lampiran Foto Bukti Bayar */}
          <div>
            <label className="block text-xs font-bold text-[#18314E] uppercase tracking-wider mb-1.5">
              Lampiran Bukti Pembayaran
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              {previewUrl && (
                <div className="w-20 h-20 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview Bukti"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex-1 w-full">
                <label className="flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-xs font-semibold text-slate-700">
                  <HugeIcon icon={Image01Icon} size={16} />
                  <span>
                    {buktiFile ? buktiFile.name : "Pilih atau Ganti Foto Bukti"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Format gambar JPG atau PNG (Maks 5 MB).
                </span>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#18314E] hover:bg-[#13273E] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Perubahan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
