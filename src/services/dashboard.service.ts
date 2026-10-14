import { apiClient } from "@/lib/api-client";
import { ApiEndpoints } from "@/constants/api_endpoints";
import { ApiResponse } from "@/types/api";
import {
  ShiftType,
  getJakartaDateString,
  formatJakartaTime,
  isTimestampInShift,
} from "@/utils/shift.utils";

export interface LapakModel {
  id: string;
  nama: string;
  spg?: { nama: string; username?: string } | null;
  users?: Array<{ nama: string; username?: string; shift?: string | null }>;
}

export interface AbsensiModel {
  id: string;
  jam_masuk?: string | null;
  jam_pulang?: string | null;
  status?: string;
  user?: { id: string; nama: string; username?: string } | null;
  lapak?: { id: string } | null;
  lapak_id?: string;
}

export interface PenjualanModel {
  total_harga?: number;
  tanggal?: string;
  spg?: { id: string } | null;
  spg_id?: string;
  lapak?: { id: string } | null;
  lapak_id?: string;
}

export interface PengirimanModel {
  tanggal?: string;
  createdAt?: string;
}

export interface StokLapakModel {
  stok_akhir?: number;
  lapak?: { id: string } | null;
  lapak_id?: string;
}

export interface ClosingModel {
  status?: string;
  selisih_stok?: number;
  lapak?: { id: string } | null;
  lapak_id?: string;
}

export interface DashboardSummary {
  totalPenjualan: number;
  totalPengiriman: number;
  spgAktifCount: number;
  totalStallsCount: number;
  selisihStokCount: number;
}

export interface StatusLapakRow {
  lapakId: string;
  lapakNama: string;
  spgNama: string;
  spgUsername: string;
  jamMasuk: string;
  jamPulang: string;
  totalPenjualan: number;
  stokAkhir: number;
  closingStatus: "terverifikasi" | "pending" | "perlu_revisi" | "belum_closing";
  selisihStok: number | null;
}

export interface DashboardDataResult {
  summary: DashboardSummary;
  rows: StatusLapakRow[];
  date: string;
  shift: ShiftType;
}

const getListData = <T>(res: PromiseSettledResult<ApiResponse<T[]>>): T[] =>
  res.status === "fulfilled" && Array.isArray(res.value?.data) ? res.value.data : [];

