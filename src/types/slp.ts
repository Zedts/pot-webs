/**
 * Data contracts and DTOs for Stok - Lapak - Produk (SLP) Hub
 */

export type SlpTabKey = "lapak" | "stok" | "produk";

export interface LapakSpg {
  spg_id: string;
  nama: string;
  username?: string;
  email?: string;
  no_hp?: string;
  shift?: string | null;
  status?: string;
}

export interface LapakAssignedUser {
  id: string;
  nama: string;
  username?: string;
  email?: string;
  no_hp?: string;
  role: string;
  shift?: string | null;
  status?: string;
}

export interface LapakSpgUser {
  id: string;
  nama: string;
  username?: string;
  email?: string;
  no_hp?: string;
  role?: string;
  shift?: string | null;
  status?: string;
}

export interface LapakModel {
  id: string;
  nama: string;
  lokasi: string;
  keterangan?: string;
  latitude?: number | null;
  longitude?: number | null;
  radius_meter: number;
  spg_id?: string | null;
  spg?: LapakSpg | null;
  users?: LapakAssignedUser[];
  shift_pagi: [string, string];
  shift_siang: [string, string];
  shift_long?: [string, string];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateLapakPayload {
  nama: string;
  lokasi: string;
  keterangan?: string;
  spg_id?: string | null;
  spg_ids?: string[];
  latitude?: number | null;
  longitude?: number | null;
  radius_meter?: number;
  shift_pagi?: [string, string];
  shift_siang?: [string, string];
  shift_long?: [string, string];
}

export interface UpdateLapakPayload {
  nama?: string;
  lokasi?: string;
  keterangan?: string;
  spg_id?: string | null;
  spg_ids?: string[];
  latitude?: number | null;
  longitude?: number | null;
  radius_meter?: number;
  shift_pagi?: [string, string];
  shift_siang?: [string, string];
  shift_long?: [string, string];
}

export interface StokLapakModel {
  id: string;
  lapak_id: string;
  produk_id: string;
  stok_awal: number;
  stok_masuk: number;
  stok_terjual: number;
  stok_transfer?: number;
  stok_akhir: number;
  lapak?: {
    id: string;
    nama: string;
  } | null;
  produk?: {
    id: string;
    nama: string;
    harga: number;
    jenis_satuan: string;
    nama_kategori?: string | null;
  } | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateStokLapakPayload {
  lapak_id: string;
  produk_id: string;
  stok_awal: number;
  stok_masuk?: number;
  stok_terjual?: number;
  stok_transfer?: number;
}

export interface UpdateStokLapakPayload {
  stok_awal?: number;
  stok_masuk?: number;
  stok_terjual?: number;
  stok_transfer?: number;
}

export interface ProdukModel {
  id: string;
  nama: string;
  harga: number;
  kategori_id: string;
  nama_kategori?: string | null;
  satuan_id: string;
  jenis_satuan?: string | null;
  is_active: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateProdukPayload {
  nama: string;
  harga: number;
  kategori_id: string;
  satuan_id: string;
  is_active?: string;
}

export interface UpdateProdukPayload {
  nama?: string;
  harga?: number;
  kategori_id?: string;
  satuan_id?: string;
  is_active?: string;
}

export interface KategoriModel {
  id: string;
  nama_kategori: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateKategoriPayload {
  nama_kategori: string;
}

export interface UpdateKategoriPayload {
  nama_kategori: string;
}

export interface SatuanModel {
  id: string;
  jenis_satuan: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateSatuanPayload {
  jenis_satuan: string;
}

export interface UpdateSatuanPayload {
  jenis_satuan: string;
}

export interface AbsensiSummaryItem {
  id: string;
  lapak_id?: string;
  lapak?: { id: string } | null;
  user?: { id: string; nama: string; username?: string } | null;
  jam_masuk?: string | null;
  jam_pulang?: string | null;
  status?: string;
  shift?: string | null;
}

export interface SpgUserOption {
  id: string;
  nama: string;
  username?: string;
  email?: string;
  role: string;
  lapak_id?: string | null;
  shift?: string | null;
  status?: string;
}

export interface SlpSummaryMetrics {
  totalLapak: number;
  lapakWithSpg: number;
  lapakWithoutSpg: number;
  unassignedUsersCount: number;
  totalStokUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalProduk: number;
  activeProdukCount: number;
  totalKategori: number;
  totalSatuan: number;
}

export interface SlpHubData {
  lapakList: LapakModel[];
  stokList: StokLapakModel[];
  produkList: ProdukModel[];
  kategoriList: KategoriModel[];
  satuanList: SatuanModel[];
  spgUsers: SpgUserOption[];
  absensiList?: AbsensiSummaryItem[];
  summary: SlpSummaryMetrics;
}
