"use client";

import React, { useState, useMemo } from "react";
import { PengirimanTableRow, LapakSimple } from "@/types/pengiriman";
import { formatJakartaDate, formatJakartaTime } from "@/utils/shift.utils";
import { PengirimanStatusBadge } from "./PengirimanStatusBadge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { SearchableSelect, SelectOption } from "@/components/ui/SearchableSelect";
import { HugeIcon } from "@/components/ui/HugeIcon";
import {
  ViewIcon,
  Edit01Icon,
  Delete02Icon,
  PlusSignIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";

interface PengirimanTableProps {
  rows: PengirimanTableRow[];
  lapakList?: LapakSimple[];
  isLoading: boolean;
  canCreate?: boolean;
  canDelete?: boolean;
  onDelete?: (id: string) => Promise<void>;
  onCreate?: () => void;
  onEdit?: (row: PengirimanTableRow) => void;
  onPreview?: (row: PengirimanTableRow) => void;
}

export function PengirimanTable({
  rows,
  lapakList = [],
  isLoading,
  canCreate = true,
  canDelete = false,
  onDelete,
  onCreate,
  onEdit,
  onPreview,
}: PengirimanTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedLapak, setSelectedLapak] = useState<string>("all");
  const [deletingRow, setDeletingRow] = useState<PengirimanTableRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const statusOptions: SelectOption[] = [
    { value: "all", label: "Semua Status" },
    { value: "draft", label: "Draft" },
    { value: "dikirim_viar", label: "Dalam Perjalanan" },
    { value: "selesai", label: "Selesai" },
  ];

  const lapakOptions: SelectOption[] = [
    { value: "all", label: "Semua Outlet Lapak" },
    ...lapakList.map((l) => ({ value: l.id, label: l.nama })),
  ];

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const matchSearch =
        searchTerm === "" ||
        r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.uniqueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.lapakNama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.penerimaSpg.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        selectedStatus === "all" || r.status === selectedStatus;

      const matchLapak =
        selectedLapak === "all" || r.lapakId === selectedLapak;

      return matchSearch && matchStatus && matchLapak;
    });
  }, [rows, searchTerm, selectedStatus, selectedLapak]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const handleDeleteConfirm = async () => {
    if (!deletingRow || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(deletingRow.id);
      setDeletingRow(null);
    } catch {
      // Error handled upstream
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#F3E7D8] shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <HugeIcon icon={Search01Icon} size={18} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nomor DO, outlet, atau driver..."
              className="w-full pl-10 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E] transition-all"
            />
          </div>

          {/* Status Filter with SearchableSelect */}
          <div className="min-w-[160px]">
            <SearchableSelect
              options={statusOptions}
              value={selectedStatus}
              onChange={(val) => {
                setSelectedStatus(val);
                setCurrentPage(1);
              }}
              placeholder="Semua Status"
            />
          </div>

          {/* Lapak Filter with SearchableSelect */}
          <div className="min-w-[180px]">
            <SearchableSelect
              options={lapakOptions}
              value={selectedLapak}
              onChange={(val) => {
                setSelectedLapak(val);
                setCurrentPage(1);
              }}
              placeholder="Semua Outlet Lapak"
            />
          </div>
        </div>

        {/* Action Button: Create New Shipment */}
        {canCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="px-4 py-2 bg-[#A81B1B] hover:bg-[#8B1717] text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <HugeIcon icon={PlusSignIcon} size={16} />
            <span>Buat Pengiriman Baru</span>
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-[#F3E7D8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-[#18314E] text-white text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Nomor DO</th>
                <th className="px-5 py-3.5">Lapak Tujuan</th>
                <th className="px-5 py-3.5">Tanggal</th>
                <th className="px-5 py-3.5 text-center">Unit Kirim</th>
                <th className="px-5 py-3.5">Petugas / Penerima</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Memuat data pengiriman...
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada dokumen pengiriman yang sesuai filter.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">
                      {r.uniqueId}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {r.lapakNama}
                    </td>
                    <td className="px-5 py-4 text-xs">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">
                          {formatJakartaDate(r.tanggalRaw || r.waktuKirim)}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {formatJakartaTime(r.tanggalRaw || r.waktuKirim)} WIB
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center font-mono font-bold text-slate-900">
                      {r.qtyKirim} unit
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-700">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{r.penerimaSpg}</span>
                        {(r.penerimaUsername || r.penerimaNoHp) && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-normal mt-0.5">
                            {r.penerimaUsername && <span>@{r.penerimaUsername}</span>}
                            {r.penerimaUsername && r.penerimaNoHp && <span>•</span>}
                            {r.penerimaNoHp && <span>{r.penerimaNoHp}</span>}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <PengirimanStatusBadge status={r.status} />
                    </td>
                    {/* Action buttons ordered: 1. Preview, 2. Edit, 3. Delete */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1. Preview */}
                        <button
                          type="button"
                          onClick={() => onPreview?.(r)}
                          className="p-1.5 text-slate-500 hover:text-[#18314E] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Lihat Detail DO"
                        >
                          <HugeIcon icon={ViewIcon} size={16} />
                        </button>

                        {/* 2. Edit */}
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(r)}
                            className="p-1.5 text-slate-500 hover:text-[#18314E] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Pengiriman"
                          >
                            <HugeIcon icon={Edit01Icon} size={16} />
                          </button>
                        )}

                        {/* 3. Delete */}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeletingRow(r)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Dokumen DO"
                          >
                            <HugeIcon icon={Delete02Icon} size={16} />
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

        {/* Pagination & Count footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Menampilkan {filteredRows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{" "}
            {Math.min(currentPage * pageSize, filteredRows.length)} dari {filteredRows.length} pengiriman
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Sebelumnya
              </button>
              <span className="px-2 font-semibold text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingRow)}
        onClose={() => !isDeleting && setDeletingRow(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Dokumen Pengiriman"
        message={
          deletingRow
            ? `Apakah Anda yakin ingin menghapus surat jalan pengiriman ${deletingRow.uniqueId} untuk outlet ${deletingRow.lapakNama}?`
            : ""
        }
        confirmLabel="Ya, Hapus Pengiriman"
        cancelLabel="Batal"
        isLoading={isDeleting}
        isDestructive={true}
        icon={Delete02Icon}
      />
    </div>
  );
}
