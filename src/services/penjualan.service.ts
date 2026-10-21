import { apiClient } from "@/lib/api-client";
import { ApiEndpoints } from "@/constants/api_endpoints";
import {
  PenjualanModel,
  PenjualanTableRow,
  PenjualanSummaryMetrics,
  UpdatePenjualanPayload,
  MetodePembayaranType,
} from "@/types/penjualan";
import { getJakartaDateString } from "@/utils/shift.utils";

export interface PenjualanFilters {
  lapak_id?: string;
  spg_id?: string;
  tanggal?: string;
  metode_pembayaran?: string;
}

export class PenjualanService {
  /**
   * Retrieve all sales transactions with optional query filters
   */
  async getAllPenjualan(filters: PenjualanFilters = {}): Promise<PenjualanModel[]> {
    const params = new URLSearchParams();
    if (filters.lapak_id && filters.lapak_id !== "all") {
      params.append("lapak_id", filters.lapak_id);
    }
    if (filters.spg_id && filters.spg_id !== "all") {
      params.append("spg_id", filters.spg_id);
    }
    if (filters.metode_pembayaran && filters.metode_pembayaran !== "all") {
      params.append("metode_pembayaran", filters.metode_pembayaran);
    }
    if (filters.tanggal) {
      params.append("tanggal", filters.tanggal);
    }

    const queryStr = params.toString();
    const endpoint = queryStr
      ? `${ApiEndpoints.penjualan}?${queryStr}`
      : ApiEndpoints.penjualan;

    const response = await apiClient.get<PenjualanModel[]>(endpoint, {
      requiresAuth: true,
    });

    return Array.isArray(response.data) ? response.data : [];
  }

  /**
   * Retrieve a single sales transaction by document ID with full relational details
   */
  async getPenjualanById(id: string): Promise<PenjualanModel> {
    const response = await apiClient.get<PenjualanModel>(
      `${ApiEndpoints.penjualan}/${id}`,
      { requiresAuth: true }
    );

    if (!response.data) {
      throw new Error(`Data transaksi penjualan dengan ID ${id} tidak ditemukan.`);
    }

    return response.data;
  }

  /**
   * Update sales transaction metadata (payment method, remarks, or attach proof image)
   */
  async updatePenjualan(
    id: string,
    payload: UpdatePenjualanPayload
  ): Promise<PenjualanModel> {
    if (payload.bukti_bayar instanceof File) {
      const formData = new FormData();
      formData.append("bukti_bayar", payload.bukti_bayar);
      if (payload.metode_pembayaran) {
        formData.append("metode_pembayaran", payload.metode_pembayaran);
      }
      if (payload.catatan !== undefined) {
        formData.append("catatan", payload.catatan);
      }
      if (payload.kembalian_disimpan !== undefined) {
        formData.append("kembalian_disimpan", String(payload.kembalian_disimpan));
      }

      const response = await apiClient.put<PenjualanModel>(
        `${ApiEndpoints.penjualan}/${id}`,
        formData,
        { requiresAuth: true }
      );
      return response.data!;
    }

    const body: Record<string, unknown> = {};
    if (payload.metode_pembayaran !== undefined) {
      body.metode_pembayaran = payload.metode_pembayaran;
    }
    if (payload.catatan !== undefined) {
      body.catatan = payload.catatan;
    }
    if (payload.kembalian_disimpan !== undefined) {
      body.kembalian_disimpan = payload.kembalian_disimpan;
    }
    if (payload.bukti_bayar_url !== undefined) {
      body.bukti_bayar_url = payload.bukti_bayar_url;
    }

    const response = await apiClient.put<PenjualanModel>(
      `${ApiEndpoints.penjualan}/${id}`,
      body,
      { requiresAuth: true }
    );

    return response.data!;
  }

