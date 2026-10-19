"use client";

import React, { useState, useMemo, useEffect } from "react";
import { SatuanModel, CreateSatuanPayload, UpdateSatuanPayload } from "@/types/slp";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { HugeIcon } from "@/components/ui/HugeIcon";
import {
  Cancel01Icon,
  PlusSignIcon,
  Edit01Icon,
  Delete02Icon,
  Tick01Icon,
  Layers01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";

interface SatuanManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  satuanList: SatuanModel[];
  onCreate: (payload: CreateSatuanPayload) => Promise<void>;
  onUpdate: (id: string, payload: UpdateSatuanPayload) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function SatuanManageModal({
  isOpen,
  onClose,
  satuanList,
  onCreate,
  onUpdate,
  onDelete,
}: SatuanManageModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [newSatuan, setNewSatuan] = useState("");
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
  const [deletingSatuan, setDeletingSatuan] = useState<SatuanModel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter satuan list based on search query
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return satuanList;
    const q = searchQuery.toLowerCase().trim();
    return satuanList.filter((s) =>
      s.jenis_satuan.toLowerCase().includes(q)
    );
  }, [satuanList, searchQuery]);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSatuan.trim()) {
      setError("Jenis satuan wajib diisi.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onCreate({ jenis_satuan: newSatuan.trim() });
      setNewSatuan("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menambahkan satuan.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (sat: SatuanModel) => {
    setEditingId(sat.id);
    setEditingName(sat.jenis_satuan);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim()) {
      setError("Jenis satuan tidak boleh kosong.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onUpdate(id, { jenis_satuan: editingName.trim() });
      setEditingId(null);
      setEditingName("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui satuan.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSatuan) return;
    try {
      setIsDeleting(true);
      await onDelete(deletingSatuan.id);
      setDeletingSatuan(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus satuan. Satuan mungkin sedang digunakan oleh produk.";
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
              <HugeIcon icon={Layers01Icon} size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold">Kelola Satuan Produk</h2>
              <p className="text-xs text-white/70">Tambah, ubah, atau hapus satuan ukuran produk</p>
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

          {/* Add Satuan Form */}
          <form onSubmit={handleCreate} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Tambah Satuan Baru
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSatuan}
                onChange={(e) => setNewSatuan(e.target.value)}
                placeholder="Contoh: Pcs, Pack, Botol, Kg"
                disabled={isSubmitting}
                className="flex-1 px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E] transition-all disabled:bg-slate-50"
              />
              <button
                type="submit"
                disabled={isSubmitting || !newSatuan.trim()}
                className="px-4 py-2.5 bg-[#A81B1B] hover:bg-[#8B1717] text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HugeIcon icon={PlusSignIcon} size={16} />
                <span>Tambah</span>
              </button>
            </div>
          </form>

          {/* Satuan List */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Daftar Satuan Terdaftar ({filteredList.length})
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
                placeholder="Cari jenis satuan..."
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
                  ? `Tidak ada satuan yang cocok dengan "${searchQuery}".`
                  : "Belum ada satuan yang ditambahkan."}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                {filteredList.map((sat) => (
                  <div
                    key={sat.id}
                    className="p-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
                  >
                    {editingId === sat.id ? (
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
                          onClick={() => handleSaveEdit(sat.id)}
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
                            {sat.jenis_satuan}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(sat)}
                            className="p-1.5 text-slate-400 hover:text-[#18314E] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Ubah jenis satuan"
                          >
                            <HugeIcon icon={Edit01Icon} size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingSatuan(sat)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus satuan"
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

      {/* Reusable ConfirmModal for Satuan Deletion */}
      <ConfirmModal
        isOpen={Boolean(deletingSatuan)}
        onClose={() => !isDeleting && setDeletingSatuan(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Satuan Ukuran"
        message={
          deletingSatuan
            ? `Apakah Anda yakin ingin menghapus jenis satuan "${deletingSatuan.jenis_satuan}"? Satuan yang masih digunakan oleh produk aktif tidak dapat dihapus.`
            : ""
        }
        confirmLabel="Ya, Hapus Satuan"
        cancelLabel="Batal"
        isLoading={isDeleting}
        isDestructive={true}
        icon={Delete02Icon}
      />
    </div>
  );
}
