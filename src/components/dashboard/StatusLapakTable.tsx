"use client";

import React, { useState, useMemo } from "react";
import { StatusLapakRow } from "@/services/dashboard.service";
import { ClosingStatusBadge } from "./ClosingStatusBadge";
import { formatRupiah } from "@/utils/shift.utils";
import { SearchableSelect, SelectOption } from "@/components/ui/SearchableSelect";
import { ShiftBadge } from "@/components/ui/ShiftBadge";
import { useLayout } from "@/context/LayoutContext";
import { HugeIcon } from "@/components/ui/HugeIcon";
import { Search01Icon } from "@hugeicons/core-free-icons";

interface StatusLapakTableProps {
  rows: StatusLapakRow[];
  isLoading: boolean;
}

const statusClosingOptions: SelectOption[] = [
  { value: "all", label: "Semua Status Closing" },
  { value: "belum_closing", label: "Belum Closing" },
  { value: "closing_valid", label: "Closing Valid" },
  { value: "perlu_review", label: "Perlu Review" },
];

const shiftFilterOptions: SelectOption[] = [
  { value: "all", label: "Semua Shift" },
  { value: "pagi", label: "Shift Pagi" },
  { value: "siang", label: "Shift Siang" },
  { value: "unassigned", label: "Belum Ada Shift" },
];

export function StatusLapakTable({ rows, isLoading }: StatusLapakTableProps) {
  const { activeShift, setActiveShift } = useLayout();
  const [searchTerm, setSearchTerm] = useState("");
  const [closingFilter, setClosingFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState<string>(activeShift || "all");

  const handleShiftChange = (val: string) => {
    setShiftFilter(val);
    if (val === "pagi" || val === "siang" || val === "all") {
      setActiveShift(val);
    }
  };

  // Real-time client-side search, closing status, and shift filtering
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      // 1. Search query filter
      const query = searchTerm.toLowerCase().trim();
      const matchSearch =
        !query ||
        r.lapakNama.toLowerCase().includes(query) ||
        r.spgNama.toLowerCase().includes(query) ||
        (r.spgUsername && r.spgUsername.toLowerCase().includes(query)) ||
        (r.spgShift && r.spgShift.toLowerCase().includes(query));

      // 2. Closing status filter
      const matchClosing =
        closingFilter === "all" || r.closingStatus === closingFilter;

      // 3. Shift filter
      const matchShift =
        shiftFilter === "all"
          ? true
          : shiftFilter === "unassigned"
          ? !r.spgShift
          : (r.spgShift || "").toLowerCase() === shiftFilter;

      return matchSearch && matchClosing && matchShift;
    });
  }, [rows, searchTerm, closingFilter, shiftFilter]);

  return (
    <div className="space-y-3">
      {/* Top Filter and Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-2xl border border-[#F3E7D8] shadow-sm">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <HugeIcon icon={Search01Icon} size={16} strokeWidth={2} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari lapak atau SPG..."
              className="w-full pl-9 pr-8 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E] transition-all font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Closing Status Filter with SearchableSelect */}
          <div className="min-w-[180px]">
            <SearchableSelect
              options={statusClosingOptions}
              value={closingFilter}
              onChange={setClosingFilter}
              placeholder="Semua Status Closing"
            />
          </div>

          {/* Shift Filter with SearchableSelect */}
          <div className="min-w-[150px]">
            <SearchableSelect
              options={shiftFilterOptions}
              value={shiftFilter}
              onChange={handleShiftChange}
              placeholder="Semua Shift"
            />
          </div>
        </div>

        <div className="text-xs font-semibold text-[#6B7280] shrink-0 self-end sm:self-center">
          Total: <span className="text-[#18314E] font-bold">{filteredRows.length} Lapak</span>
        </div>
      </div>

      {/* Table Responsive Container */}
      <div className="bg-white rounded-2xl border border-[#F3E7D8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            {/* Table Header */}
            <thead className="bg-[#18314E] text-white text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th scope="col" className="px-5 py-3.5">SPG</th>
                <th scope="col" className="px-5 py-3.5">Shift Kerja</th>
                <th scope="col" className="px-5 py-3.5">Lapak</th>
                <th scope="col" className="px-5 py-3.5">Masuk</th>
                <th scope="col" className="px-5 py-3.5">Pulang</th>
                <th scope="col" className="px-5 py-3.5">Penjualan</th>
                <th scope="col" className="px-5 py-3.5">Stok Akhir</th>
                <th scope="col" className="px-5 py-3.5 text-center">Status Closing</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                // Skeleton loading rows
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-28"></div></td>
                    <td className="px-5 py-4"><div className="h-5 bg-slate-100 rounded-lg w-24"></div></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded w-14"></div></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded w-14"></div></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded w-10"></div></td>
                    <td className="px-5 py-4 text-center"><div className="h-6 bg-slate-200 rounded-full w-20 mx-auto"></div></td>
                  </tr>
                ))
              ) : filteredRows.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <p className="text-sm font-semibold text-[#18314E]">
                        {searchTerm || closingFilter !== "all" || shiftFilter !== "all"
                          ? "Tidak ditemukan lapak yang sesuai filter pencarian"
                          : "Belum ada data lapak"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {searchTerm || closingFilter !== "all" || shiftFilter !== "all"
                          ? "Coba gunakan kata kunci atau filter status yang lain."
                          : "Data akan otomatis muncul saat staf mulai bertugas."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Active table rows
                filteredRows.map((row) => (
                  <tr
                    key={row.lapakId}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* SPG Name */}
                    <td className="px-5 py-4 font-medium text-slate-800">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{row.spgNama}</span>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-normal mt-0.5">
                          {row.spgUsername && row.spgUsername !== "-" && (
                            <span>@{row.spgUsername}</span>
                          )}
                          {row.spgUsername && row.spgUsername !== "-" && row.spgNoHp && (
                            <span>•</span>
                          )}
                          {row.spgNoHp && <span>{row.spgNoHp}</span>}
                        </div>
                      </div>
                    </td>

                    {/* Shift Kerja */}
                    <td className="px-5 py-4 font-mono text-xs">
                      <ShiftBadge shift={row.spgShift} lapak={row.rawLapak} />
                    </td>

                    {/* Lapak Name */}
                    <td className="px-5 py-4 text-slate-700 font-medium">
                      {row.lapakNama}
                    </td>

                    {/* Masuk */}
                    <td className="px-5 py-4 text-slate-600 font-mono text-xs">
                      {row.jamMasuk}
                    </td>

                    {/* Pulang */}
                    <td className="px-5 py-4 font-mono text-xs">
                      {row.jamPulang === "-" ? (
                        <span className="text-slate-400 font-bold">-</span>
                      ) : (
                        <span className="text-slate-600">{row.jamPulang}</span>
                      )}
                    </td>

                    {/* Penjualan */}
                    <td className="px-5 py-4 font-semibold text-slate-800 font-mono">
                      {formatRupiah(row.totalPenjualan)}
                    </td>

                    {/* Stok Akhir */}
                    <td className="px-5 py-4 text-slate-700 font-medium">
                      {row.stokAkhir} pcs
                    </td>

                    {/* Closing Status Badge */}
                    <td className="px-5 py-4 text-center">
                      <ClosingStatusBadge status={row.closingStatus} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Standard Table Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan {filteredRows.length} dari {rows.length} outlet lapak</span>
        </div>
      </div>
    </div>
  );
}