  /**
   * Delete sales transaction and atomically rollback inventory stock
   */
  async deletePenjualan(id: string): Promise<boolean> {
    await apiClient.delete(`${ApiEndpoints.penjualan}/${id}`, {
      requiresAuth: true,
    });
    return true;
  }

  /**
   * Compute daily summary metrics for today (only that day)
   */
  computeDailyMetrics(
    sales: PenjualanModel[],
    targetDateStr?: string
  ): PenjualanSummaryMetrics {
    const todayStr = targetDateStr || getJakartaDateString();

    const todaySales = sales.filter((s) => {
      const rawDate = s.tanggal || s.createdAt;
      if (!rawDate) return false;
      try {
        const itemDateStr = getJakartaDateString(new Date(rawDate));
        return itemDateStr === todayStr;
      } catch {
        return false;
      }
    });

    let todayRevenue = 0;
    let qrisCount = 0;
    let qrisNominal = 0;
    let transferCount = 0;
    let transferNominal = 0;
    let tunaiCount = 0;
    let tunaiNominal = 0;
    let totalKembalianDisimpan = 0;
    let kembalianDisimpanCount = 0;

    for (const sale of todaySales) {
      const price = Number(sale.total_harga || 0);
      todayRevenue += price;

      const changeKept = Number(sale.kembalian_disimpan || 0);
      if (changeKept > 0) {
        totalKembalianDisimpan += changeKept;
        kembalianDisimpanCount++;
      }

      const method = (sale.metode_pembayaran || "tunai").toLowerCase().trim();
      if (method === "qris") {
        qrisCount++;
        qrisNominal += price;
      } else if (method === "transfer") {
        transferCount++;
        transferNominal += price;
      } else {
        tunaiCount++;
        tunaiNominal += price;
      }
    }

    const totalCount = todaySales.length;

    return {
      todayTransactionsCount: totalCount,
      todayTotalRevenue: todayRevenue,
      qris: {
        count: qrisCount,
        totalNominal: qrisNominal,
        percentage: todayRevenue > 0 ? (qrisNominal / todayRevenue) * 100 : 0,
      },
      transfer: {
        count: transferCount,
        totalNominal: transferNominal,
        percentage: todayRevenue > 0 ? (transferNominal / todayRevenue) * 100 : 0,
      },
      tunai: {
        count: tunaiCount,
        totalNominal: tunaiNominal,
        percentage: todayRevenue > 0 ? (tunaiNominal / todayRevenue) * 100 : 0,
      },
      totalKembalianDisimpan,
      kembalianDisimpanCount,
    };
  }

  /**
   * Transform raw API model list into structured table rows
   */
  mapToTableRows(sales: PenjualanModel[]): PenjualanTableRow[] {
    return sales.map((s) => {
      const rawMethod = (s.metode_pembayaran || "tunai").toLowerCase().trim();
      const normalizedMethod: MetodePembayaranType =
        rawMethod === "qris" || rawMethod === "transfer" ? rawMethod : "tunai";

      const totalItems = Array.isArray(s.items)
        ? s.items.reduce((sum, it) => sum + Number(it.qty || 0), 0)
        : 0;

      return {
        id: s.id,
        lapakId: s.lapak?.id || "",
        lapakNama: s.lapak?.nama || "Lapak Tidak Diketahui",
        lapakLokasi: s.lapak?.lokasi || "",
        metodePembayaran: normalizedMethod,
        tanggalRaw: s.tanggal,
        spgId: s.spg?.id || "",
        spgNama: s.spg?.nama || "SPG Belum Ditugaskan",
        spgUsername: s.spg?.username,
        spgNoHp: s.spg?.no_hp,
        totalHarga: Number(s.total_harga || 0),
        totalItemsCount: totalItems,
        kembalianDisimpan: Number(s.kembalian_disimpan || 0),
        catatan: s.catatan || "",
        hasBukti: Boolean(s.bukti_bayar_url || s.bukti_qris_url),
        raw: s,
      };
    });
  }
}

export const penjualanService = new PenjualanService();
