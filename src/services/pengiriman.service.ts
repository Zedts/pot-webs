import { apiClient } from "@/lib/api-client";
import { ApiEndpoints } from "@/constants/api_endpoints";
import { ApiResponse } from "@/types/api";
import {
  PengirimanModel,
  PenerimaanModel,
  ProdukModel,
  LapakSimple,
  CreatePengirimanPayload,
  UpdatePengirimanPayload,
  PengirimanStatus,
  PengirimanSummary,
  PengirimanTableRow,
} from "@/types/pengiriman";
import {
  getJakartaDateString,
  formatJakartaTime,
  TIMEZONE_WIB,
} from "@/utils/shift.utils";

interface AbsensiSimple {
  id: string;
  lapak_id?: string;
  lapak?: { id: string } | null;
  shift_spg?: string | null;
  status?: string;
  user?: { id: string; nama: string; username?: string } | null;
}

export interface PengirimanPageData {
  rows: PengirimanTableRow[];
  draftRows: PengirimanTableRow[];
  summary: PengirimanSummary;
  lapakList: LapakSimple[];
  date: string;
}

const getListData = <T>(res: PromiseSettledResult<ApiResponse<T[]>>): T[] =>
  res.status === "fulfilled" && Array.isArray(res.value?.data) ? res.value.data : [];

export class PengirimanService {
  /**
   * Resolves the receiver SPG name for a shipment based on receipt confirmation,
   * delivery time, lapak shift window, active attendance, and scheduled stall users.
   */
  resolveSpgReceiver(
    shipment: PengirimanModel,
    lapakMap: Map<string, LapakSimple>,
    absensiMap: Map<string, AbsensiSimple>,
    penerimaanMap: Map<string, PenerimaanModel>
  ): { nama: string; username?: string; no_hp?: string } {
    // 1. If physical receipt is already recorded, use the receiving SPG
    const receipt = penerimaanMap.get(shipment.id);
    if (receipt?.spg?.nama) {
      return {
        nama: receipt.spg.nama,
        username: (receipt.spg as any).username,
        no_hp: (receipt.spg as any).no_hp,
      };
    }

    const lapak = lapakMap.get(shipment.lapak_id) || shipment.lapak;

    // 2. Determine target shift from delivery timestamp in WIB
    const rawTime = shipment.tanggal || shipment.createdAt;
    let targetShift: "pagi" | "siang" = "pagi";

    if (rawTime) {
      try {
        const d = new Date(rawTime);
        if (!isNaN(d.getTime())) {
          const hour = parseInt(
            new Intl.DateTimeFormat("en-US", {
              timeZone: TIMEZONE_WIB,
              hour12: false,
              hour: "numeric",
            }).format(d),
            10
          );
          targetShift = hour < 13 ? "pagi" : "siang";
        }
      } catch {
        targetShift = "pagi";
      }
    }

    // 3. Check active attendance in this lapak for the resolved shift
    const attendanceKey = `${shipment.lapak_id}_${targetShift}`;
    const attendance = absensiMap.get(attendanceKey);
    if (attendance?.user?.nama) {
      return {
        nama: attendance.user.nama,
        username: attendance.user.username,
        no_hp: (attendance.user as any).no_hp,
      };
    }

    // 4. Check scheduled users assigned to this lapak matching the target shift
    const spgList = Array.isArray(lapak?.spg) ? lapak.spg : (lapak?.spg ? [lapak.spg] : []);
    if (spgList.length > 0) {
      const scheduled = spgList.find(
        (u) => (u.shift || "").toLowerCase() === targetShift
      );
      if (scheduled?.nama) {
        return {
          nama: `${scheduled.nama} (Terjadwal)`,
          username: scheduled.username,
          no_hp: scheduled.no_hp,
        };
      }
      if (spgList[0]?.nama) {
        return {
          nama: `${spgList[0].nama} (Utama)`,
          username: spgList[0].username,
          no_hp: spgList[0].no_hp,
        };
      }
    }

    return { nama: "-" };
  }

