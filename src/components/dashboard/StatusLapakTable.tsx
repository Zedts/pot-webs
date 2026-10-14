"use client";

import React, { useMemo } from "react";
import { useLayout } from "@/context/LayoutContext";
import { StatusLapakRow } from "@/services/dashboard.service";
import { ClosingStatusBadge } from "./ClosingStatusBadge";
import { formatRupiah } from "@/utils/shift.utils";

interface StatusLapakTableProps {
  rows: StatusLapakRow[];
  isLoading: boolean;
}

export function StatusLapakTable({ rows, isLoading }: StatusLapakTableProps) {
  const { searchTerm } = useLayout();

  // Real-time client-side search filtering by Lapak name or SPG name
  const filteredRows = useMemo(() => {
    if (!searchTerm || !searchTerm.trim()) {
      return rows;
    }
    const query = searchTerm.toLowerCase().trim();
    return rows.filter((r) => {
      const matchLapak = r.lapakNama.toLowerCase().includes(query);
      const matchSpg = r.spgNama.toLowerCase().includes(query);
      return matchLapak || matchSpg;
    });
  }, [rows, searchTerm]);

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-[#F3E7D8] overflow-hidden">
      {/* Table Section Header */}
      <div className="p-5 md:px-7 md:py-6 border-b border-[#F3E7D8] flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-[#18314E] tracking-tight">
            Status Lapak Hari Ini
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Monitoring presensi, penjualan, stok, dan closingan per lapak
          </p>
        </div>
        <div className="text-xs font-semibold text-[#6B7280]">
          Total: <span className="text-[#18314E] font-bold">{filteredRows.length} Lapak</span>
        </div>
      </div>

      {/* Table Responsive Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Table Header */}
          <thead>
            <tr className="bg-[#EFF4F9] text-[#475569] text-xs font-semibold tracking-wide border-b border-[#F3E7D8]">
              <th scope="col" className="py-3.5 px-6 font-bold">SPG</th>
              <th scope="col" className="py-3.5 px-6 font-bold">Lapak</th>
              <th scope="col" className="py-3.5 px-6 font-bold">Masuk</th>
              <th scope="col" className="py-3.5 px-6 font-bold">Pulang</th>
              <th scope="col" className="py-3.5 px-6 font-bold">Penjualan</th>
              <th scope="col" className="py-3.5 px-6 font-bold">Stok Akhir</th>
              <th scope="col" className="py-3.5 px-6 font-bold text-center">Status</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#F3E7D8] text-sm text-[#1E293B]">
            {isLoading ? (
              // Skeleton loading rows
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="py-4 px-6"><div className="h-4 bg-slate-200 rounded w-28"></div></td>
                  <td className="py-4 px-6"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                  <td className="py-4 px-6"><div className="h-4 bg-slate-100 rounded w-14"></div></td>
                  <td className="py-4 px-6"><div className="h-4 bg-slate-100 rounded w-14"></div></td>
                  <td className="py-4 px-6"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                  <td className="py-4 px-6"><div className="h-4 bg-slate-100 rounded w-10"></div></td>
                  <td className="py-4 px-6 text-center"><div className="h-6 bg-slate-200 rounded-full w-20 mx-auto"></div></td>
                </tr>
              ))
            ) : filteredRows.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <p className="text-sm font-semibold text-[#18314E]">
                      {searchTerm ? "Tidak ditemukan lapak yang sesuai pencarian" : "Belum ada data lapak untuk shift ini"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {searchTerm ? "Coba gunakan kata kunci pencarian yang lain." : "Data akan otomatis muncul saat staf mulai bertugas."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              // Active table rows
              filteredRows.map((row) => (
                <tr
                  key={row.lapakId}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  {/* SPG Name */}
                  <td className="py-4 px-6 font-medium text-slate-800">
                    <div className="flex flex-col">
                      <span>{row.spgNama}</span>
                      {row.spgUsername && row.spgUsername !== "-" && (
                        <span className="text-[11px] text-slate-400 font-normal">
                          @{row.spgUsername}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Lapak Name */}
                  <td className="py-4 px-6 text-slate-600 font-medium">
                    {row.lapakNama}
                  </td>

                  {/* Masuk */}
                  <td className="py-4 px-6 text-slate-600 font-mono text-xs">
                    {row.jamMasuk}
                  </td>

                  {/* Pulang */}
                  <td className="py-4 px-6 font-mono text-xs">
                    {row.jamPulang === "-" ? (
                      <span className="text-slate-400 font-bold">-</span>
                    ) : (
                      <span className="text-slate-600">{row.jamPulang}</span>
                    )}
                  </td>

                  {/* Penjualan */}
                  <td className="py-4 px-6 font-semibold text-slate-800">
                    {formatRupiah(row.totalPenjualan)}
                  </td>

                  {/* Stok Akhir */}
                  <td className="py-4 px-6 text-slate-600 font-medium">
                    {row.stokAkhir} pcs
                  </td>

                  {/* Closing Status Badge */}
                  <td className="py-4 px-6 text-center">
                    <ClosingStatusBadge status={row.closingStatus} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
