"use client";

import React, { useState, useMemo, useEffect } from "react";
import { KategoriModel, CreateKategoriPayload, UpdateKategoriPayload } from "@/types/slp";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { HugeIcon } from "@/components/ui/HugeIcon";
import {
  Cancel01Icon,
  PlusSignIcon,
  Edit01Icon,
  Delete02Icon,
  Tick01Icon,
  Tag01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";

interface KategoriManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  kategoriList: KategoriModel[];
  onCreate: (payload: CreateKategoriPayload) => Promise<void>;
  onUpdate: (id: string, payload: UpdateKategoriPayload) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function KategoriManageModal({
  isOpen,
  onClose,
  kategoriList,
  onCreate,
  onUpdate,
  onDelete,
}: KategoriManageModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [newKategori, setNewKategori] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setError(null);
    }
  }, [isOpen]);

  // Deletion confirm modal state
  const [deletingKategori, setDeletingKategori] = useState<KategoriModel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter kategori list based on search query
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return kategoriList;
    const q = searchQuery.toLowerCase().trim();
    return kategoriList.filter((k) =>
      k.nama_kategori.toLowerCase().includes(q)
    );
  }, [kategoriList, searchQuery]);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKategori.trim()) {
      setError("Nama kategori wajib diisi.");
      return;
    }
    if (newKategori.trim().length < 2) {
      setError("Nama kategori minimal 2 karakter.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onCreate({ nama_kategori: newKategori.trim() });
      setNewKategori("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menambahkan kategori.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (kat: KategoriModel) => {
    setEditingId(kat.id);
    setEditingName(kat.nama_kategori);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim()) {
      setError("Nama kategori tidak boleh kosong.");
      return;
    }
    if (editingName.trim().length < 2) {
      setError("Nama kategori minimal 2 karakter.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onUpdate(id, { nama_kategori: editingName.trim() });
      setEditingId(null);
      setEditingName("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui kategori.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingKategori) return;
    try {
      setIsDeleting(true);
      await onDelete(deletingKategori.id);
      setDeletingKategori(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus kategori. Kategori mungkin sedang digunakan oleh produk.";
      setError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#18314E] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <HugeIcon icon={Tag01Icon} size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold">Kelola Kategori Produk</h2>
              <p className="text-xs text-white/70">Tambah, ubah, atau hapus kategori untuk katalog produk</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <HugeIcon icon={Cancel01Icon} size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <span className="font-semibold">Perhatian:</span>
              <span>{error}</span>
            </div>
          )}

          {/* Add Category Form */}
          <form onSubmit={handleCreate} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Tambah Kategori Baru
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newKategori}
                onChange={(e) => setNewKategori(e.target.value)}
                placeholder="Contoh: Makanan Ringan, Minuman"
                disabled={isSubmitting}
                className="flex-1 px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E] transition-all disabled:bg-slate-50"
              />
              <button
                type="submit"
                disabled={isSubmitting || !newKategori.trim()}
                className="px-4 py-2.5 bg-[#A81B1B] hover:bg-[#8B1717] text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HugeIcon icon={PlusSignIcon} size={16} />
                <span>Tambah</span>
              </button>
            </div>
          </form>

          {/* Category List */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Daftar Kategori Terdaftar ({filteredList.length})
              </span>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <HugeIcon icon={Search01Icon} size={15} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kategori produk..."
                className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Hapus pencarian"
                >
                  <HugeIcon icon={Cancel01Icon} size={14} />
                </button>
              )}
            </div>

            {filteredList.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                {searchQuery.trim()
                  ? `Tidak ada kategori yang cocok dengan "${searchQuery}".`
                  : "Belum ada kategori yang ditambahkan."}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                {filteredList.map((kat) => (
                  <div
                    key={kat.id}
                    className="p-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
                  >
                    {editingId === kat.id ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#18314E]"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(kat.id)}
                          disabled={isSubmitting}
                          className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                          title="Simpan"
                        >
                          <HugeIcon icon={Tick01Icon} size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                          title="Batal"
                        >
                          <HugeIcon icon={Cancel01Icon} size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#18314E]/60" />
                          <span className="text-sm font-medium text-slate-800">
                            {kat.nama_kategori}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(kat)}
                            className="p-1.5 text-slate-400 hover:text-[#18314E] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Ubah nama kategori"
                          >
                            <HugeIcon icon={Edit01Icon} size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingKategori(kat)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus kategori"
                          >
                            <HugeIcon icon={Delete02Icon} size={15} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Reusable ConfirmModal for Kategori Deletion */}
      <ConfirmModal
        isOpen={Boolean(deletingKategori)}
        onClose={() => !isDeleting && setDeletingKategori(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Kategori Produk"
        message={
          deletingKategori
            ? `Apakah Anda yakin ingin menghapus kategori "${deletingKategori.nama_kategori}"? Kategori yang masih digunakan oleh produk aktif tidak dapat dihapus.`
            : ""
        }
        confirmLabel="Ya, Hapus Kategori"
        cancelLabel="Batal"
        isLoading={isDeleting}
        isDestructive={true}
        icon={Delete02Icon}
      />
    </div>
  );
}