  /**
   * Parallel retrieval of shipments, receipts, lapak, and attendance data.
   * Computes both table rows, draft confirmation queue, and 5 summary cards.
   */
  async getPengirimanPageData(customDate?: string): Promise<PengirimanPageData> {
    const targetDate = customDate || getJakartaDateString();

    const [pengirimanRes, penerimaanRes, lapakRes, absensiRes] =
      await Promise.allSettled([
        apiClient.get<PengirimanModel[]>(ApiEndpoints.pengiriman, {
          requiresAuth: true,
        }),
        apiClient.get<PenerimaanModel[]>(ApiEndpoints.penerimaan, {
          requiresAuth: true,
        }),
        apiClient.get<LapakSimple[]>(ApiEndpoints.lapak, {
          requiresAuth: true,
        }),
        apiClient.get<AbsensiSimple[]>(
          `${ApiEndpoints.absensi}?tanggal=${targetDate}`,
          { requiresAuth: true }
        ),
      ]);

    const pengirimanList = getListData(pengirimanRes);
    const penerimaanList = getListData(penerimaanRes);
    const lapakList = getListData(lapakRes);
    const absensiList = getListData(absensiRes);

    // Index lapak by id
    const lapakMap = new Map<string, LapakSimple>();
    for (const l of lapakList) {
      lapakMap.set(l.id, l);
    }

    // Index receipts by shipment id
    const penerimaanMap = new Map<string, PenerimaanModel>();
    for (const r of penerimaanList) {
      if (r.pengiriman_id) {
        penerimaanMap.set(r.pengiriman_id, r);
      }
    }

    // Index attendance by lapakId_shift
    const absensiMap = new Map<string, AbsensiSimple>();
    for (const a of absensiList) {
      const lid = a.lapak?.id || a.lapak_id;
      const shift = (a.shift_spg || "pagi").toLowerCase();
      const status = (a.status || "").toLowerCase();
      if (lid && (status === "hadir" || status === "terlambat")) {
        absensiMap.set(`${lid}_${shift}`, a);
      }
    }

    // Metrics accumulators for today
    let totalUnitKirim = 0;
    let totalStatusSelesai = 0;
    let totalDalamPerjalanan = 0;
    let totalSesuai = 0;
    let totalSelisih = 0;
    let totalVarian = 0;
    const todayLapakIds = new Set<string>();

    const rows: PengirimanTableRow[] = [];
    const draftRows: PengirimanTableRow[] = [];

    for (const p of pengirimanList) {
      const rawDate = p.tanggal || p.createdAt;
      const isToday =
        rawDate && getJakartaDateString(new Date(rawDate)) === targetDate;

      const lapak = lapakMap.get(p.lapak_id) || p.lapak;
      const receipt = penerimaanMap.get(p.id);
      const receiver = this.resolveSpgReceiver(
        p,
        lapakMap,
        absensiMap,
        penerimaanMap
      );

      const row: PengirimanTableRow = {
        id: p.id,
        uniqueId: p.unique_id || `#PG-${p.id.slice(-6).toUpperCase()}`,
        lapakNama: lapak?.nama || "Lapak Tidak Ditemukan",
        lapakId: p.lapak_id,
        penerimaSpg: receiver.nama,
        penerimaUsername: receiver.username,
        penerimaNoHp: receiver.no_hp,
        waktuKirim: formatJakartaTime(p.createdAt || rawDate),
        totalItems: p.total_items || 0,
        qtyKirim: p.qty_kirim || 0,
        status: p.status,
        statusPenerimaan: receipt?.status || null,
        tanggalRaw: p.createdAt || rawDate || null,
      };

      rows.push(row);

      // Separate draft queue for Tab 2
      if (p.status === "draft") {
        draftRows.push(row);
      }

      // Compute metrics if shipment belongs to today
      if (isToday) {
        totalUnitKirim += p.qty_kirim || 0;
        totalVarian += p.total_items || 0;
        if (p.lapak_id) todayLapakIds.add(p.lapak_id);

        if (p.status === "selesai") {
          totalStatusSelesai++;
        } else if (p.status === "dikirim_viar" || p.status === "draft") {
          totalDalamPerjalanan++;
        }

        if (receipt) {
          if (receipt.status === "sesuai") totalSesuai++;
          else if (receipt.status === "selisih") totalSelisih++;
        }
      }
    }

    // Sort rows descending by delivery date / creation time
    rows.sort((a, b) => {
      const tA = a.tanggalRaw ? new Date(a.tanggalRaw).getTime() : 0;
      const tB = b.tanggalRaw ? new Date(b.tanggalRaw).getTime() : 0;
      return tB - tA;
    });

    draftRows.sort((a, b) => {
      const tA = a.tanggalRaw ? new Date(a.tanggalRaw).getTime() : 0;
      const tB = b.tanggalRaw ? new Date(b.tanggalRaw).getTime() : 0;
      return tB - tA;
    });

    const todayShipmentsCount = rows.filter((r) => {
      return (
        r.tanggalRaw &&
        getJakartaDateString(new Date(r.tanggalRaw)) === targetDate
      );
    }).length;

    const summary: PengirimanSummary = {
      totalPengirimanHariIni: todayShipmentsCount,
      totalUnitKirim,
      totalStatusSelesai,
      totalDalamPerjalanan,
      totalSesuai,
      totalSelisih,
      totalLapakTujuan: todayLapakIds.size,
      totalVarian,
      draftCount: draftRows.length,
    };

    return {
      rows,
      draftRows,
      summary,
      lapakList,
      date: targetDate,
    };
  }

