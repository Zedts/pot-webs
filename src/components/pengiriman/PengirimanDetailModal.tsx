"use client";

import React, { useEffect, useState } from "react";
import { pengirimanService } from "@/services/pengiriman.service";
import { PengirimanModel, PenerimaanModel } from "@/types/pengiriman";
import { PengirimanStatusBadge } from "./PengirimanStatusBadge";
import { formatJakartaDateTime, formatRupiah } from "@/utils/shift.utils";
import { HugeIcon } from "@/components/ui/HugeIcon";
import { Cancel01Icon, DeliveryTruck01Icon } from "@hugeicons/core-free-icons";

interface PengirimanDetailModalProps {
  pengirimanId: string | null;
  onClose: () => void;
  onEdit?: (id: string) => void;
}

export function PengirimanDetailModal({
  pengirimanId,
  onClose,
  onEdit,
}: PengirimanDetailModalProps) {
  const [data, setData] = useState<PengirimanModel | null>(null);
  const [penerimaan, setPenerimaan] = useState<PenerimaanModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pengirimanId) {
      setData(null);
      setPenerimaan(null);
      return;
    }

    async function fetchDetail() {
      setIsLoading(true);
      setError(null);
      try {
        const [pengirimanData, penerimaanData] = await Promise.all([
          pengirimanService.getPengirimanById(pengirimanId!),
          pengirimanService.getPenerimaanByPengirimanId(pengirimanId!),
        ]);
        setData(pengirimanData);
        setPenerimaan(penerimaanData);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Gagal memuat detail pengiriman.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDetail();
  }, [pengirimanId]);

  if (!pengirimanId) return null;

  const totalUnits = data?.items?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0;
  const totalValue =
    data?.items?.reduce((sum, item) => sum + (item.qty || 0) * (Number(item.harga_produk) || 0), 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#18314E] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <HugeIcon icon={DeliveryTruck01Icon} size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold">Detail Dokumen Pengiriman (DO)</h2>
              <p className="text-xs text-white/70">ID: {pengirimanId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <HugeIcon icon={Cancel01Icon} size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Memuat rincian dokumen pengiriman...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs">
              {error}
            </div>
          ) : data ? (
            <>
              {/* Top Details Card */}
              <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-2xl grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Outlet Tujuan</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                    {data.lapak?.nama || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Petugas Pengirim</span>
                  <div className="flex flex-col mt-0.5">
                    <span className="font-bold text-slate-800 text-sm">
                      {data.pengirim?.nama || "-"}
                    </span>
                    {(data.pengirim?.username || data.pengirim?.no_hp) && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                        {data.pengirim.username && <span>@{data.pengirim.username}</span>}
                        {data.pengirim.username && data.pengirim.no_hp && <span>•</span>}
                        {data.pengirim.no_hp && <span>{data.pengirim.no_hp}</span>}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Tanggal Pengiriman</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                    {data.tanggal ? formatJakartaDateTime(data.tanggal) : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Status Dokumen</span>
                  <div className="mt-1">
                    <PengirimanStatusBadge status={data.status} />
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Dibuat Oleh</span>
                  <div className="flex flex-col mt-0.5">
                    <span className="font-bold text-slate-800 text-sm">
                      {data.creator?.nama || "Admin"}
                    </span>
                    {(data.creator?.username || data.creator?.no_hp) && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                        {data.creator.username && <span>@{data.creator.username}</span>}
                        {data.creator.username && data.creator.no_hp && <span>•</span>}
                        {data.creator.no_hp && <span>{data.creator.no_hp}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Daftar Produk yang Dikirim ({data.items?.length || 0})
                </span>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-[#18314E] text-white uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-4 py-2.5">Produk</th>
                        <th className="px-4 py-2.5 text-center">Jumlah Kirim</th>
                        <th className="px-4 py-2.5 text-right">Harga Satuan</th>
                        <th className="px-4 py-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.items?.map((item) => {
                        const itemSubtotal = (item.qty || 0) * (Number(item.harga_produk) || 0);
                        return (
                          <tr key={item.produk_id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-2.5 font-medium text-slate-900">
                              {item.nama_produk}
                            </td>
                            <td className="px-4 py-2.5 text-center font-mono font-bold">
                              {item.qty} {item.jenis_satuan || "pcs"}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono">
                              {formatRupiah(item.harga_produk || 0)}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900">
                              {formatRupiah(itemSubtotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td className="px-4 py-2.5 text-slate-800">Total Keseluruhan</td>
                        <td className="px-4 py-2.5 text-center font-mono text-slate-900">
                          {totalUnits} Unit
                        </td>
                        <td colSpan={2} className="px-4 py-2.5 text-right font-mono text-slate-900 text-sm">
                          {formatRupiah(totalValue)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Penerimaan Card if received */}
              {penerimaan && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-1">
                  <span className="font-bold text-emerald-800 block">
                    Konfirmasi Penerimaan oleh SPG
                  </span>
                  {penerimaan.spg?.nama && (
                    <div className="text-emerald-800 font-medium">
                      Penerima: {penerimaan.spg.nama}
                      {(penerimaan.spg.username || penerimaan.spg.no_hp) && (
                        <span className="text-emerald-600 font-normal ml-1">
                          ({penerimaan.spg.username ? `@${penerimaan.spg.username}` : ""}
                          {penerimaan.spg.username && penerimaan.spg.no_hp ? " • " : ""}
                          {penerimaan.spg.no_hp || ""})
                        </span>
                      )}
                    </div>
                  )}
                  <div className="text-emerald-700">
                    Diterima pada: {penerimaan.tanggal ? formatJakartaDateTime(penerimaan.tanggal) : "-"}
                  </div>
                  {penerimaan.catatan && (
                    <div className="text-emerald-700 italic">
                      Catatan: &ldquo;{penerimaan.catatan}&rdquo;
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div>
            {data?.status === "draft" && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(data.id);
                }}
                className="px-4 py-2 text-xs font-semibold text-[#18314E] bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Edit Dokumen DO
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
