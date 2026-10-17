"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PengirimanTableRow, LapakSimple } from "@/types/pengiriman";
import { PengirimanStatusBadge } from "./PengirimanStatusBadge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { HugeIcon } from "@/components/ui/HugeIcon";
import {
  Edit01Icon,
  ViewIcon,
  Delete02Icon,
  PlusSignIcon,
  Search01Icon,
  FilterIcon,
} from "@hugeicons/core-free-icons";

interface PengirimanTableProps {
  rows: PengirimanTableRow[];
  lapakList?: LapakSimple[];
  isLoading: boolean;
  canCreate?: boolean;
  canDelete?: boolean;
  onDelete?: (id: string) => Promise<void>;
}

export function PengirimanTable({
  rows,
  lapakList = [],
  isLoading,
  canCreate = true,
  canDelete = false,
  onDelete,
}: PengirimanTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedLapak, setSelectedLapak] = useState<string>("all");
  const [deletingRow, setDeletingRow] = useState<PengirimanTableRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (selectedStatus !== "all" && r.status !== selectedStatus) {
        return false;
      }
      if (selectedLapak !== "all" && r.lapakId !== selectedLapak) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchId = r.uniqueId.toLowerCase().includes(q);
        const matchLapak = r.lapakNama.toLowerCase().includes(q);
        const matchSpg = r.penerimaSpg.toLowerCase().includes(q);
        return matchId || matchLapak || matchSpg;
      }
      return true;
    });
  }, [rows, selectedStatus, selectedLapak, searchTerm]);

  const handleConfirmDelete = async () => {
    if (!deletingRow || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(deletingRow.id);
      setDeletingRow(null);
    } catch {
      // Error toast is handled by parent
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-[#F3E7D8] overflow-hidden">
      {/* Table Section Header */}
      <div className="p-5 md:px-7 md:py-6 border-b border-[#F3E7D8] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-[#18314E] tracking-tight">
            Daftar Pengiriman Barang
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Riwayat alokasi delivery order dan status tanda terima lapak
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canCreate && (
            <button
              type="button"
              onClick={() => router.push("/pengiriman/tambah")}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-[#A81B1B] hover:bg-[#851515] text-white font-bold text-xs sm:text-sm shadow-xs active:scale-[0.99] transition-all cursor-pointer"
            >
              <HugeIcon icon={PlusSignIcon} size={16} strokeWidth={2.2} />
              <span>Buat Pengiriman</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 md:px-7 border-b border-[#F3E7D8] bg-[#FDFBF9] flex flex-col sm:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <HugeIcon icon={Search01Icon} size={16} strokeWidth={2} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari No. DO, Lapak, atau SPG..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#F3E7D8] bg-white text-[#18314E] placeholder:text-slate-400 focus:outline-none focus:border-[#A81B1B] focus:ring-1 focus:ring-[#A81B1B] transition-all"
          />
        </div>

        {/* Status Dropdown Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full sm:w-44 px-3 py-2 text-xs rounded-xl border border-[#F3E7D8] bg-white text-[#18314E] focus:outline-none focus:border-[#A81B1B] transition-all cursor-pointer appearance-none pr-8 font-medium"
            >
              <option value="all">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="dikirim_viar">Dalam Perjalanan</option>
              <option value="diterima_spg">Diterima SPG</option>
              <option value="selesai">Selesai</option>
            </select>
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <HugeIcon icon={FilterIcon} size={14} strokeWidth={2} />
            </span>
          </div>

          {/* Lapak Dropdown Filter */}
          <div className="relative flex-1 sm:flex-none">
            <select
              value={selectedLapak}
              onChange={(e) => setSelectedLapak(e.target.value)}
              className="w-full sm:w-44 px-3 py-2 text-xs rounded-xl border border-[#F3E7D8] bg-white text-[#18314E] focus:outline-none focus:border-[#A81B1B] transition-all cursor-pointer appearance-none pr-8 font-medium"
            >
              <option value="all">Semua Lapak</option>
              {lapakList.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nama}
                </option>
              ))}
            </select>
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <HugeIcon icon={FilterIcon} size={14} strokeWidth={2} />
            </span>
          </div>
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
              <th scope="col" className="py-3.5 px-6 font-bold">Waktu Kirim</th>
              <th scope="col" className="py-3.5 px-6 font-bold">Total Item</th>
              <th scope="col" className="py-3.5 px-6 font-bold">Status</th>
              <th scope="col" className="py-3.5 px-6 font-bold text-center">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F3E7D8] text-sm text-[#1E293B]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="py-4 px-6"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                  <td className="py-4 px-6"><div className="h-4 bg-slate-200 rounded w-32" /></td>
                  <td className="py-4 px-6"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                  <td className="py-4 px-6"><div className="h-4 bg-slate-100 rounded w-16" /></td>
                  <td className="py-4 px-6"><div className="h-4 bg-slate-200 rounded w-20" /></td>
                  <td className="py-4 px-6"><div className="h-6 bg-slate-200 rounded-full w-24" /></td>
                  <td className="py-4 px-6 text-center"><div className="h-8 bg-slate-200 rounded-xl w-28 mx-auto" /></td>
                </tr>
              ))
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <p className="text-sm font-semibold text-[#18314E]">
                      {searchTerm || selectedStatus !== "all" || selectedLapak !== "all"
                        ? "Tidak ditemukan pengiriman yang sesuai filter"
                        : "Belum ada riwayat pengiriman"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {searchTerm || selectedStatus !== "all" || selectedLapak !== "all"
                        ? "Coba sesuaikan kata kunci atau filter status/lapak."
                        : "Klik tombol 'Buat Pengiriman' di atas untuk membuat delivery order baru."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
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

                  {/* Waktu Kirim */}
                  <td className="py-4 px-6 font-mono text-xs text-slate-600">
                    {row.waktuKirim}
                  </td>

                  {/* Total Item */}
                  <td className="py-4 px-6 text-slate-700 font-medium text-xs">
                    <span className="font-bold text-[#18314E]">{row.qtyKirim}</span> Unit
                    <span className="text-slate-400 ml-1">({row.totalItems} Varian)</span>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-6">
                    <PengirimanStatusBadge
                      status={row.status}
                      receiptStatus={row.statusPenerimaan}
                    />
                  </td>

                  {/* Aksi: Bordered Icon Buttons */}
                  <td className="py-4 px-6 text-center">
                    <div className="inline-flex items-center space-x-1.5">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => router.push(`/pengiriman/${row.id}/edit`)}
                        title="Ubah Pengiriman"
                        aria-label="Ubah Pengiriman"
                        className="p-2 rounded-xl border border-[#F3E7D8] bg-[#FDF6EE] hover:bg-[#F3E7D8] text-[#18314E] hover:text-[#A81B1B] transition-all cursor-pointer"
                      >
                        <HugeIcon icon={Edit01Icon} size={15} strokeWidth={2} />
                      </button>

                      {/* View Details Button */}
                      <button
                        type="button"
                        onClick={() => router.push(`/pengiriman/${row.id}`)}
                        title="Lihat Rincian"
                        aria-label="Lihat Rincian"
                        className="p-2 rounded-xl border border-[#F3E7D8] bg-[#FDF6EE] hover:bg-[#F3E7D8] text-[#18314E] hover:text-[#A81B1B] transition-all cursor-pointer"
                      >
                        <HugeIcon icon={ViewIcon} size={15} strokeWidth={2} />
                      </button>

                      {/* Remove Button */}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeletingRow(row)}
                          title="Hapus Pengiriman"
                          aria-label="Hapus Pengiriman"
                          className="p-2 rounded-xl border border-[#F3E7D8] bg-[#FDF6EE] hover:bg-rose-50 hover:border-rose-200 text-[#18314E] hover:text-[#A81B1B] transition-all cursor-pointer"
                        >
                          <HugeIcon icon={Delete02Icon} size={15} strokeWidth={2} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingRow)}
        onClose={() => !isDeleting && setDeletingRow(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Delivery Order"
        message={
          deletingRow
            ? `Apakah Anda yakin ingin menghapus dokumen pengiriman ${deletingRow.uniqueId} ke ${deletingRow.lapakNama}? Dokumen yang telah dihapus tidak dapat dipulihkan.`
            : ""
        }
        confirmLabel="Ya, Hapus Dokumen"
        cancelLabel="Batal"
        isLoading={isDeleting}
        isDestructive={true}
        icon={Delete02Icon}
      />
    </div>
  );
}
