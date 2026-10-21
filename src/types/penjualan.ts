import { LapakModel } from "@/types/slp";
import { UserModel } from "@/types/user";

export type MetodePembayaranType = "tunai" | "qris" | "transfer";

export interface PenjualanItemModel {
  id: string;
  produk_id: string;
  nama_produk: string;
  qty: number;
  harga_satuan: number;
  subtotal: number;
}

export interface PenjualanModel {
  id: string;
  tanggal: string;
  total_harga: number;
  metode_pembayaran: MetodePembayaranType | string;
  bukti_bayar_url?: string | null;
  bukti_qris_url?: string | null;
  kembalian_disimpan?: number;
  catatan?: string;
  spg?: UserModel | null;
  spg_id?: string;
  lapak?: LapakModel | null;
  lapak_id?: string;
  items: PenjualanItemModel[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PaymentMethodMetrics {
  count: number;
  totalNominal: number;
  percentage: number;
}

export interface PenjualanSummaryMetrics {
  todayTransactionsCount: number;
  todayTotalRevenue: number;
  qris: PaymentMethodMetrics;
  transfer: PaymentMethodMetrics;
  tunai: PaymentMethodMetrics;
  totalKembalianDisimpan: number;
  kembalianDisimpanCount: number;
}

export interface PenjualanTableRow {
  id: string;
  lapakId: string;
  lapakNama: string;
  lapakLokasi: string;
  metodePembayaran: MetodePembayaranType;
  tanggalRaw: string;
  spgId: string;
  spgNama: string;
  spgUsername?: string;
  spgNoHp?: string;
  totalHarga: number;
  totalItemsCount: number;
  kembalianDisimpan?: number;
  catatan?: string;
  hasBukti: boolean;
  raw: PenjualanModel;
}

export interface UpdatePenjualanPayload {
  metode_pembayaran?: string;
  catatan?: string;
  kembalian_disimpan?: number;
  bukti_bayar?: File;
  bukti_bayar_url?: string;
}

export interface PenjualanFilterState {
  searchTerm: string;
  lapakId: string;
  metodePembayaran: string;
  tanggal: string;
}
