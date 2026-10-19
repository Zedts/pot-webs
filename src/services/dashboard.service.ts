import { apiClient } from "@/lib/api-client";
import { ApiEndpoints } from "@/constants/api_endpoints";
import { ApiResponse } from "@/types/api";
import {
  ShiftType,
  getJakartaDateString,
  formatJakartaTime,
  isTimestampInShift,
} from "@/utils/shift.utils";
import { PenjualanModel } from "@/types/penjualan";

export type { PenjualanModel };

export interface LapakModel {
  id: string;
  nama: string;
  spg?: { nama: string; username?: string; shift?: string | null; no_hp?: string } | Array<{ nama: string; username?: string; shift?: string | null; no_hp?: string }> | null;
  users?: Array<{ nama: string; username?: string; shift?: string | null; no_hp?: string }>;
  shift_pagi?: [string, string] | null;
  shift_siang?: [string, string] | null;
}

export interface AbsensiModel {
  id: string;
  jam_masuk?: string | null;
  jam_pulang?: string | null;
  status?: string;
  shift_spg?: string | null;
  user?: { id: string; nama: string; username?: string; no_hp?: string; shift?: string | null } | null;
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
  spgNoHp?: string;
  spgShift: string | null;
  rawLapak?: LapakModel;
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
  shift: ShiftType | "all";
}

const getListData = <T>(res: PromiseSettledResult<ApiResponse<T[]>>): T[] =>
  res.status === "fulfilled" && Array.isArray(res.value?.data) ? res.value.data : [];

class DashboardService {
  async getDashboardData(activeShift: ShiftType | "all" = "all"): Promise<DashboardDataResult> {
    const targetDate = getJakartaDateString();

    const absensiUrl =
      activeShift && activeShift !== "all"
        ? `${ApiEndpoints.absensi}?tanggal=${targetDate}&shift_spg=${activeShift}`
        : `${ApiEndpoints.absensi}?tanggal=${targetDate}`;

    const [lapakRes, absensiRes, penjualanRes, pengirimanRes, stokRes, closingRes] =
      await Promise.allSettled([
        apiClient.get<LapakModel[]>(ApiEndpoints.lapak, { requiresAuth: true }),
        apiClient.get<AbsensiModel[]>(absensiUrl, { requiresAuth: true }),
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
      if (stallId) {
        const existing = absensiByLapak.get(stallId);
        if (!existing) {
          absensiByLapak.set(stallId, a);
        } else if (activeShift && activeShift !== "all") {
          if ((a.shift_spg || "").toLowerCase() === activeShift) {
            absensiByLapak.set(stallId, a);
          }
        } else {
          if (a.jam_masuk && (!existing.jam_masuk || a.jam_masuk > existing.jam_masuk)) {
            absensiByLapak.set(stallId, a);
          }
        }
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
        !activeShift || activeShift === "all"
          ? true
          : (spgId && clockedInSpgIds.has(spgId)) ||
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
      let spgNoHp = "";
      let spgShift: string | null = null;

      const spgList = Array.isArray(lapak.spg)
        ? lapak.spg
        : lapak.spg
        ? [lapak.spg]
        : Array.isArray(lapak.users)
        ? lapak.users
        : [];

      if (attendance?.user?.nama) {
        spgName = attendance.user.nama;
        spgUsername = attendance.user.username || "";
        spgNoHp = attendance.user.no_hp || "";
        const matchedUser = spgList.find(
          (u) =>
            (u.username && u.username === attendance.user?.username) ||
            u.nama === attendance.user?.nama
        );
        spgShift =
          attendance.user.shift ||
          attendance.shift_spg ||
          matchedUser?.shift ||
          null;
      } else if (spgList.length > 0) {
        const primaryUser =
          !activeShift || activeShift === "all"
            ? spgList[0]
            : spgList.find((u) => (u.shift || "").toLowerCase() === activeShift) || spgList[0];
        spgName = `${primaryUser.nama} (Belum Masuk)`;
        spgUsername = primaryUser.username || "";
        spgNoHp = primaryUser.no_hp || "";
        spgShift = primaryUser.shift || null;
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
        spgNoHp,
        spgShift,
        rawLapak: lapak,
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
