/**
 * Types and Data Contracts for Pengiriman & Penerimaan Modules
 */

export type PengirimanStatus = "draft" | "dikirim_viar" | "diterima_spg" | "selesai";

export type PenerimaanStatus = "sesuai" | "selisih";

export interface LapakUserAssigned {
  id: string;
  nama: string;
  username?: string;
  role: string;
  shift?: string | null;
  status?: string;
}

export interface LapakSimple {
  id: string;
  nama: string;
  lokasi?: string;
  shift_pagi?: [string, string];
  shift_siang?: [string, string];
  shift_long?: [string, string];
  spg?: {
    id?: string;
    nama: string;
    username?: string;
  } | null;
  users?: LapakUserAssigned[];
}

export interface CreatorSimple {
  id: string;
  nama: string;
  email: string;
  role: string;
  username?: string;
  no_hp?: string;
}

export interface PengirimanDetailModel {
  id: string;
  pengiriman_id: string;
  produk_id: string;
  nama_produk: string;
  harga_produk: number;
  jenis_satuan: string;
  kategori_id?: string | null;
  nama_kategori?: string | null;
  qty: number;
}

export interface PengirimanModel {
  id: string;
  unique_id: string;
  counters_id?: string | null;
  tanggal: string | null;
  lapak_id: string;
  lapak?: LapakSimple | null;
  asal_lapak_id?: string | null;
  asal_lapak?: LapakSimple | null;
  created_by: string;
  creator?: CreatorSimple | null;
  pengirim_id?: string | null;
  pengirim?: CreatorSimple | null;
  status: PengirimanStatus;
  total_items: number;
  qty_kirim: number;
  items?: PengirimanDetailModel[];
  ttd_pengirim_url?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PenerimaanModel {
  id: string;
  pengiriman_id: string;
  unique_id?: string | null;
  lapak_id?: string | null;
  tanggal: string | null;
  qty_terima: number;
  nota_url?: string | null;
  catatan?: string;
  status: PenerimaanStatus;
  spg?: {
    id: string;
    nama: string;
    username?: string;
    no_hp?: string;
    email?: string;
    role?: string;
  } | null;
  createdAt?: string | null;
}

export interface ProdukModel {
  id: string;
  nama: string;
  harga: number;
  jenis_satuan: string;
  kategori_id?: string | null;
  nama_kategori?: string | null;
  is_active?: boolean;
}

export interface CreatePengirimanItem {
  produk_id: string;
  qty: number;
}

export interface CreatePengirimanPayload {
  tanggal: string;
  lapak_id: string;
  pengirim_id: string;
  items: CreatePengirimanItem[];
  asal_lapak_id?: string;
  ttd_pengirim?: File | Blob;
}

export interface UpdatePengirimanPayload {
  tanggal?: string;
  lapak_id?: string;
  asal_lapak_id?: string | null;
  pengirim_id?: string;
  status?: PengirimanStatus;
  items?: CreatePengirimanItem[];
  ttd_pengirim?: File | Blob;
}

export interface PengirimanSummary {
  totalPengirimanHariIni: number;
  totalUnitKirim: number;
  totalStatusSelesai: number;
  totalDalamPerjalanan: number;
  totalSesuai: number;
  totalSelisih: number;
  totalLapakTujuan: number;
  totalVarian: number;
  draftCount: number;
}

export interface PengirimanTableRow {
  id: string;
  uniqueId: string;
  lapakNama: string;
  lapakId: string;
  asalLapakId?: string | null;
  asalLapakNama?: string | null;
  pengirimNama?: string;
  penerimaSpg: string;
  penerimaUsername?: string;
  penerimaNoHp?: string;
  waktuKirim: string;
  totalItems: number;
  qtyKirim: number;
  status: PengirimanStatus;
  statusPenerimaan?: PenerimaanStatus | null;
  tanggalRaw: string | null;
  ttdPengirimUrl?: string | null;
}