  /**
   * Retrieves single shipment with populated items, lapak, and creator
   */
  async getPengirimanById(id: string): Promise<PengirimanModel> {
    const res = await apiClient.get<PengirimanModel>(
      `${ApiEndpoints.pengiriman}/${id}`,
      { requiresAuth: true }
    );
    if (!res.data) {
      throw new Error("Data pengiriman tidak ditemukan.");
    }

    const shipment = res.data;
    const creatorId = shipment.creator?.id || shipment.created_by;
    if (creatorId && (!shipment.creator?.username || !shipment.creator?.no_hp)) {
      try {
        const userRes = await apiClient.get<{ username?: string; no_hp?: string; nama?: string }>(
          `${ApiEndpoints.users}/${creatorId}`,
          { requiresAuth: true }
        );
        if (userRes.data) {
          if (!shipment.creator) {
            shipment.creator = {
              id: creatorId,
              nama: userRes.data.nama || "Admin",
              email: "",
              role: "",
            };
          }
          shipment.creator.username = userRes.data.username || shipment.creator.username;
          shipment.creator.no_hp = userRes.data.no_hp || shipment.creator.no_hp;
        }
      } catch {
        // Fallback gracefully without breaking shipment preview
      }
    }

    return shipment;
  }

  /**
   * Creates a new shipment atomically with line items
   */
  async createPengiriman(
    payload: CreatePengirimanPayload
  ): Promise<PengirimanModel> {
    const res = await apiClient.post<PengirimanModel>(
      ApiEndpoints.pengiriman,
      payload,
      { requiresAuth: true }
    );
    if (!res.data) {
      throw new Error("Gagal membuat data pengiriman.");
    }
    return res.data;
  }

  /**
   * Updates shipment metadata (lapak_id, tanggal, status)
   */
  async updatePengiriman(
    id: string,
    payload: UpdatePengirimanPayload
  ): Promise<PengirimanModel> {
    const res = await apiClient.put<PengirimanModel>(
      `${ApiEndpoints.pengiriman}/${id}`,
      payload,
      { requiresAuth: true }
    );
    if (!res.data) {
      throw new Error("Gagal memperbarui data pengiriman.");
    }
    return res.data;
  }

  /**
   * Transitions shipment status (used for Tab 2 confirmation: draft -> dikirim_viar)
   */
  async updateShipmentStatus(
    id: string,
    status: PengirimanStatus
  ): Promise<PengirimanModel> {
    const res = await apiClient.patch<PengirimanModel>(
      `${ApiEndpoints.pengiriman}/${id}/status`,
      { status },
      { requiresAuth: true }
    );
    if (!res.data) {
      throw new Error("Gagal mengonfirmasi status pengiriman.");
    }
    return res.data;
  }

  /**
   * Deletes a shipment record
   */
  async deletePengiriman(id: string): Promise<void> {
    await apiClient.delete(`${ApiEndpoints.pengiriman}/${id}`, {
      requiresAuth: true,
    });
  }

  /**
   * Fetches active product list for the create shipment form
   */
  async getActiveProducts(): Promise<ProdukModel[]> {
    const res = await apiClient.get<ProdukModel[]>(ApiEndpoints.produk, {
      requiresAuth: true,
    });
    const list = Array.isArray(res.data) ? res.data : [];
    return list.filter((p) => p.is_active !== false);
  }

  /**
   * Fetches receipt record for a specific shipment
   */
  async getPenerimaanByPengirimanId(
    pengirimanId: string
  ): Promise<PenerimaanModel | null> {
    try {
      const res = await apiClient.get<PenerimaanModel[]>(
        `${ApiEndpoints.penerimaan}?pengiriman_id=${pengirimanId}`,
        { requiresAuth: true }
      );
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data[0];
      }
      return null;
    } catch (err: unknown) {
      // 404 indicates no receipt recorded yet, which is expected during draft/in-transit lifecycle
      const statusCode = (err as { statusCode?: number })?.statusCode;
      if (statusCode === 404) {
        return null;
      }
      console.warn(`[PengirimanService] Unable to fetch receipt for shipment ${pengirimanId}:`, err);
      return null;
    }
  }
}

export const pengirimanService = new PengirimanService();
