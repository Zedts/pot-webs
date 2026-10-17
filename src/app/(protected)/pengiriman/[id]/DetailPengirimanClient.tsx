"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { isAdminOrOwner } from "@/types/user";
import {
  pengirimanService,
} from "@/services/pengiriman.service";
import { PengirimanModel, PenerimaanModel } from "@/types/pengiriman";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PengirimanStatusBadge } from "@/components/pengiriman/PengirimanStatusBadge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { showToast } from "@/lib/toast";
import { formatJakartaTime, formatRupiah, getJakartaDateString } from "@/utils/shift.utils";
import { HugeIcon } from "@/components/ui/HugeIcon";
import {
  ArrowLeft01Icon,
  Edit01Icon,
  Delete02Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";

export function DetailPengirimanClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const isPrivileged = isAdminOrOwner(user);

  const [shipment, setShipment] = useState<PengirimanModel | null>(null);
  const [receipt, setReceipt] = useState<PenerimaanModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function loadDetail() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [shipmentData, receiptData] = await Promise.all([
          pengirimanService.getPengirimanById(id),
          pengirimanService.getPenerimaanByPengirimanId(id),
        ]);
        setShipment(shipmentData);
        setReceipt(receiptData);
      } catch (err: unknown) {
        const apiErr = err as { userMessage?: string; message?: string };
        setErrorMessage(
          apiErr?.userMessage ||
            apiErr?.message ||
            "Gagal memuat rincian data pengiriman."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadDetail();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await pengirimanService.deletePengiriman(id);
      showToast.success("Dokumen Delivery Order berhasil dihapus.");
      router.push("/pengiriman");
    } catch (err: unknown) {
      const apiErr = err as { userMessage?: string; message?: string };
      showToast.error(
        apiErr?.userMessage ||
          apiErr?.message ||
          "Gagal menghapus dokumen pengiriman."
      );
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 md:px-8 py-6 space-y-6 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-48" />
        <div className="h-10 bg-slate-200 rounded w-72" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-40 bg-slate-200 rounded-2xl" />
          <div className="h-40 bg-slate-200 rounded-2xl" />
        </div>
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (errorMessage || !shipment) {
    return (
      <div className="px-4 md:px-8 py-6">
        <div className="bg-white rounded-2xl p-8 border border-[#F3E7D8] text-center space-y-4">
          <p className="text-sm font-semibold text-[#18314E]">
            {errorMessage || "Pengiriman tidak ditemukan."}
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

  const items = shipment.items || [];
  const rawDate = shipment.tanggal || shipment.createdAt;

  return (
    <div className="px-4 md:px-8 py-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: "Pengiriman", href: "/pengiriman" },
          { label: "Rincian Pengiriman" },
          { label: shipment.unique_id || id },
        ]}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl md:text-2xl font-extrabold text-[#18314E] font-mono tracking-tight">
              {shipment.unique_id}
            </h1>
            <PengirimanStatusBadge
              status={shipment.status}
              receiptStatus={receipt?.status}
            />
          </div>
          <p className="text-xs text-[#6B7280]">
            Dokumen Delivery Order resmi bina energi POT
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/pengiriman")}
            className="p-2 rounded-xl border border-[#F3E7D8] bg-[#FDF6EE] hover:bg-[#F3E7D8] text-[#18314E] text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
            title="Kembali"
          >
            <HugeIcon icon={ArrowLeft01Icon} size={15} strokeWidth={2} />
            <span className="hidden sm:inline">Kembali</span>
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => router.push(`/pengiriman/${id}/edit`)}
            className="p-2 rounded-xl border border-[#F3E7D8] bg-[#FDF6EE] hover:bg-[#F3E7D8] text-[#18314E] hover:text-[#A81B1B] text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
            title="Ubah DO"
          >
            <HugeIcon icon={Edit01Icon} size={15} strokeWidth={2} />
            <span className="hidden sm:inline">Ubah</span>
          </button>

          {/* Delete Button (if admin/owner and no receipt) */}
          {isPrivileged && !receipt && (
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
              title="Hapus DO"
            >
              <HugeIcon icon={Delete02Icon} size={15} strokeWidth={2} />
              <span className="hidden sm:inline">Hapus</span>
            </button>
          )}
        </div>
      </div>

      {/* Discrepancy Banner if receipt status is selisih */}
      {receipt?.status === "selisih" && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start space-x-3 text-rose-800 text-xs">
          <HugeIcon icon={AlertCircleIcon} size={20} strokeWidth={2} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Perhatian: Ditemukan Selisih Penerimaan Fisik!</span>
            <p className="text-rose-700">
              Kuantitas fisik yang diterima oleh SPG di lapak ({receipt.qty_terima} unit) berbeda dari kuantitas terkirim ({shipment.qty_kirim} unit).
              {receipt.catatan ? ` Catatan SPG: "${receipt.catatan}"` : ""}
            </p>
          </div>
        </div>
      )}

      {/* Two Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Informasi Pengiriman */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-[#F3E7D8] space-y-3.5">
          <h2 className="text-sm font-bold text-[#18314E] border-b border-[#F3E7D8] pb-2">
            Informasi Pengiriman (Gudang)
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Tujuan Lapak</span>
              <span className="font-bold text-[#18314E]">{shipment.lapak?.nama || "-"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Tanggal Pengiriman</span>
              <span className="font-medium text-slate-800">
                {rawDate ? getJakartaDateString(new Date(rawDate)) : "-"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Waktu Input Sistem</span>
              <span className="font-mono text-slate-800">{formatJakartaTime(rawDate)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Total Muatan</span>
              <span className="font-bold text-[#18314E]">
                {shipment.qty_kirim} Unit ({shipment.total_items} Varian)
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-medium">Dibuat Oleh</span>
              <span className="font-medium text-slate-800">
                {shipment.creator?.nama || "Admin Gudang"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Informasi Penerimaan SPG */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-[#F3E7D8] space-y-3.5">
          <h2 className="text-sm font-bold text-[#18314E] border-b border-[#F3E7D8] pb-2">
            Informasi Tanda Terima (Outlet SPG)
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Penerima (SPG)</span>
              <span className="font-bold text-[#18314E]">
                {receipt?.spg?.nama || shipment.lapak?.spg?.nama || "Menunggu Konfirmasi Lapak"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Waktu Tanda Terima</span>
              <span className="font-mono text-slate-800">
                {receipt?.createdAt ? formatJakartaTime(receipt.createdAt) : "-"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Total Diterima Fisik</span>
              <span className="font-bold text-[#18314E]">
                {receipt ? `${receipt.qty_terima} Unit` : "Belum Diterima"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Status Verifikasi</span>
              <span>
                {receipt ? (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                      receipt.status === "sesuai"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {receipt.status === "sesuai" ? "Sesuai" : "Selisih"}
                  </span>
                ) : (
                  <span className="text-slate-400">Menunggu</span>
                )}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-medium">Bukti Foto Nota</span>
              <span>
                {receipt?.nota_url ? (
                  <a
                    href={receipt.nota_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#A81B1B] hover:underline"
                  >
                    Lihat Bukti Foto
                  </a>
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Snapshot Line Items Table */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-[#F3E7D8] overflow-hidden">
        <div className="p-5 md:px-7 border-b border-[#F3E7D8] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#18314E]">
              Rincian Snapshot Barang Terkirim
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Snapshot nama produk, kategori, dan harga pada saat Delivery Order dibuat
            </p>
          </div>
          <div className="text-xs font-semibold text-[#6B7280]">
            Total: <span className="text-[#18314E] font-bold">{items.length} Item</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#EFF4F9] text-[#475569] text-xs font-semibold tracking-wide border-b border-[#F3E7D8]">
                <th scope="col" className="py-3 px-6 font-bold w-12 text-center">No</th>
                <th scope="col" className="py-3 px-6 font-bold">Nama Produk</th>
                <th scope="col" className="py-3 px-6 font-bold">Kategori</th>
                <th scope="col" className="py-3 px-6 font-bold">Satuan</th>
                <th scope="col" className="py-3 px-6 font-bold">Harga Satuan</th>
                <th scope="col" className="py-3 px-6 font-bold text-center">Qty Kirim</th>
                <th scope="col" className="py-3 px-6 font-bold text-right">Subtotal</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F3E7D8] text-xs text-[#1E293B]">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Tidak ada rincian item dalam pengiriman ini.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-6 text-center text-slate-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-[#18314E]">
                      {item.nama_produk}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600">
                      {item.nama_kategori || "-"}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600 font-medium">
                      {item.jenis_satuan}
                    </td>
                    <td className="py-3.5 px-6 text-slate-700 font-mono">
                      {formatRupiah(item.harga_produk)}
                    </td>
                    <td className="py-3.5 px-6 text-center font-bold text-[#18314E] font-mono">
                      {item.qty}
                    </td>
                    <td className="py-3.5 px-6 text-right font-bold text-[#18314E] font-mono">
                      {formatRupiah(item.qty * item.harga_produk)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            <tfoot>
              <tr className="bg-[#FDFBF9] border-t-2 border-[#F3E7D8] font-bold text-xs text-[#18314E]">
                <td colSpan={5} className="py-4 px-6 text-right">
                  Total Keseluruhan Muatan:
                </td>
                <td className="py-4 px-6 text-center font-mono text-[#A81B1B] text-sm">
                  {shipment.qty_kirim} Unit
                </td>
                <td className="py-4 px-6 text-right font-mono text-sm">
                  {formatRupiah(
                    items.reduce((acc, curr) => acc + curr.qty * curr.harga_produk, 0)
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Delivery Order"
        message={`Apakah Anda yakin ingin menghapus dokumen pengiriman ${shipment.unique_id}? Dokumen yang telah dihapus tidak dapat dipulihkan.`}
        confirmLabel="Ya, Hapus Dokumen"
        cancelLabel="Batal"
        isLoading={isDeleting}
        isDestructive={true}
        icon={Delete02Icon}
      />
    </div>
  );
}
