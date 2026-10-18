"use client";

import React, { useState } from "react";
import { PengirimanTableRow } from "@/types/pengiriman";
import { formatJakartaDate, formatJakartaTime } from "@/utils/shift.utils";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { HugeIcon } from "@/components/ui/HugeIcon";
import {
  DeliveryTruck01Icon,
  CheckmarkCircle02Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";

interface KonfirmasiPengirimanTableProps {
  rows: PengirimanTableRow[];
  isLoading: boolean;
  onConfirm: (id: string) => Promise<void>;
  isConfirming?: boolean;
  onViewDetail?: (row: PengirimanTableRow) => void;
  onCreateNew?: () => void;
}

export function KonfirmasiPengirimanTable({
  rows,
  isLoading,
  onConfirm,
  isConfirming = false,
  onViewDetail,
  onCreateNew,
}: KonfirmasiPengirimanTableProps) {
  const [selectedRow, setSelectedRow] = useState<PengirimanTableRow | null>(null);

  const handleOpenConfirm = (row: PengirimanTableRow) => {
    setSelectedRow(row);
  };

  const handleCloseConfirm = () => {
    if (!isConfirming) {
      setSelectedRow(null);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!selectedRow) return;
    try {
      await onConfirm(selectedRow.id);
      setSelectedRow(null);
    } catch {
      // Handled in parent with toast
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#F3E7D8] shadow-sm overflow-hidden">
      {/* Section Header */}
      <div className="p-5 md:px-6 md:py-5 border-b border-[#F3E7D8] flex items-center justify-between">
        <div>
          <h2 className="text-base md:text-lg font-bold text-[#18314E] tracking-tight">
            Antrian Konfirmasi Keberangkatan
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Pelepasan Delivery Order berstatus Draft untuk diberangkatkan via kurir Viar
          </p>
        </div>

        <div className="text-xs font-semibold text-[#6B7280]">
          Menunggu Konfirmasi:{" "}
          <span className="text-[#A81B1B] font-bold">{rows.length} DO</span>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-[#18314E] text-white text-xs uppercase tracking-wider font-semibold">
            <tr>
              <th scope="col" className="px-5 py-3.5">No. DO</th>
              <th scope="col" className="px-5 py-3.5">Tujuan Lapak</th>
              <th scope="col" className="px-5 py-3.5">Penerima (SPG)</th>
              <th scope="col" className="px-5 py-3.5">Waktu Dibuat</th>
              <th scope="col" className="px-5 py-3.5">Total Muatan</th>
              <th scope="col" className="px-5 py-3.5">Status</th>
              <th scope="col" className="px-5 py-3.5 text-center">Aksi Pelepasan</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                  <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-32" /></td>
                  <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                  <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded w-16" /></td>
                  <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-20" /></td>
                  <td className="px-5 py-4"><div className="h-6 bg-slate-200 rounded-full w-24" /></td>
                  <td className="px-5 py-4 text-center"><div className="h-8 bg-slate-200 rounded-xl w-36 mx-auto" /></td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-14 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                      <HugeIcon icon={CheckmarkCircle02Icon} size={26} strokeWidth={2} />
                    </div>
                    <p className="text-sm font-bold text-[#18314E] mt-2">
                      Semua Pengiriman Telah Dikonfirmasi
                    </p>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Tidak ada Delivery Order berstatus Draft yang menunggu pelepasan armada saat ini.
                    </p>
                    {onCreateNew && (
                      <button
                        type="button"
                        onClick={onCreateNew}
                        className="mt-3 inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#A81B1B] bg-[#FDF6EE] hover:bg-[#F3E7D8] border border-[#F3E7D8] transition-all cursor-pointer shadow-2xs"
                      >
                        <span>+ Buat Pengiriman Baru</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* No DO */}
                  <td className="px-5 py-4 font-mono font-bold text-slate-900">
                    {row.uniqueId}
                  </td>

                  {/* Lapak */}
                  <td className="px-5 py-4 font-medium text-slate-800">
                    {row.lapakNama}
                  </td>

                  {/* Penerima SPG */}
                  <td className="px-5 py-4 text-xs">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800">
                        {row.penerimaSpg}
                      </span>
                      {(row.penerimaUsername || row.penerimaNoHp) && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          {row.penerimaUsername && <span>@{row.penerimaUsername}</span>}
                          {row.penerimaUsername && row.penerimaNoHp && <span>•</span>}
                          {row.penerimaNoHp && <span>{row.penerimaNoHp}</span>}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Waktu Dibuat */}
                  <td className="px-5 py-4 text-xs">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800">
                        {formatJakartaDate(row.tanggalRaw || row.waktuKirim)}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {formatJakartaTime(row.tanggalRaw || row.waktuKirim)} WIB
                      </span>
                    </div>
                  </td>

                  {/* Total Muatan */}
                  <td className="px-5 py-4 text-slate-700 font-medium text-xs">
                    <span className="font-bold text-[#18314E]">{row.qtyKirim}</span> Unit
                    <span className="text-slate-400 ml-1">({row.totalItems} Varian)</span>
                  </td>

                  {/* Status Badge */}
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200">
                      Draft (Siap Kirim)
                    </span>
                  </td>

                  {/* Aksi Pelepasan */}
                  <td className="px-5 py-4 text-center">
                    <div className="inline-flex items-center space-x-2">
                      {/* Primary Dispatch Confirm Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenConfirm(row)}
                        disabled={isConfirming}
                        className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <HugeIcon icon={DeliveryTruck01Icon} size={15} strokeWidth={2} />
                        <span>Konfirmasi Kirim</span>
                      </button>

                      {/* Secondary View Button */}
                      <button
                        type="button"
                        onClick={() => onViewDetail && onViewDetail(row)}
                        title="Lihat Rincian"
                        aria-label="Lihat Rincian"
                        className="p-1.5 text-slate-500 hover:text-[#18314E] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <HugeIcon icon={ViewIcon} size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Standard Table Footer */}
      <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Menampilkan {rows.length} pengiriman menunggu konfirmasi</span>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(selectedRow)}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmSubmit}
        title="Konfirmasi Keberangkatan DO"
        message={
          selectedRow
            ? `Pelepasan pengiriman ${selectedRow.uniqueId} ke ${selectedRow.lapakNama} (${selectedRow.qtyKirim} Unit)? Status akan diubah menjadi 'Dalam Perjalanan (dikirim_viar)' dan siap diterima oleh SPG.`
            : ""
        }
        confirmLabel="Ya, Berangkatkan"
        cancelLabel="Batal"
        isLoading={isConfirming}
        isDestructive={false}
        icon={DeliveryTruck01Icon}
      />
    </div>
  );
}
