"use client";

import React, { useState, useMemo } from "react";
import { PenjualanTableRow } from "@/types/penjualan";
import { LapakModel } from "@/types/slp";
import {
  formatJakartaDate,
  formatJakartaTime,
  formatRupiah,
  getJakartaDateString,
} from "@/utils/shift.utils";
import { PenjualanPaymentBadge } from "./PenjualanPaymentBadge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { SearchableSelect, SelectOption } from "@/components/ui/SearchableSelect";
import { HugeIcon } from "@/components/ui/HugeIcon";
import {
  ViewIcon,
  Edit01Icon,
  Delete02Icon,
  Search01Icon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons";

interface PenjualanTableProps {
  rows: PenjualanTableRow[];
  lapakList?: LapakModel[];
  isLoading: boolean;
  canManage?: boolean;
  currentDate?: string;
  onPreview?: (row: PenjualanTableRow) => void;
  onEdit?: (row: PenjualanTableRow) => void;
  onDelete?: (id: string) => Promise<void>;
}

export function PenjualanTable({
  rows,
  lapakList = [],
  isLoading,
  canManage = false,
  currentDate,
  onPreview,
  onEdit,
  onDelete,
}: PenjualanTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLapak, setSelectedLapak] = useState<string>("all");
  const [selectedMetode, setSelectedMetode] = useState<string>("all");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("all"); // 'all' | 'today' | 'custom'
  const [customDate, setCustomDate] = useState<string>("");

  const [deletingRow, setDeletingRow] = useState<PenjualanTableRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Filter Options
  const lapakOptions: SelectOption[] = useMemo(
    () => [
      { value: "all", label: "Semua Outlet Lapak" },
      ...lapakList.map((l) => ({ value: l.id, label: l.nama })),
    ],
    [lapakList]
  );

  const metodeOptions: SelectOption[] = [
    { value: "all", label: "Semua Metode Bayar" },
    { value: "tunai", label: "Tunai" },
    { value: "qris", label: "QRIS" },
    { value: "transfer", label: "Transfer Bank" },
  ];

  const dateFilterOptions: SelectOption[] = [
    { value: "all", label: "Semua Tanggal" },
    { value: "today", label: "Hari Ini" },
    { value: "custom", label: "Pilih Tanggal..." },
  ];

  // Filtering Logic
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      // 1. Text Search matching lapak, SPG, ID, notes, or payment method
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        term === "" ||
        r.id.toLowerCase().includes(term) ||
        r.lapakNama.toLowerCase().includes(term) ||
        r.spgNama.toLowerCase().includes(term) ||
        (r.spgUsername && r.spgUsername.toLowerCase().includes(term)) ||
        (r.catatan && r.catatan.toLowerCase().includes(term)) ||
        r.metodePembayaran.toLowerCase().includes(term);

      // 2. Lapak Filter
      const matchLapak =
        selectedLapak === "all" || r.lapakId === selectedLapak;

      // 3. Payment Method Filter
      const matchMetode =
        selectedMetode === "all" || r.metodePembayaran === selectedMetode;

      // 4. Date Filter
      let matchDate = true;
      if (selectedDateFilter === "today") {
        if (!currentDate) {
          matchDate = true;
        } else {
          try {
            const rowDateStr = r.tanggalRaw
              ? getJakartaDateString(new Date(r.tanggalRaw))
              : "";
            matchDate = rowDateStr === currentDate;
          } catch {
            matchDate = false;
          }
        }
      } else if (selectedDateFilter === "custom" && customDate) {
        try {
          const rowDateStr = r.tanggalRaw
            ? getJakartaDateString(new Date(r.tanggalRaw))
            : "";
          matchDate = rowDateStr === customDate;
        } catch {
          matchDate = false;
        }
      }

      return matchSearch && matchLapak && matchMetode && matchDate;
    });
  }, [
    rows,
    searchTerm,
    selectedLapak,
    selectedMetode,
    selectedDateFilter,
    customDate,
    currentDate,
  ]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingRow || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(deletingRow.id);
      setDeletingRow(null);
    } catch {
      // Upstream service handles toast notifications
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#F3E7D8] shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 flex-wrap">
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
              placeholder="Cari outlet, nama SPG, atau catatan..."
              className="w-full pl-10 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E] transition-all"
            />
          </div>

          {/* Lapak Filter */}
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

          {/* Metode Pembayaran Filter */}
          <div className="min-w-[160px]">
            <SearchableSelect
              options={metodeOptions}
              value={selectedMetode}
              onChange={(val) => {
                setSelectedMetode(val);
                setCurrentPage(1);
              }}
              placeholder="Semua Metode Bayar"
            />
          </div>

          {/* Tanggal Filter Dropdown */}
          <div className="min-w-[150px]">
            <SearchableSelect
              options={dateFilterOptions}
              value={selectedDateFilter}
              onChange={(val) => {
                setSelectedDateFilter(val);
                setCurrentPage(1);
              }}
              placeholder="Filter Tanggal"
            />
          </div>

          {/* Custom Date Input (when 'custom' is picked) */}
          {selectedDateFilter === "custom" && (
            <div className="relative min-w-[140px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <HugeIcon icon={Calendar03Icon} size={16} />
              </span>
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-2.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E] font-medium text-slate-700"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-[#F3E7D8] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-[#18314E] text-white text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Outlet Lapak</th>
                <th className="px-5 py-3.5">Petugas SPG</th>
                <th className="px-5 py-3.5">Tanggal & Waktu</th>
                <th className="px-5 py-3.5">Metode Pembayaran</th>
                <th className="px-5 py-3.5 text-right">Total Transaksi</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Memuat data transaksi penjualan...
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ada data transaksi penjualan yang sesuai filter.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* 1. Outlet Lapak */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-sm">
                          {row.lapakNama}
                        </span>
                        {row.lapakLokasi && (
                          <span className="text-xs text-slate-400 font-medium truncate max-w-[220px]">
                            {row.lapakLokasi}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. Petugas SPG */}
                    <td className="px-5 py-4 text-xs">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">
                          {row.spgNama}
                        </span>
                        {(row.spgUsername || row.spgNoHp) && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-normal mt-0.5">
                            {row.spgUsername && <span>@{row.spgUsername}</span>}
                            {row.spgUsername && row.spgNoHp && <span>•</span>}
                            {row.spgNoHp && <span>{row.spgNoHp}</span>}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 3. Tanggal & Waktu */}
                    <td className="px-5 py-4 text-xs">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">
                          {formatJakartaDate(row.tanggalRaw)}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {formatJakartaTime(row.tanggalRaw)} WIB
                        </span>
                      </div>
                    </td>

                    {/* 4. Metode Pembayaran */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <PenjualanPaymentBadge method={row.metodePembayaran} />
                        {Boolean(row.kembalianDisimpan && row.kembalianDisimpan > 0) && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-[#E67E22] border border-amber-200">
                            Simpan: {formatRupiah(row.kembalianDisimpan!)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 5. Total Transaksi */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {formatRupiah(row.totalHarga)}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {row.totalItemsCount} item
                        </span>
                      </div>
                    </td>

                    {/* 6. Action buttons: Preview (get by id), Edit, Delete */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Action 1: Preview (Get by ID) */}
                        <button
                          type="button"
                          onClick={() => onPreview?.(row)}
                          className="p-1.5 text-slate-500 hover:text-[#18314E] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Lihat Detail Transaksi"
                        >
                          <HugeIcon icon={ViewIcon} size={16} />
                        </button>

                        {/* Action 2: Edit */}
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => onEdit?.(row)}
                            className="p-1.5 text-slate-500 hover:text-[#18314E] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Transaksi"
                          >
                            <HugeIcon icon={Edit01Icon} size={16} />
                          </button>
                        )}

                        {/* Action 3: Delete */}
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => setDeletingRow(row)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Transaksi (Rollback Stok)"
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
            Menampilkan{" "}
            {filteredRows.length > 0
              ? (currentPage - 1) * pageSize + 1
              : 0}{" "}
            - {Math.min(currentPage * pageSize, filteredRows.length)} dari{" "}
            {filteredRows.length} transaksi penjualan
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
        title="Hapus Transaksi Penjualan"
        message={
          deletingRow
            ? `Apakah Anda yakin ingin menghapus transaksi penjualan sebesar ${formatRupiah(
                deletingRow.totalHarga
              )} di outlet ${deletingRow.lapakNama}? Stok produk yang terjual akan dikembalikan (rollback) ke inventaris lapak secara otomatis.`
            : ""
        }
        confirmLabel="Ya, Hapus Penjualan"
        cancelLabel="Batal"
        isLoading={isDeleting}
        isDestructive={true}
        icon={Delete02Icon}
      />
    </div>
  );
}