class DashboardService {
  async getDashboardData(activeShift: ShiftType): Promise<DashboardDataResult> {
    const targetDate = getJakartaDateString();

    const [lapakRes, absensiRes, penjualanRes, pengirimanRes, stokRes, closingRes] =
      await Promise.allSettled([
        apiClient.get<LapakModel[]>(ApiEndpoints.lapak, { requiresAuth: true }),
        apiClient.get<AbsensiModel[]>(
          `${ApiEndpoints.absensi}?tanggal=${targetDate}&shift_spg=${activeShift}`,
          { requiresAuth: true }
        ),
        apiClient.get<PenjualanModel[]>(
          `${ApiEndpoints.penjualan}?tanggal=${targetDate}`,
          { requiresAuth: true }
        ),
        apiClient.get<PengirimanModel[]>(ApiEndpoints.pengiriman, { requiresAuth: true }),
        apiClient.get<StokLapakModel[]>(ApiEndpoints.stokLapak, { requiresAuth: true }),
        apiClient.get<ClosingModel[]>(
          `${ApiEndpoints.closing}?tanggal=${targetDate}`,
          { requiresAuth: true }
        ),
      ]);

    const lapakList = getListData(lapakRes);
    const absensiList = getListData(absensiRes);
    const penjualanList = getListData(penjualanRes);
    const rawPengirimanList = getListData(pengirimanRes);
    const stokLapakList = getListData(stokRes);
    const closingList = getListData(closingRes);

    // Index Absensi by lapak_id & count active SPG
    const absensiByLapak = new Map<string, AbsensiModel>();
    const clockedInSpgIds = new Set<string>();
    let spgAktifCount = 0;

    for (const a of absensiList) {
      const stallId = a.lapak?.id || a.lapak_id;
      if (stallId && !absensiByLapak.has(stallId)) {
        absensiByLapak.set(stallId, a);
      }
      if (a.user?.id) clockedInSpgIds.add(a.user.id);
      const st = (a.status || "").toLowerCase();
      if (st === "hadir" || st === "terlambat") spgAktifCount++;
    }

    // Index Penjualan by lapak_id for active shift
    const penjualanByLapak = new Map<string, number>();
    let totalPenjualanActiveShift = 0;

    for (const p of penjualanList) {
      const stallId = p.lapak?.id || p.lapak_id;
      const spgId = p.spg?.id || p.spg_id;
      const saleAmount = Number(p.total_harga || 0);

      const belongsToShift =
        (spgId && clockedInSpgIds.has(spgId)) ||
        (p.tanggal ? isTimestampInShift(p.tanggal, activeShift) : true);

      if (belongsToShift) {
        totalPenjualanActiveShift += saleAmount;
        if (stallId) {
          penjualanByLapak.set(stallId, (penjualanByLapak.get(stallId) || 0) + saleAmount);
        }
      }
    }

    // Index Stok Akhir by lapak_id
    const stokAkhirByLapak = new Map<string, number>();
    for (const s of stokLapakList) {
      const stallId = s.lapak_id || s.lapak?.id;
      if (stallId) {
        stokAkhirByLapak.set(stallId, (stokAkhirByLapak.get(stallId) || 0) + Number(s.stok_akhir || 0));
      }
    }

    // Index Closing by lapak_id & count discrepancies
    const closingByLapak = new Map<string, ClosingModel>();
    let selisihStokLapakCount = 0;

    for (const c of closingList) {
      const stallId = c.lapak?.id || c.lapak_id;
      if (stallId && !closingByLapak.has(stallId)) {
        closingByLapak.set(stallId, c);
      }
      if (Number(c.selisih_stok || 0) !== 0) selisihStokLapakCount++;
    }

    // Count today's shipments
    const totalPengiriman = rawPengirimanList.reduce((acc, pg) => {
      const rawDate = pg.tanggal || pg.createdAt;
      return rawDate && getJakartaDateString(new Date(rawDate)) === targetDate ? acc + 1 : acc;
    }, 0);

    // Build rows for each lapak
    const rows: StatusLapakRow[] = lapakList.map((lapak) => {
      const attendance = absensiByLapak.get(lapak.id);
      const closing = closingByLapak.get(lapak.id);

      let spgName = "-";
      let spgUsername = "-";

      if (attendance?.user?.nama) {
        spgName = attendance.user.nama;
        spgUsername = attendance.user.username || "";
      } else if (lapak.spg?.nama) {
        spgName = `${lapak.spg.nama} (Belum Masuk)`;
        spgUsername = lapak.spg.username || "";
      } else if (lapak.users && lapak.users.length > 0) {
        const primaryUser =
          lapak.users.find((u) => (u.shift || "").toLowerCase() === activeShift) || lapak.users[0];
        spgName = `${primaryUser.nama} (Belum Masuk)`;
        spgUsername = primaryUser.username || "";
      }

      let closingStatus: StatusLapakRow["closingStatus"] = "belum_closing";
      let selisihStok: number | null = null;

      if (closing) {
        const rawStatus = (closing.status || "").toLowerCase();
        closingStatus =
          rawStatus === "terverifikasi"
            ? "terverifikasi"
            : rawStatus === "perlu_revisi"
            ? "perlu_revisi"
            : "pending";
        selisihStok = Number(closing.selisih_stok || 0);
      }

      return {
        lapakId: lapak.id,
        lapakNama: lapak.nama,
        spgNama: spgName,
        spgUsername,
        jamMasuk: formatJakartaTime(attendance?.jam_masuk),
        jamPulang: formatJakartaTime(attendance?.jam_pulang),
        totalPenjualan: penjualanByLapak.get(lapak.id) || 0,
        stokAkhir: stokAkhirByLapak.get(lapak.id) || 0,
        closingStatus,
        selisihStok,
      };
    });

    return {
      summary: {
        totalPenjualan: totalPenjualanActiveShift,
        totalPengiriman,
        spgAktifCount,
        totalStallsCount: lapakList.length,
        selisihStokCount: selisihStokLapakCount,
      },
      rows,
      date: targetDate,
      shift: activeShift,
    };
  }
}

export const dashboardService = new DashboardService();
