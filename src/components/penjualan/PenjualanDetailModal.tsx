"use client";

import React, { useEffect, useState } from "react";
import { penjualanService } from "@/services/penjualan.service";
import { PenjualanModel } from "@/types/penjualan";
import { PenjualanPaymentBadge } from "./PenjualanPaymentBadge";
import {
  formatJakartaDateTime,
  formatRupiah,
} from "@/utils/shift.utils";
import { HugeIcon } from "@/components/ui/HugeIcon";
import {
  Cancel01Icon,
  Invoice01Icon,
  Store01Icon,
  UserIcon,
  Calendar03Icon,
  Image01Icon,
  Edit01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";

interface PenjualanDetailModalProps {
  penjualanId: string | null;
  isOpen: boolean;
  canManage?: boolean;
  onClose: () => void;
  onEdit?: (sale: PenjualanModel) => void;
}

export function PenjualanDetailModal({
  penjualanId,
  isOpen,
  canManage = false,
  onClose,
  onEdit,
}: PenjualanDetailModalProps) {
  const [data, setData] = useState<PenjualanModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  // Fetch full details via getPenjualanById
  useEffect(() => {
    if (!isOpen || !penjualanId) {
      setData(null);
      setError(null);
      return;
    }

    let isMounted = true;
    async function fetchDetail() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await penjualanService.getPenjualanById(penjualanId!);
        if (isMounted) {
          setData(result);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg =
            err instanceof Error
              ? err.message
              : "Gagal memuat rincian transaksi penjualan.";
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [isOpen, penjualanId]);

  if (!isOpen) return null;

  const proofUrl = data?.bukti_bayar_url || data?.bukti_qris_url;
  const totalUnits =
    data?.items?.reduce((sum, item) => sum + (Number(item.qty) || 0), 0) || 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#18314E] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <HugeIcon icon={Invoice01Icon} size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold">
                Detail Transaksi Penjualan
              </h2>
              <p className="text-xs text-white/70">
                ID: {penjualanId || "-"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <HugeIcon icon={Cancel01Icon} size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              <div className="w-8 h-8 border-2 border-[#18314E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Memuat rincian dokumen penjualan...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2">
              <HugeIcon icon={AlertCircleIcon} size={18} />
              <span>{error}</span>
            </div>
          ) : data ? (
            <>
              {/* Top Metadata Card */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* 1. Outlet Lapak */}
                <div>
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <HugeIcon icon={Store01Icon} size={13} />
                    Outlet Lapak
                  </span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block truncate">
                    {data.lapak?.nama || "Lapak Tidak Diketahui"}
                  </span>
                  {data.lapak?.lokasi && (
                    <span className="text-[11px] text-slate-400 block truncate">
                      {data.lapak.lokasi}
                    </span>
                  )}
                </div>

                {/* 2. Tanggal & Waktu */}
                <div>
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <HugeIcon icon={Calendar03Icon} size={13} />
                    Waktu Transaksi
                  </span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                    {formatJakartaDateTime(data.tanggal)}
                  </span>
                </div>

                {/* 3. Metode Pembayaran */}
                <div>
                  <span className="text-slate-400 font-medium block">
                    Metode Bayar
                  </span>
                  <div className="mt-1">
                    <PenjualanPaymentBadge method={data.metode_pembayaran} />
                  </div>
                </div>

                {/* 4. Petugas SPG */}
                <div>
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <HugeIcon icon={UserIcon} size={13} />
                    Petugas SPG
                  </span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block truncate">
                    {data.spg?.nama || "Belum Ditugaskan"}
                  </span>
                  {data.spg?.username && (
                    <span className="text-[11px] text-slate-400 block font-mono">
                      @{data.spg.username}
                    </span>
                  )}
                </div>
              </div>

              {/* Catatan / Keterangan (if any) */}
              {data.catatan && (
                <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl text-xs text-amber-900">
                  <span className="font-bold block text-[11px] uppercase tracking-wider text-amber-700 mb-0.5">
                    Catatan Transaksi:
                  </span>
                  <p className="italic">{data.catatan}</p>
                </div>
              )}

              {/* Line Items Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Daftar Produk yang Terjual
                </span>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-3.5 py-2.5">No</th>
                        <th className="px-3.5 py-2.5">Nama Produk</th>
                        <th className="px-3.5 py-2.5 text-right">Harga Satuan</th>
                        <th className="px-3.5 py-2.5 text-center">Qty</th>
                        <th className="px-3.5 py-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.items && data.items.length > 0 ? (
                        data.items.map((it, idx) => (
                          <tr key={it.id || idx} className="hover:bg-slate-50/60">
                            <td className="px-3.5 py-2.5 font-mono text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="px-3.5 py-2.5 font-medium text-slate-800">
                              {it.nama_produk}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono text-slate-600">
                              {formatRupiah(it.harga_satuan)}
                            </td>
                            <td className="px-3.5 py-2.5 text-center font-bold text-slate-800 font-mono">
                              {it.qty}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-bold text-slate-900 font-mono">
                              {formatRupiah(it.subtotal)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                            Tidak ada rincian item produk.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                      <tr>
                        <td colSpan={3} className="px-3.5 py-2.5 text-right">
                          Total Unit Terjual:
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-mono">
                          {totalUnits} unit
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono text-sm text-[#18314E]">
                          {formatRupiah(data.total_harga)}
                        </td>
                      </tr>
                      {Boolean(Number(data.kembalian_disimpan || 0) > 0) && (
                        <tr className="bg-amber-50/50 text-[#E67E22] border-t border-amber-200/60">
                          <td colSpan={4} className="px-3.5 py-2 text-right text-xs">
                            Kembalian Disimpan:
                          </td>
                          <td className="px-3.5 py-2 text-right font-mono text-xs font-bold">
                            {formatRupiah(data.kembalian_disimpan || 0)}
                          </td>
                        </tr>
                      )}
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Bukti Pembayaran Attachment */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <HugeIcon icon={Image01Icon} size={15} />
                  Lampiran Bukti Pembayaran
                </span>

                {proofUrl ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-24 h-24 rounded-xl border border-slate-200 overflow-hidden bg-slate-200 shrink-0">
                      {/* Using standard img to avoid next/image domain restrictions */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={proofUrl}
                        alt="Bukti Pembayaran"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 text-center sm:text-left text-xs space-y-1">
                      <span className="font-bold text-slate-800">
                        Foto Bukti Struk / QRIS
                      </span>
                      <p className="text-slate-400 text-[11px]">
                        Lampiran foto pembayaran yang diunggah saat transaksi dicatat.
                      </p>
                      <a
                        href={proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-[#A81B1B] hover:underline font-bold text-[11px] pt-1"
                      >
                        Buka Gambar Ukuran Penuh ↗
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400 italic">
                    Tidak ada lampiran foto bukti bayar (transaksi tunai / tanpa bukti).
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div>
            {canManage && data && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(data);
                }}
                className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <HugeIcon icon={Edit01Icon} size={14} />
                <span>Edit Transaksi</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#18314E] hover:bg-[#13273E] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
