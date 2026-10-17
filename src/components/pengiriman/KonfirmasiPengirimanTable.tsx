"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PengirimanTableRow } from "@/types/pengiriman";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { HugeIcon } from "@/components/ui/HugeIcon";
import {
  DeliveryTruck01Icon,
  ViewIcon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";

interface KonfirmasiPengirimanTableProps {
  rows: PengirimanTableRow[];
  isLoading: boolean;
  onConfirm: (id: string) => Promise<void>;
  isConfirming?: boolean;
}

export function KonfirmasiPengirimanTable({
  rows,
  isLoading,
  onConfirm,
  isConfirming = false,
}: KonfirmasiPengirimanTableProps) {
  const router = useRouter();
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
    <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-[#F3E7D8] overflow-hidden">
      {/* Section Header */}
      <div className="p-5 md:px-7 md:py-6 border-b border-[#F3E7D8] flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-[#18314E] tracking-tight">
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
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#EFF4F9] text-[#475569] text-xs font-semibold tracking-wide border-b border-[#F3E7D8]">
              <th scope="col" className="py-3.5 px-6 font-bold">No. DO</th>
              <th scope="col" className="py-3.5 px-6 font-bold">Tujuan Lapak</th>
              <th scope="col" className="py-3.5 px-6 font-bold">Penerima (SPG)</th>
              <th scope="col" className="py-3.5 px-6 font-bold">Waktu Dibuat</th>
              <th scope="col" className="py-3.5 px-6 font-bold">Total Muatan</th>
              <th scope="col" className="py-3.5 px-6 font-bold">Status</th>
              <th scope="col" className="py-3.5 px-6 font-bold text-center">Aksi Pelepasan</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F3E7D8] text-sm text-[#1E293B]">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="py-4 px-6"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                  <td className="py-4 px-6"><div className="h-4 bg-slate-200 rounded w-32" /></td>
                  <td className="py-4 px-6"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                  <td className="py-4 px-6"><div className="h-4 bg-slate-100 rounded w-16" /></td>
                  <td className="py-4 px-6"><div className="h-4 bg-slate-200 rounded w-20" /></td>
                  <td className="py-4 px-6"><div className="h-6 bg-slate-200 rounded-full w-24" /></td>
                  <td className="py-4 px-6 text-center"><div className="h-8 bg-slate-200 rounded-xl w-36 mx-auto" /></td>
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
                    <Link
                      href="/pengiriman/tambah"
                      className="mt-3 inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#A81B1B] bg-[#FDF6EE] hover:bg-[#F3E7D8] border border-[#F3E7D8] transition-all cursor-pointer shadow-2xs"
                    >
                      <span>+ Buat Pengiriman Baru</span>
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* No DO */}
                  <td className="py-4 px-6 font-bold text-[#18314E] font-mono text-xs">
                    {row.uniqueId}
                  </td>

                  {/* Lapak */}
                  <td className="py-4 px-6 font-medium text-slate-800">
                    {row.lapakNama}
                  </td>

                  {/* Penerima SPG */}
                  <td className="py-4 px-6 text-slate-600 font-medium">
                    {row.penerimaSpg}
                  </td>

                  {/* Waktu Dibuat */}
                  <td className="py-4 px-6 font-mono text-xs text-slate-600">
                    {row.waktuKirim}
                  </td>

                  {/* Total Muatan */}
                  <td className="py-4 px-6 text-slate-700 font-medium text-xs">
                    <span className="font-bold text-[#18314E]">{row.qtyKirim}</span> Unit
                    <span className="text-slate-400 ml-1">({row.totalItems} Varian)</span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200">
                      Draft (Siap Kirim)
                    </span>
                  </td>

                  {/* Aksi Pelepasan */}
                  <td className="py-4 px-6 text-center">
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
                        onClick={() => router.push(`/pengiriman/${row.id}`)}
                        title="Lihat Rincian"
                        aria-label="Lihat Rincian"
                        className="p-1.5 rounded-xl border border-[#F3E7D8] bg-[#FDF6EE] hover:bg-[#F3E7D8] text-[#18314E] hover:text-[#A81B1B] transition-all cursor-pointer"
                      >
                        <HugeIcon icon={ViewIcon} size={15} strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
