import { apiClient } from "@/lib/api-client";
import { ApiEndpoints } from "@/constants/api_endpoints";
import { ApiResponse } from "@/types/api";
import {
  LapakModel,
  CreateLapakPayload,
  UpdateLapakPayload,
  StokLapakModel,
  CreateStokLapakPayload,
  UpdateStokLapakPayload,
  ProdukModel,
  CreateProdukPayload,
  UpdateProdukPayload,
  KategoriModel,
  CreateKategoriPayload,
  UpdateKategoriPayload,
  SatuanModel,
  CreateSatuanPayload,
  UpdateSatuanPayload,
  SpgUserOption,
  SlpSummaryMetrics,
  AbsensiSummaryItem,
  SlpHubData,
} from "@/types/slp";
import { getJakartaDateString } from "@/utils/shift.utils";

export type { SlpHubData } from "@/types/slp";

const getListData = <T>(res: PromiseSettledResult<ApiResponse<T[]>>): T[] =>
  res.status === "fulfilled" && Array.isArray(res.value?.data) ? res.value.data : [];

export class SlpService {
  /**
   * Parallel retrieval of all resources across Lapak, Stok, Produk, Kategori, Satuan, and SPGs
   */
  async getSlpHubData(): Promise<SlpHubData> {
    const todayDate = getJakartaDateString();
    const [lapakRes, stokRes, produkRes, kategoriRes, satuanRes, userRes, absensiRes] =
      await Promise.allSettled([
        apiClient.get<LapakModel[]>(ApiEndpoints.lapak, { requiresAuth: true }),
        apiClient.get<StokLapakModel[]>(ApiEndpoints.stokLapak, { requiresAuth: true }),
        apiClient.get<ProdukModel[]>(ApiEndpoints.produk, { requiresAuth: true }),
        apiClient.get<KategoriModel[]>(ApiEndpoints.kategori, { requiresAuth: true }),
        apiClient.get<SatuanModel[]>(ApiEndpoints.satuan, { requiresAuth: true }),
        apiClient.get<SpgUserOption[]>(ApiEndpoints.users, { requiresAuth: true }),
        apiClient.get<AbsensiSummaryItem[]>(`${ApiEndpoints.absensi}?tanggal=${todayDate}`, { requiresAuth: true }),
      ]);

    const lapakList = getListData(lapakRes);
    const stokList = getListData(stokRes);
    const produkList = getListData(produkRes);
    const kategoriList = getListData(kategoriRes);
    const satuanList = getListData(satuanRes);
    const spgUsers = getListData(userRes);
    const absensiList = getListData(absensiRes);

    // Compute metrics
    let lapakWithSpg = 0;
    let lapakWithoutSpg = 0;
    for (const l of lapakList) {
      const hasSpg =
        (Array.isArray(l.spg) && l.spg.length > 0) ||
        Boolean(l.spg && !Array.isArray(l.spg) && (l.spg as any).nama) ||
        (Array.isArray(l.users) && l.users.length > 0) ||
        Boolean(l.spg_id);
      if (hasSpg) {
        lapakWithSpg++;
      } else {
        lapakWithoutSpg++;
      }
    }

    let unassignedUsersCount = 0;
    for (const u of spgUsers) {
      if (!u.lapak_id) {
        unassignedUsersCount++;
      }
    }

    let totalStokUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    for (const s of stokList) {
      const balance = Number(s.stok_akhir) || 0;
      totalStokUnits += balance;
      if (balance <= 0) {
        outOfStockCount++;
      } else if (balance <= 5) {
        lowStockCount++;
      }
    }

    let activeProdukCount = 0;
    for (const p of produkList) {
      if (p.is_active === "aktif") {
        activeProdukCount++;
      }
    }

    const summary: SlpSummaryMetrics = {
      totalLapak: lapakList.length,
      lapakWithSpg,
      lapakWithoutSpg,
      unassignedUsersCount,
      totalStokUnits,
      lowStockCount,
      outOfStockCount,
      totalProduk: produkList.length,
      activeProdukCount,
      totalKategori: kategoriList.length,
      totalSatuan: satuanList.length,
    };

    return {
      lapakList,
      stokList,
      produkList,
      kategoriList,
      satuanList,
      spgUsers,
      absensiList,
      summary,
    };
  }

