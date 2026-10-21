"use client";

import React, { useState, useMemo } from "react";
import { StokLapakModel, LapakModel, ProdukModel } from "@/types/slp";
import { StokLapakFormModal } from "./StokLapakFormModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { SearchableSelect, SelectOption } from "@/components/ui/SearchableSelect";
import { formatRupiah } from "@/utils/shift.utils";
import { HugeIcon } from "@/components/ui/HugeIcon";
import {
  PlusSignIcon,
  Search01Icon,
  Edit01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";

interface StokLapakTabContentProps {
  rows: StokLapakModel[];
  lapakList: LapakModel[];
  produkList: ProdukModel[];
  isLoading: boolean;
  canManage: boolean;
  onRefresh?: () => Promise<void>;
  onCreate: (payload: any) => Promise<void>;
  onUpdate: (id: string, payload: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function StokLapakTabContent({
  rows,
  lapakList,
  produkList,
  isLoading,
  canManage,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete,
}: StokLapakTabContentProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLapak, setSelectedLapak] = useState("all");
  const [stockCondition, setStockCondition] = useState("all");

  // Modals state
  const [formModal, setFormModal] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    stokItem?: StokLapakModel;
  }>({ isOpen: false, mode: "create" });

  const [deletingItem, setDeletingItem] = useState<StokLapakModel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Lapak filter options
  const lapakFilterOptions: SelectOption[] = [
    { value: "all", label: "Semua Outlet Lapak" },
    ...lapakList.map((l) => ({ value: l.id, label: l.nama })),
  ];

  // Condition filter options
  const conditionFilterOptions: SelectOption[] = [
    { value: "all", label: "Semua Kondisi Stok" },
    { value: "aman", label: "Stok Aman (> 5)" },
    { value: "kritis", label: "Stok Kritis (1 - 5)" },
    { value: "habis", label: "Stok Habis (0)" },
  ];

  // Filtering
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      // 1. Lapak filter
      if (selectedLapak !== "all" && row.lapak_id !== selectedLapak) {
        return false;
      }

      // 2. Condition filter
      const balance = Number(row.stok_akhir) || 0;
      if (stockCondition === "habis" && balance > 0) return false;
      if (stockCondition === "kritis" && (balance <= 0 || balance > 5)) return false;
      if (stockCondition === "aman" && balance <= 5) return false;

      // 3. Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchProduk = row.produk?.nama?.toLowerCase().includes(q);
        const matchKategori = row.produk?.nama_kategori?.toLowerCase().includes(q);
        const matchLapak = row.lapak?.nama?.toLowerCase().includes(q);
        return matchProduk || matchKategori || matchLapak;
      }

      return true;
    });
  }, [rows, selectedLapak, stockCondition, searchTerm]);

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await onDelete(deletingItem.id);
      setDeletingItem(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Top Filter and Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-2xl border border-[#F3E7D8] shadow-sm">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <HugeIcon icon={Search01Icon} size={16} strokeWidth={2} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari varian produk atau kategori..."
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

          {/* Lapak Filter with SearchableSelect */}
          <div className="min-w-[180px]">
            <SearchableSelect
              options={lapakFilterOptions}
              value={selectedLapak}
              onChange={setSelectedLapak}
              placeholder="Semua Outlet Lapak"
            />
          </div>

          {/* Condition Filter with SearchableSelect */}
          <div className="min-w-[170px]">
            <SearchableSelect
              options={conditionFilterOptions}
              value={stockCondition}
              onChange={setStockCondition}
              placeholder="Semua Kondisi Stok"
            />
          </div>
        </div>

        {/* Action Button: Inisialisasi Stok Produk */}
        {canManage && (
          <button
            type="button"
            onClick={() => setFormModal({ isOpen: true, mode: "create" })}
            className="px-4 py-2 bg-[#A81B1B] hover:bg-[#8B1717] text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <HugeIcon icon={PlusSignIcon} size={16} />
            <span>Inisialisasi Stok Produk</span>
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-[#F3E7D8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-[#18314E] text-white text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th scope="col" className="px-5 py-3.5">Produk</th>
                <th scope="col" className="px-5 py-3.5">Outlet Lapak</th>
                <th scope="col" className="px-5 py-3.5 text-right">Harga</th>
                <th scope="col" className="px-5 py-3.5 text-center">Stok Awal</th>
                <th scope="col" className="px-5 py-3.5 text-center">Masuk</th>
                <th scope="col" className="px-5 py-3.5 text-center">Terjual</th>
                <th scope="col" className="px-5 py-3.5 text-center">Transfer</th>
                <th scope="col" className="px-5 py-3.5 text-center">Stok Akhir</th>
                <th scope="col" className="px-5 py-3.5 text-center">Status</th>
                {canManage && <th scope="col" className="px-5 py-3.5 text-right">Aksi</th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                    <td className="px-5 py-4 text-right"><div className="h-4 bg-slate-100 rounded w-16 ml-auto" /></td>
                    <td className="px-5 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-10 mx-auto" /></td>
                    <td className="px-5 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-10 mx-auto" /></td>
                    <td className="px-5 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-10 mx-auto" /></td>
                    <td className="px-5 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-10 mx-auto" /></td>
                    <td className="px-5 py-4 text-center"><div className="h-4 bg-slate-200 rounded w-12 mx-auto" /></td>
                    <td className="px-5 py-4 text-center"><div className="h-6 bg-slate-200 rounded-full w-20 mx-auto" /></td>
                    {canManage && <td className="px-5 py-4 text-right"><div className="h-8 bg-slate-200 rounded-xl w-20 ml-auto" /></td>}
                  </tr>
                ))
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 10 : 9} className="py-12 text-center text-slate-400">
                    Tidak ada pencatatan stok yang sesuai filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const balance = Number(row.stok_akhir) || 0;
                  const isHabis = balance <= 0;
                  const isKritis = balance > 0 && balance <= 5;

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Produk */}
                      <td className="px-5 py-4 font-medium text-slate-800">
                        <div>
                          <span className="font-bold text-slate-900">{row.produk?.nama || "Produk"}</span>
                          {row.produk?.nama_kategori && (
                            <span className="text-xs text-slate-400 block mt-0.5">
                              {row.produk.nama_kategori}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Lapak */}
                      <td className="px-5 py-4 font-medium text-slate-700">
                        {row.lapak?.nama || "-"}
                      </td>

                      {/* Harga Satuan */}
                      <td className="px-5 py-4 text-right font-mono font-medium text-slate-700">
                        {formatRupiah(row.produk?.harga || 0)}
                      </td>

                      {/* Stok Awal */}
                      <td className="px-5 py-4 text-center font-mono text-xs text-slate-600">
                        {row.stok_awal ?? 0}
                      </td>

                      {/* Masuk */}
                      <td className="px-5 py-4 text-center font-mono text-xs text-emerald-600 font-semibold">
                        +{row.stok_masuk ?? 0}
                      </td>

                      {/* Terjual */}
                      <td className="px-5 py-4 text-center font-mono text-xs text-amber-600 font-semibold">
                        -{row.stok_terjual ?? 0}
                      </td>

                      {/* Transfer */}
                      <td className="px-5 py-4 text-center font-mono text-xs text-rose-600 font-semibold">
                        -{row.stok_transfer ?? 0}
                      </td>

                      {/* Stok Akhir */}
                      <td className="px-5 py-4 text-center font-mono font-bold text-slate-900">
                        {balance}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            isHabis
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : isKritis
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {isHabis ? "Habis (0)" : isKritis ? "Kritis" : "Aman"}
                        </span>
                      </td>

                      {/* Aksi */}
                      {canManage && (
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => setFormModal({ isOpen: true, mode: "edit", stokItem: row })}
                              title="Koreksi Saldo Stok"
                              aria-label="Koreksi Saldo Stok"
                              className="p-1.5 text-slate-500 hover:text-[#18314E] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <HugeIcon icon={Edit01Icon} size={16} />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setDeletingItem(row)}
                              title="Hapus Catatan Stok"
                              aria-label="Hapus Catatan Stok"
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <HugeIcon icon={Delete02Icon} size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Standard Table Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan {filteredRows.length} dari {rows.length} catatan stok</span>
        </div>
      </div>

      {/* Form Modal */}
      <StokLapakFormModal
        isOpen={formModal.isOpen}
        initialData={formModal.stokItem}
        lapakList={lapakList}
        produkList={produkList}
        onClose={() => setFormModal({ isOpen: false, mode: "create" })}
        onSubmit={async (payload) => {
          if (formModal.mode === "create") {
            await onCreate(payload);
          } else if (formModal.stokItem) {
            await onUpdate(formModal.stokItem.id, payload);
          }
          if (onRefresh) await onRefresh();
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingItem)}
        onClose={() => !isDeleting && setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Catatan Stok"
        message={
          deletingItem
            ? `Apakah Anda yakin ingin menghapus catatan stok untuk produk "${deletingItem.produk?.nama || "Produk"}" di outlet "${deletingItem.lapak?.nama || "Lapak"}"?`
            : ""
        }
        confirmLabel="Ya, Hapus Stok"
        cancelLabel="Batal"
        isLoading={isDeleting}
        isDestructive={true}
        icon={Delete02Icon}
      />
    </div>
  );
}
