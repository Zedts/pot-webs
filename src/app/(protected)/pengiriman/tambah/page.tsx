"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { isAdminOrOwner } from "@/types/user";
import { pengirimanService } from "@/services/pengiriman.service";
import { LapakSimple } from "@/types/pengiriman";
import { apiClient } from "@/lib/api-client";
import { ApiEndpoints } from "@/constants/api_endpoints";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { showToast } from "@/lib/toast";
import { getJakartaDateString, formatRupiah } from "@/utils/shift.utils";
import { HugeIcon } from "@/components/ui/HugeIcon";
import {
  PlusSignIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  AlertCircleIcon,
  Search01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";

interface ProductRowItem {
  produk_id: string;
  nama: string;
  kategori: string;
  satuan: string;
  harga: number;
  qty: number;
}

export default function TambahPengirimanPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const isPrivileged = isAdminOrOwner(user);

  const [tanggal, setTanggal] = useState("");
  const [selectedLapakId, setSelectedLapakId] = useState("");
  const [lapakList, setLapakList] = useState<LapakSimple[]>([]);
  const [productItems, setProductItems] = useState<ProductRowItem[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"select" | "edit">("select");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function initForm() {
      setTanggal(getJakartaDateString());
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [lapakRes, products] = await Promise.all([
          apiClient.get<LapakSimple[]>(ApiEndpoints.lapak, { requiresAuth: true }),
          pengirimanService.getActiveProducts(),
        ]);

        const laps = Array.isArray(lapakRes.data) ? lapakRes.data : [];
        setLapakList(laps);
        if (laps.length > 0) {
          setSelectedLapakId(laps[0].id);
        }

        const rows: ProductRowItem[] = products.map((p) => ({
          produk_id: p.id,
          nama: p.nama,
          kategori: p.nama_kategori || "-",
          satuan: p.jenis_satuan || "pcs",
          harga: Number(p.harga) || 0,
          qty: 0,
        }));
        setProductItems(rows);
      } catch (err: unknown) {
        const apiErr = err as { userMessage?: string; message?: string };
        setErrorMessage(
          apiErr?.userMessage ||
            apiErr?.message ||
            "Gagal memuat master data lapak & produk."
        );
      } finally {
        setIsLoading(false);
      }
    }

    initForm();
  }, []);

  // Toggle product selection in Select Mode
  const handleToggleSelect = (produkId: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(produkId)) {
        next.delete(produkId);
      } else {
        next.add(produkId);
      }
      return next;
    });

    // If added and qty is 0, give initial qty of 1
    setProductItems((prev) =>
      prev.map((item) => {
        if (item.produk_id === produkId && item.qty === 0) {
          return { ...item, qty: 1 };
        }
        return item;
      })
    );
  };

  // Remove product from editable view
  const handleRemoveFromSelected = (produkId: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      next.delete(produkId);
      return next;
    });
    setProductItems((prev) =>
      prev.map((item) =>
        item.produk_id === produkId ? { ...item, qty: 0 } : item
      )
    );
  };

  // Qty change handler in Edit Mode
  const handleQtyChange = (produkId: string, val: number) => {
    const safeQty = Math.max(0, Math.floor(val || 0));
    setProductItems((prev) =>
      prev.map((item) =>
        item.produk_id === produkId ? { ...item, qty: safeQty } : item
      )
    );
  };

  // Switch to editable view
  const handleProceedToEdit = () => {
    if (selectedProductIds.size === 0) {
      showToast.error("Pilih minimal 1 produk terlebih dahulu.");
      return;
    }
    setViewMode("edit");
    setSearchTerm("");
  };

  // Switch back to select mode
  const handleBackToSelect = () => {
    setViewMode("select");
    setSearchTerm("");
  };

  // Filtered products for Select Mode
  // shortcut: in-memory product filter, paginate when catalog exceeds 200 items
  const availableProducts = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return productItems;
    return productItems.filter(
      (p) =>
        p.nama.toLowerCase().includes(q) ||
        p.kategori.toLowerCase().includes(q)
    );
  }, [productItems, searchTerm]);

  // Filtered products for Edit Mode
  const selectedProducts = useMemo(() => {
    const selectedList = productItems.filter((p) =>
      selectedProductIds.has(p.produk_id)
    );
    const q = searchTerm.toLowerCase().trim();
    if (!q) return selectedList;
    return selectedList.filter(
      (p) =>
        p.nama.toLowerCase().includes(q) ||
        p.kategori.toLowerCase().includes(q)
    );
  }, [productItems, selectedProductIds, searchTerm]);

  // Summary calculations from selected items
  const { totalUnits, totalValue, allocatedCount } = useMemo(() => {
    let units = 0;
    let value = 0;
    let count = 0;
    for (const item of productItems) {
      if (selectedProductIds.has(item.produk_id) && item.qty > 0) {
        units += item.qty;
        value += item.qty * item.harga;
        count++;
      }
    }
    return { totalUnits: units, totalValue: value, allocatedCount: count };
  }, [productItems, selectedProductIds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (viewMode === "select") {
      showToast.error("Silakan klik tombol Pilih Produk dan alokasikan kuantitas terlebih dahulu.");
      return;
    }

    if (!selectedLapakId) {
      showToast.error("Silakan pilih outlet lapak tujuan.");
      return;
    }

    const itemsToSend = productItems
      .filter((i) => selectedProductIds.has(i.produk_id) && i.qty > 0)
      .map((i) => ({
        produk_id: i.produk_id,
        qty: i.qty,
      }));

    if (itemsToSend.length === 0) {
      showToast.error("Alokasikan minimal 1 produk dengan jumlah kirim lebih dari 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      await pengirimanService.createPengiriman({
        tanggal,
        lapak_id: selectedLapakId,
        items: itemsToSend,
      });

      showToast.success("Delivery Order berhasil dibuat dalam status Draft.");
      router.push("/pengiriman");
    } catch (err: unknown) {
      const apiErr = err as { userMessage?: string; message?: string };
      showToast.error(
        apiErr?.userMessage ||
          apiErr?.message ||
          "Gagal membuat pengiriman. Silakan periksa kembali isian form."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthLoading && !isPrivileged) {
    return (
      <div className="px-4 md:px-8 py-6">
        <div className="bg-white rounded-2xl p-8 border border-[#F3E7D8] text-center space-y-4">
          <h2 className="text-lg font-bold text-[#18314E]">Akses Terbatas</h2>
          <p className="text-xs text-[#6B7280]">
            Hanya Administrator dan Owner yang berwenang membuat Delivery Order baru.
          </p>
          <button
            type="button"
            onClick={() => router.push("/pengiriman")}
            className="px-4 py-2 rounded-xl bg-[#A81B1B] text-white text-xs font-bold cursor-pointer"
          >
            Kembali ke Pengiriman
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: "Pengiriman", href: "/pengiriman" },
          { label: "Buat Pengiriman" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#18314E] tracking-tight">
            Buat Delivery Order (DO)
          </h1>
          <p className="text-xs md:text-sm text-[#6B7280] font-medium mt-0.5">
            Alokasikan kuantitas produk siap kirim ke lapak tujuan
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/pengiriman")}
          className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-[#F3E7D8] bg-[#FDF6EE] hover:bg-[#F3E7D8] text-[#18314E] text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
        >
          <HugeIcon icon={ArrowLeft01Icon} size={15} strokeWidth={2} />
          <span>Kembali</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#B91C1C] flex items-center space-x-2.5 text-xs font-semibold animate-in fade-in">
          <HugeIcon icon={AlertCircleIcon} size={18} strokeWidth={2} className="text-[#B91C1C] shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Destination & Date Card */}
        <div className="bg-white rounded-2xl p-5 md:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-[#F3E7D8] space-y-4">
          <h2 className="text-base font-bold text-[#18314E] border-b border-[#F3E7D8] pb-3">
            Informasi Dokumen & Tujuan
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tanggal Kirim */}
            <div>
              <label className="block text-xs font-bold text-[#18314E] mb-1.5">
                Tanggal Pengiriman <span className="text-[#A81B1B]">*</span>
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#F3E7D8] bg-white text-[#18314E] focus:outline-none focus:border-[#A81B1B] font-medium"
              />
            </div>

            {/* Lapak Tujuan */}
            <div>
              <label className="block text-xs font-bold text-[#18314E] mb-1.5">
                Outlet Lapak Tujuan <span className="text-[#A81B1B]">*</span>
              </label>
              <select
                value={selectedLapakId}
                onChange={(e) => setSelectedLapakId(e.target.value)}
                required
                disabled={isLoading || lapakList.length === 0}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#F3E7D8] bg-white text-[#18314E] focus:outline-none focus:border-[#A81B1B] font-medium cursor-pointer"
              >
                {lapakList.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nama} {l.lokasi ? `(${l.lokasi})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* VIEW MODE 1: SELECT PRODUCTS TABLE */}
        {viewMode === "select" ? (
          <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-[#F3E7D8] overflow-hidden">
            {/* Header with Search and Select Products CTA */}
            <div className="p-5 md:px-7 border-b border-[#F3E7D8]">
              <h2 className="text-base font-bold text-[#18314E]">
                Pilih Produk untuk Pengiriman
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Klik tombol <span className="font-bold text-[#18314E]">+</span> pada produk yang akan dikirim, lalu klik tombol <span className="font-bold text-[#A81B1B]">Pilih Produk</span> di bagian bawah tabel.
              </p>
            </div>

            {/* Search Bar */}
            <div className="p-4 md:px-7 border-b border-[#F3E7D8] bg-[#FDFBF9] flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <HugeIcon icon={Search01Icon} size={16} strokeWidth={2} />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari produk atau kategori..."
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#F3E7D8] bg-white text-[#18314E] placeholder:text-slate-400 focus:outline-none focus:border-[#A81B1B] focus:ring-1 focus:ring-[#A81B1B] transition-all"
                />
              </div>

              <div className="text-xs font-semibold text-[#6B7280]">
                Dipilih: <span className="text-[#A81B1B] font-bold">{selectedProductIds.size}</span> dari {productItems.length} Produk
              </div>
            </div>

            {/* Available Products Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#EFF4F9] text-[#475569] text-xs font-semibold tracking-wide border-b border-[#F3E7D8]">
                    <th scope="col" className="py-3 px-6 font-bold w-12 text-center">No</th>
                    <th scope="col" className="py-3 px-6 font-bold">Nama Produk</th>
                    <th scope="col" className="py-3 px-6 font-bold">Kategori</th>
                    <th scope="col" className="py-3 px-6 font-bold">Satuan</th>
                    <th scope="col" className="py-3 px-6 font-bold">Harga Satuan</th>
                    <th scope="col" className="py-3 px-6 font-bold text-center w-28">Pilih</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#F3E7D8] text-xs text-[#1E293B]">
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="py-4 px-6">
                          <div className="h-4 bg-slate-200 rounded w-full" />
                        </td>
                      </tr>
                    ))
                  ) : availableProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        {searchTerm ? "Tidak ada produk yang cocok dengan pencarian." : "Tidak ada produk aktif yang tersedia."}
                      </td>
                    </tr>
                  ) : (
                    availableProducts.map((item, idx) => {
                      const isSelected = selectedProductIds.has(item.produk_id);
                      return (
                        <tr
                          key={item.produk_id}
                          className={`transition-colors ${
                            isSelected ? "bg-amber-50/40 hover:bg-amber-50/70" : "hover:bg-slate-50/70"
                          }`}
                        >
                          <td className="py-3.5 px-6 text-center text-slate-400 font-mono">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-6 font-bold text-[#18314E]">
                            {item.nama}
                          </td>
                          <td className="py-3.5 px-6 text-slate-600">
                            {item.kategori}
                          </td>
                          <td className="py-3.5 px-6 text-slate-600 font-medium">
                            {item.satuan}
                          </td>
                          <td className="py-3.5 px-6 text-slate-700 font-mono">
                            {formatRupiah(item.harga)}
                          </td>
                          <td className="py-3.5 px-6 text-center">
                            {isSelected ? (
                              <div className="inline-flex items-center space-x-1.5 justify-center">
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-xs shadow-2xs">
                                  <HugeIcon icon={CheckmarkCircle02Icon} size={14} strokeWidth={2.2} />
                                  <span>Terpilih</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleSelect(item.produk_id)}
                                  className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all cursor-pointer"
                                  title="Batalkan pilihan produk ini"
                                  aria-label="Batalkan pilihan"
                                >
                                  <HugeIcon icon={Delete02Icon} size={14} strokeWidth={2} />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleSelect(item.produk_id)}
                                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-[#F3E7D8] bg-[#FDF6EE] hover:bg-[#F3E7D8] text-[#18314E] hover:text-[#A81B1B] font-bold text-xs transition-all cursor-pointer"
                                title="Pilih produk ini untuk pengiriman"
                              >
                                <HugeIcon icon={PlusSignIcon} size={15} strokeWidth={2.2} />
                                <span>Pilih</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Selection View Footer */}
            <div className="p-4 md:px-7 border-t border-[#F3E7D8] bg-[#FDFBF9] flex items-center justify-between">
              <span className="text-xs text-[#6B7280]">
                {selectedProductIds.size === 0
                  ? "Pilih produk menggunakan tombol + untuk melanjutkan"
                  : `${selectedProductIds.size} produk telah ditandai untuk pengiriman`}
              </span>
              <button
                type="button"
                onClick={handleProceedToEdit}
                disabled={selectedProductIds.size === 0}
                className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-[#A81B1B] hover:bg-[#851515] text-white font-bold text-xs sm:text-sm shadow-xs active:scale-[0.99] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Pilih Produk ({selectedProductIds.size})</span>
                <HugeIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
              </button>
            </div>
          </div>
        ) : (
          /* VIEW MODE 2: EDITABLE QUANTITY TABLE */
          <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-[#F3E7D8] overflow-hidden">
            {/* Header with Switch Back Button */}
            <div className="p-5 md:px-7 border-b border-[#F3E7D8] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-[#18314E]">
                  Alokasi Kuantitas Produk Terpilih
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Isi kuantitas kirim (qty) pada varian produk yang telah dipilih
                </p>
              </div>

              {/* Button to go back and add more products */}
              <button
                type="button"
                onClick={handleBackToSelect}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-[#F3E7D8] bg-[#FDF6EE] hover:bg-[#F3E7D8] text-[#18314E] text-xs font-bold transition-all cursor-pointer self-start md:self-auto shrink-0"
              >
                <HugeIcon icon={PlusSignIcon} size={15} strokeWidth={2.2} />
                <span>Ubah / Tambah Pilihan Produk</span>
              </button>
            </div>

            {/* Search Bar in Editable Mode */}
            <div className="p-4 md:px-7 border-b border-[#F3E7D8] bg-[#FDFBF9] flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <HugeIcon icon={Search01Icon} size={16} strokeWidth={2} />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari produk terpilih..."
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#F3E7D8] bg-white text-[#18314E] placeholder:text-slate-400 focus:outline-none focus:border-[#A81B1B] focus:ring-1 focus:ring-[#A81B1B] transition-all"
                />
              </div>

              <div className="text-xs font-semibold text-[#6B7280]">
                Terpilih: <span className="text-[#18314E] font-bold">{allocatedCount} Produk</span> (Kuantitas &gt; 0)
              </div>
            </div>

            {/* Editable Selected Products Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#EFF4F9] text-[#475569] text-xs font-semibold tracking-wide border-b border-[#F3E7D8]">
                    <th scope="col" className="py-3 px-6 font-bold w-12 text-center">No</th>
                    <th scope="col" className="py-3 px-6 font-bold">Nama Produk</th>
                    <th scope="col" className="py-3 px-6 font-bold">Kategori</th>
                    <th scope="col" className="py-3 px-6 font-bold">Satuan</th>
                    <th scope="col" className="py-3 px-6 font-bold">Harga Satuan</th>
                    <th scope="col" className="py-3 px-6 font-bold w-36">Qty Kirim</th>
                    <th scope="col" className="py-3 px-6 font-bold text-right">Subtotal</th>
                    <th scope="col" className="py-3 px-6 font-bold text-center w-16">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#F3E7D8] text-xs text-[#1E293B]">
                  {selectedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        {searchTerm ? "Tidak ada produk terpilih yang cocok dengan pencarian." : "Belum ada produk yang dipilih."}
                      </td>
                    </tr>
                  ) : (
                    selectedProducts.map((item, idx) => (
                      <tr key={item.produk_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-6 text-center text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-6 font-bold text-[#18314E]">
                          {item.nama}
                        </td>
                        <td className="py-3.5 px-6 text-slate-600">
                          {item.kategori}
                        </td>
                        <td className="py-3.5 px-6 text-slate-600 font-medium">
                          {item.satuan}
                        </td>
                        <td className="py-3.5 px-6 text-slate-700 font-mono">
                          {formatRupiah(item.harga)}
                        </td>
                        <td className="py-3.5 px-6">
                          <input
                            type="number"
                            min={0}
                            value={item.qty === 0 ? "" : item.qty}
                            onChange={(e) =>
                              handleQtyChange(item.produk_id, parseInt(e.target.value, 10) || 0)
                            }
                            placeholder="0"
                            className="w-24 px-3 py-1.5 text-xs text-center rounded-lg border border-[#F3E7D8] bg-white font-bold text-[#18314E] focus:outline-none focus:border-[#A81B1B] focus:ring-1 focus:ring-[#A81B1B]"
                          />
                        </td>
                        <td className="py-3.5 px-6 text-right font-bold text-[#18314E] font-mono">
                          {formatRupiah(item.qty * item.harga)}
                        </td>
                        <td className="py-3.5 px-6 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveFromSelected(item.produk_id)}
                            title="Hapus dari daftar alokasi"
                            className="p-1.5 rounded-lg border border-[#F3E7D8] bg-[#FDF6EE] hover:bg-rose-50 hover:border-rose-200 text-[#18314E] hover:text-[#A81B1B] transition-all cursor-pointer"
                          >
                            <HugeIcon icon={Delete02Icon} size={14} strokeWidth={2} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* Table Summary Footer */}
                <tfoot>
                  <tr className="bg-[#FDFBF9] border-t-2 border-[#F3E7D8] font-bold text-xs text-[#18314E]">
                    <td colSpan={5} className="py-4 px-6 text-right">
                      Total Kuantitas & Estimasi Nilai:
                    </td>
                    <td className="py-4 px-6 font-mono text-[#A81B1B] text-sm">
                      {totalUnits} Unit
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-sm">
                      {formatRupiah(totalValue)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={() => router.push("/pengiriman")}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl border border-[#F3E7D8] bg-[#FDF6EE] hover:bg-[#F3E7D8] text-[#18314E] text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={isSubmitting || viewMode === "select" || allocatedCount === 0}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[#A81B1B] hover:bg-[#851515] text-white font-bold text-xs shadow-xs active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <HugeIcon icon={PlusSignIcon} size={16} strokeWidth={2.2} />
                <span>Simpan & Buat DO</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