  // ==========================================
  // Lapak CRUD Operations
  // ==========================================

  async assignUserToLapak(userId: string, lapakId: string | null): Promise<void> {
    await apiClient.patch(
      `${ApiEndpoints.users}/${userId}/lapak`,
      { lapak_id: lapakId },
      { requiresAuth: true }
    );
  }

  async createLapak(payload: CreateLapakPayload): Promise<LapakModel> {
    const { spg_ids, ...rest } = payload;
    const primarySpgId = spg_ids && spg_ids.length > 0 ? spg_ids[0] : (rest.spg_id || null);

    const res = await apiClient.post<LapakModel>(ApiEndpoints.lapak, { ...rest, spg_id: primarySpgId }, {
      requiresAuth: true,
    });
    if (!res.data) throw new Error("Gagal membuat data lapak.");
    const newLapak = res.data;

    // Synchronize additional assigned users via existing PATCH /api/v1/users/:id/lapak
    if (spg_ids && spg_ids.length > 1) {
      const additionalUids = spg_ids.slice(1);
      await Promise.allSettled(
        additionalUids.map((uid: string) => this.assignUserToLapak(uid, newLapak.id))
      );
    }

    return newLapak;
  }

  async updateLapak(
    id: string,
    payload: UpdateLapakPayload,
    previousSpgIds: string[] = []
  ): Promise<LapakModel> {
    const { spg_ids, ...rest } = payload;
    const primarySpgId = spg_ids !== undefined
      ? (spg_ids.length > 0 ? spg_ids[0] : null)
      : rest.spg_id;

    const res = await apiClient.put<LapakModel>(`${ApiEndpoints.lapak}/${id}`, { ...rest, spg_id: primarySpgId }, {
      requiresAuth: true,
    });
    if (!res.data) throw new Error("Gagal memperbarui data lapak.");
    const updatedLapak = res.data;

    // Synchronize multi-user assignment via existing PATCH /api/v1/users/:id/lapak
    if (spg_ids !== undefined) {
      const assignPromises = spg_ids.map((uid: string) => this.assignUserToLapak(uid, id));
      const removedUserIds = previousSpgIds.filter((uid: string) => !spg_ids.includes(uid));
      const unassignPromises = removedUserIds.map((uid: string) => this.assignUserToLapak(uid, null));
      await Promise.allSettled([...assignPromises, ...unassignPromises]);
    }

    return updatedLapak;
  }

  async deleteLapak(id: string): Promise<void> {
    await apiClient.delete(`${ApiEndpoints.lapak}/${id}`, { requiresAuth: true });
  }

  // ==========================================
  // Stok Lapak CRUD Operations
  // ==========================================

  /**
   * Initialize a stock record for a stall & product with stok_awal
   */
  async createStokLapak(payload: CreateStokLapakPayload): Promise<StokLapakModel> {
    const body = {
      lapak_id: payload.lapak_id,
      produk_id: payload.produk_id,
      stok_awal: Math.max(0, Math.floor(payload.stok_awal || 0)),
      stok_masuk: Math.max(0, Math.floor(payload.stok_masuk || 0)),
      stok_terjual: Math.max(0, Math.floor(payload.stok_terjual || 0)),
    };
    const res = await apiClient.post<StokLapakModel>(ApiEndpoints.stokLapak, body, {
      requiresAuth: true,
    });
    if (!res.data) throw new Error("Gagal menambahkan pencatatan stok.");
    return res.data;
  }

  async updateStokLapak(id: string, payload: UpdateStokLapakPayload): Promise<StokLapakModel> {
    const res = await apiClient.put<StokLapakModel>(`${ApiEndpoints.stokLapak}/${id}`, payload, {
      requiresAuth: true,
    });
    if (!res.data) throw new Error("Gagal memperbarui data stok.");
    return res.data;
  }

  async deleteStokLapak(id: string): Promise<void> {
    await apiClient.delete(`${ApiEndpoints.stokLapak}/${id}`, { requiresAuth: true });
  }

