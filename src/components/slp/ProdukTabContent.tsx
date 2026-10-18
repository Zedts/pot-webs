"use client";

import React, { useState, useMemo } from "react";
import {
  ProdukModel,
  KategoriModel,
  SatuanModel,
  CreateProdukPayload,
  UpdateProdukPayload,
  CreateKategoriPayload,
  UpdateKategoriPayload,
  CreateSatuanPayload,
  UpdateSatuanPayload,
} from "@/types/slp";
import { ProdukFormModal } from "./ProdukFormModal";
import { KategoriManageModal } from "./KategoriManageModal";
import { SatuanManageModal } from "./SatuanManageModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { showToast } from "@/lib/toast";
import { SearchableSelect, SelectOption } from "@/components/ui/SearchableSelect";
import { HugeIcon } from "@/components/ui/HugeIcon";
import {
  Search01Icon,
  PlusSignIcon,
  Edit01Icon,
  Delete02Icon,
  PackageIcon,
  Tag01Icon,
  Layers01Icon,
  Tick01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";

interface ProdukTabContentProps {
  rows: ProdukModel[];
  kategoriList: KategoriModel[];
  satuanList: SatuanModel[];
  isLoading: boolean;
  canManage: boolean;
  onCreateProduk: (payload: CreateProdukPayload) => Promise<void>;
  onUpdateProduk: (id: string, payload: UpdateProdukPayload) => Promise<void>;
  onToggleStatus: (id: string, currentStatus: string) => Promise<void>;
  onDeleteProduk: (id: string) => Promise<void>;
  onCreateKategori: (payload: CreateKategoriPayload) => Promise<void>;
  onUpdateKategori: (id: string, payload: UpdateKategoriPayload) => Promise<void>;
  onDeleteKategori: (id: string) => Promise<void>;
  onCreateSatuan: (payload: CreateSatuanPayload) => Promise<void>;
  onUpdateSatuan: (id: string, payload: UpdateSatuanPayload) => Promise<void>;
  onDeleteSatuan: (id: string) => Promise<void>;
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProdukTabContent({
  rows,
  kategoriList,
  satuanList,
  isLoading,
  canManage,
  onCreateProduk,
  onUpdateProduk,
  onToggleStatus,
  onDeleteProduk,
  onCreateKategori,
  onUpdateKategori,
  onDeleteKategori,
  onCreateSatuan,
  onUpdateSatuan,
  onDeleteSatuan,
}: ProdukTabContentProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduk, setEditingProduk] = useState<ProdukModel | null>(null);
  const [deletingProduk, setDeletingProduk] = useState<ProdukModel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isKategoriModalOpen, setIsKategoriModalOpen] = useState(false);
  const [isSatuanModalOpen, setIsSatuanModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const kategoriFilterOptions: SelectOption[] = [
    { value: "all", label: "Semua Kategori" },
    ...kategoriList.map((k) => ({ value: k.id, label: k.nama_kategori })),
  ];

  const statusFilterOptions: SelectOption[] = [
    { value: "all", label: "Semua Status" },
    { value: "active", label: "Aktif" },
    { value: "inactive", label: "Nonaktif" },
  ];

  const filteredRows = useMemo(() => {
    return rows.filter((p) => {
      // Search by name or category
      const matchesSearch =
        searchTerm.trim() === "" ||
        p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.nama_kategori && p.nama_kategori.toLowerCase().includes(searchTerm.toLowerCase()));

      // Category filter
      const matchesKategori =
        kategoriFilter === "all" || p.kategori_id === kategoriFilter;

      // Status filter
      const pStatus = (p.is_active || "").toLowerCase().trim();
      const isActiveItem = pStatus === "active" || pStatus === "aktif";
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isActiveItem) ||
        (statusFilter === "inactive" && !isActiveItem);

      return matchesSearch && matchesKategori && matchesStatus;
    });
  }, [rows, searchTerm, kategoriFilter, statusFilter]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const handleOpenCreate = () => {
    setEditingProduk(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: ProdukModel) => {
    setEditingProduk(p);
    setIsFormOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduk) return;
    try {
      setIsDeleting(true);
      await onDeleteProduk(deletingProduk.id);
      setDeletingProduk(null);
    } catch (err: unknown) {
      const apiErr = err as { userMessage?: string; message?: string };
      showToast.error(
        apiErr?.userMessage ||
          apiErr?.message ||
          "Gagal menghapus produk. Produk mungkin telah digunakan pada transaksi atau pengiriman."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Action Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#F3E7D8] shadow-sm">
        {/* Search & Filters */}
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
              placeholder="Cari produk..."
              className="w-full pl-10 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E] transition-all"
            />
          </div>

          {/* Kategori Filter with SearchableSelect */}
          <div className="min-w-[170px]">
            <SearchableSelect
              options={kategoriFilterOptions}
              value={kategoriFilter}
              onChange={(val) => {
                setKategoriFilter(val);
                setCurrentPage(1);
              }}
              placeholder="Semua Kategori"
            />
          </div>

          {/* Status Filter with SearchableSelect */}
          <div className="min-w-[150px]">
            <SearchableSelect
              options={statusFilterOptions}
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              placeholder="Semua Status"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          {canManage && (
            <>
              {/* Kelola Kategori */}
              <button
                type="button"
                onClick={() => setIsKategoriModalOpen(true)}
                className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <HugeIcon icon={Tag01Icon} size={16} />
                <span>Kategori</span>
                <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-xs font-bold">
                  {kategoriList.length}
                </span>
              </button>

              {/* Kelola Satuan */}
              <button
                type="button"
                onClick={() => setIsSatuanModalOpen(true)}
                className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <HugeIcon icon={Layers01Icon} size={16} />
                <span>Satuan</span>
                <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-xs font-bold">
                  {satuanList.length}
                </span>
              </button>

              {/* Tambah Produk */}
              <button
                type="button"
                onClick={handleOpenCreate}
                className="px-3.5 py-2 bg-[#A81B1B] hover:bg-[#8B1717] text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <HugeIcon icon={PlusSignIcon} size={16} />
                <span>Tambah Produk</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-[#F3E7D8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-[#18314E] text-white text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Nama Produk</th>
                <th className="px-5 py-3.5">Kategori</th>
                <th className="px-5 py-3.5">Satuan</th>
                <th className="px-5 py-3.5">Harga Satuan</th>
                <th className="px-5 py-3.5">Status</th>
                {canManage && <th className="px-5 py-3.5 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="py-12 text-center text-slate-400">
                    Memuat data produk...
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="py-12 text-center text-slate-400">
                    Tidak ada data produk yang sesuai filter.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((p) => {
                  const stat = (p.is_active || "").toLowerCase().trim();
                  const isItemActive = stat === "active" || stat === "aktif";
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Nama Produk */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#18314E]/5 text-[#18314E] rounded-xl">
                            <HugeIcon icon={PackageIcon} size={18} />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{p.nama}</div>
                            <div className="text-xs text-slate-400 font-mono">ID: {p.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Kategori */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FDF6EE] text-[#18314E] border border-[#F3E7D8]">
                          <HugeIcon icon={Tag01Icon} size={12} />
                          {p.nama_kategori || "-"}
                        </span>
                      </td>

                      {/* Satuan */}
                      <td className="px-5 py-4">
                        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                          {p.jenis_satuan || "-"}
                        </span>
                      </td>

                      {/* Harga Satuan */}
                      <td className="px-5 py-4 font-mono font-semibold text-slate-900">
                        {formatRupiah(p.harga || 0)}
                      </td>

                      {/* Status Toggle */}
                      <td className="px-5 py-4">
                        {canManage ? (
                          <button
                            type="button"
                            onClick={() => onToggleStatus(p.id, p.is_active)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                              isItemActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                            }`}
                            title="Klik untuk mengubah status aktif/nonaktif"
                          >
                            <HugeIcon
                              icon={isItemActive ? Tick01Icon : Cancel01Icon}
                              size={13}
                            />
                            <span>{isItemActive ? "Aktif" : "Nonaktif"}</span>
                          </button>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              isItemActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            <HugeIcon
                              icon={isItemActive ? Tick01Icon : Cancel01Icon}
                              size={13}
                            />
                            <span>{isItemActive ? "Aktif" : "Nonaktif"}</span>
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      {canManage && (
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 text-slate-500 hover:text-[#18314E] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Ubah Produk"
                            >
                              <HugeIcon icon={Edit01Icon} size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingProduk(p)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Produk"
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

        {/* Pagination & Count footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Menampilkan {filteredRows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{" "}
            {Math.min(currentPage * pageSize, filteredRows.length)} dari {filteredRows.length} produk
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

      {/* Modals */}
      <ProdukFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={editingProduk}
        kategoriList={kategoriList}
        satuanList={satuanList}
        onSubmitCreate={onCreateProduk}
        onSubmitUpdate={onUpdateProduk}
      />

      <KategoriManageModal
        isOpen={isKategoriModalOpen}
        onClose={() => setIsKategoriModalOpen(false)}
        kategoriList={kategoriList}
        onCreate={onCreateKategori}
        onUpdate={onUpdateKategori}
        onDelete={onDeleteKategori}
      />

      <SatuanManageModal
        isOpen={isSatuanModalOpen}
        onClose={() => setIsSatuanModalOpen(false)}
        satuanList={satuanList}
        onCreate={onCreateSatuan}
        onUpdate={onUpdateSatuan}
        onDelete={onDeleteSatuan}
      />

      <ConfirmModal
        isOpen={Boolean(deletingProduk)}
        onClose={() => !isDeleting && setDeletingProduk(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Produk Master"
        message={
          deletingProduk
            ? `Apakah Anda yakin ingin menghapus produk "${deletingProduk.nama}"? Produk yang sudah terhubung dengan pencatatan stok atau riwayat pengiriman tidak dapat dihapus.`
            : ""
        }
        confirmLabel="Ya, Hapus Produk"
        cancelLabel="Batal"
        isLoading={isDeleting}
        isDestructive={true}
        icon={Delete02Icon}
      />
    </div>
  );
}
