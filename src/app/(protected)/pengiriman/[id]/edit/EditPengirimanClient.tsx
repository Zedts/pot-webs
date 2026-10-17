"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  pengirimanService,
} from "@/services/pengiriman.service";
import { PengirimanModel, LapakSimple, PengirimanStatus } from "@/types/pengiriman";
import { apiClient } from "@/lib/api-client";
import { ApiEndpoints } from "@/constants/api_endpoints";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { showToast } from "@/lib/toast";
import { getJakartaDateString, formatRupiah } from "@/utils/shift.utils";
import { HugeIcon } from "@/components/ui/HugeIcon";
import {
  ArrowLeft01Icon,
  AlertCircleIcon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";

export function EditPengirimanClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [shipment, setShipment] = useState<PengirimanModel | null>(null);
  const [lapakList, setLapakList] = useState<LapakSimple[]>([]);
  const [tanggal, setTanggal] = useState("");
  const [lapakId, setLapakId] = useState("");
  const [status, setStatus] = useState<PengirimanStatus>("draft");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [shipmentData, lapakRes] = await Promise.all([
          pengirimanService.getPengirimanById(id),
          apiClient.get<LapakSimple[]>(ApiEndpoints.lapak, { requiresAuth: true }),
        ]);

        setShipment(shipmentData);
        setLapakList(Array.isArray(lapakRes.data) ? lapakRes.data : []);

        const rawDate = shipmentData.tanggal || shipmentData.createdAt;
        setTanggal(rawDate ? getJakartaDateString(new Date(rawDate)) : getJakartaDateString());
        setLapakId(shipmentData.lapak_id || "");
        setStatus(shipmentData.status);
      } catch (err: unknown) {
        const apiErr = err as { userMessage?: string; message?: string };
        setErrorMessage(
          apiErr?.userMessage ||
            apiErr?.message ||
            "Gagal memuat data pengiriman untuk diedit."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsSubmitting(true);
    try {
      await pengirimanService.updatePengiriman(id, {
        tanggal,
        lapak_id: lapakId,
        status,
      });

      showToast.success("Data pengiriman berhasil diperbarui.");
      router.push("/pengiriman");
    } catch (err: unknown) {
      const apiErr = err as { userMessage?: string; message?: string };
      showToast.error(
        apiErr?.userMessage ||
          apiErr?.message ||
          "Gagal memperbarui data pengiriman."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 md:px-8 py-6 space-y-6 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-48" />
        <div className="h-10 bg-slate-200 rounded w-72" />
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

  return (
    <div className="px-4 md:px-8 py-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: "Pengiriman", href: "/pengiriman" },
          { label: shipment.unique_id || id, href: `/pengiriman/${id}` },
          { label: "Edit Pengiriman" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#18314E] tracking-tight">
            Ubah Data Pengiriman
          </h1>
          <p className="text-xs md:text-sm text-[#6B7280] font-mono mt-0.5">
            {shipment.unique_id}
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl p-5 md:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-[#F3E7D8] space-y-4">
          <h2 className="text-base font-bold text-[#18314E] border-b border-[#F3E7D8] pb-3">
            Metadata Pengiriman
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Tanggal Kirim */}
            <div>
              <label className="block text-xs font-bold text-[#18314E] mb-1.5">
                Tanggal Pengiriman
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
                Tujuan Lapak
              </label>
              <select
                value={lapakId}
                onChange={(e) => setLapakId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#F3E7D8] bg-white text-[#18314E] focus:outline-none focus:border-[#A81B1B] font-medium cursor-pointer"
              >
                {lapakList.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Status DO */}
            <div>
              <label className="block text-xs font-bold text-[#18314E] mb-1.5">
                Status Pengiriman
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PengirimanStatus)}
                required
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#F3E7D8] bg-white text-[#18314E] focus:outline-none focus:border-[#A81B1B] font-medium cursor-pointer"
              >
                <option value="draft">Draft (Gudang)</option>
                <option value="dikirim_viar">Dalam Perjalanan (dikirim_viar)</option>
                <option value="diterima_spg">Diterima SPG (diterima_spg)</option>
                <option value="selesai">Selesai (selesai)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Read-only Line Items Reference */}
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-[#F3E7D8] overflow-hidden">
          <div className="p-5 md:px-7 border-b border-[#F3E7D8]">
            <h2 className="text-base font-bold text-[#18314E]">
              Rincian Barang Terkirim (Read-Only)
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Rincian produk dibuat secara atomik saat DO disimpan. Jika status masih Draft dan ingin merevisi alokasi barang, hapus dokumen ini dan buat ulang.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EFF4F9] text-[#475569] text-xs font-semibold tracking-wide border-b border-[#F3E7D8]">
                  <th scope="col" className="py-3 px-6 font-bold w-12 text-center">No</th>
                  <th scope="col" className="py-3 px-6 font-bold">Nama Produk</th>
                  <th scope="col" className="py-3 px-6 font-bold">Satuan</th>
                  <th scope="col" className="py-3 px-6 font-bold">Harga Satuan</th>
                  <th scope="col" className="py-3 px-6 font-bold text-center">Qty Kirim</th>
                  <th scope="col" className="py-3 px-6 font-bold text-right">Subtotal</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F3E7D8] text-xs text-[#1E293B]">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      Tidak ada item tercatat.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="py-3 px-6 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-6 font-bold text-[#18314E]">{item.nama_produk}</td>
                      <td className="py-3 px-6 text-slate-600">{item.jenis_satuan}</td>
                      <td className="py-3 px-6 text-slate-700 font-mono">{formatRupiah(item.harga_produk)}</td>
                      <td className="py-3 px-6 text-center font-bold text-[#18314E] font-mono">{item.qty}</td>
                      <td className="py-3 px-6 text-right font-bold text-[#18314E] font-mono">
                        {formatRupiah(item.qty * item.harga_produk)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={() => router.push("/pengiriman")}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl border border-[#F3E7D8] bg-[#FDF6EE] hover:bg-[#F3E7D8] text-[#18314E] text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[#A81B1B] hover:bg-[#851515] text-white font-bold text-xs shadow-xs active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <HugeIcon icon={CheckmarkCircle02Icon} size={16} strokeWidth={2.2} />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