  /**
   * Retrieve stock inventory records for a specific stall
   */
  async getStokByLapakId(lapakId: string): Promise<StokLapakModel[]> {
    if (!lapakId) return [];
    const res = await apiClient.get<StokLapakModel[]>(
      `${ApiEndpoints.stokLapak}?lapak_id=${encodeURIComponent(lapakId)}`,
      { requiresAuth: true }
    );
    return Array.isArray(res.data) ? res.data : [];
  }

  // ==========================================
  // Produk CRUD Operations
  // ==========================================

  async createProduk(payload: CreateProdukPayload): Promise<ProdukModel> {
    const is_active = (payload.is_active || "").toLowerCase().trim();
    const cleanActive = is_active === "aktif" || is_active === "active" ? "active" : "inactive";
    const cleanPayload = { ...payload, is_active: cleanActive };
    const res = await apiClient.post<ProdukModel>(ApiEndpoints.produk, cleanPayload, {
      requiresAuth: true,
    });
    if (!res.data) throw new Error("Gagal membuat produk baru.");
    return res.data;
  }

  async updateProduk(id: string, payload: UpdateProdukPayload): Promise<ProdukModel> {
    const cleanPayload = { ...payload };
    if (payload.is_active) {
      const is_active = payload.is_active.toLowerCase().trim();
      cleanPayload.is_active = is_active === "aktif" || is_active === "active" ? "active" : "inactive";
    }
    const res = await apiClient.put<ProdukModel>(`${ApiEndpoints.produk}/${id}`, cleanPayload, {
      requiresAuth: true,
    });
    if (!res.data) throw new Error("Gagal memperbarui produk.");
    return res.data;
  }

  async updateProdukStatus(id: string, status: string): Promise<ProdukModel> {
    const normalizedStatus = status.toLowerCase().trim() === "aktif" || status.toLowerCase().trim() === "active" ? "active" : "inactive";
    const res = await apiClient.patch<ProdukModel>(
      `${ApiEndpoints.produk}/${id}/status`,
      { status: normalizedStatus },
      { requiresAuth: true }
    );
    if (!res.data) throw new Error("Gagal mengubah status produk.");
    return res.data;
  }

  async deleteProduk(id: string): Promise<void> {
    await apiClient.delete(`${ApiEndpoints.produk}/${id}`, { requiresAuth: true });
  }

  // ==========================================
  // Kategori CRUD Operations
  // ==========================================

  async createKategori(payload: CreateKategoriPayload): Promise<KategoriModel> {
    const res = await apiClient.post<KategoriModel>(ApiEndpoints.kategori, payload, {
      requiresAuth: true,
    });
    if (!res.data) throw new Error("Gagal membuat kategori baru.");
    return res.data;
  }

  async updateKategori(id: string, payload: UpdateKategoriPayload): Promise<KategoriModel> {
    const res = await apiClient.put<KategoriModel>(`${ApiEndpoints.kategori}/${id}`, payload, {
      requiresAuth: true,
    });
    if (!res.data) throw new Error("Gagal memperbarui kategori.");
    return res.data;
  }

  async deleteKategori(id: string): Promise<void> {
    await apiClient.delete(`${ApiEndpoints.kategori}/${id}`, { requiresAuth: true });
  }

  // ==========================================
  // Satuan CRUD Operations
  // ==========================================

  async createSatuan(payload: CreateSatuanPayload): Promise<SatuanModel> {
    const res = await apiClient.post<SatuanModel>(ApiEndpoints.satuan, payload, {
      requiresAuth: true,
    });
    if (!res.data) throw new Error("Gagal membuat satuan baru.");
    return res.data;
  }

  async updateSatuan(id: string, payload: UpdateSatuanPayload): Promise<SatuanModel> {
    const res = await apiClient.put<SatuanModel>(`${ApiEndpoints.satuan}/${id}`, payload, {
      requiresAuth: true,
    });
    if (!res.data) throw new Error("Gagal memperbarui satuan.");
    return res.data;
  }

  async deleteSatuan(id: string): Promise<void> {
    await apiClient.delete(`${ApiEndpoints.satuan}/${id}`, { requiresAuth: true });
  }
}

export const slpService = new SlpService();
