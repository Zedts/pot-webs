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
import { UserModel } from "@/types/user";

export type { PenjualanModel };

export interface LapakModel {
  id: string;
  nama: string;
  spg?: { id?: string; spg_id?: string; nama: string; username?: string; shift?: string | null; no_hp?: string } | Array<{ id?: string; spg_id?: string; nama: string; username?: string; shift?: string | null; no_hp?: string }> | null;
  users?: Array<{ id?: string; spg_id?: string; nama: string; username?: string; shift?: string | null; no_hp?: string; role?: string }>;
  shift_pagi?: [string, string] | null;
  shift_siang?: [string, string] | null;
  shift_long?: [string, string] | null;
}

export interface AbsensiModel {
  id: string;
  jam_masuk?: string | null;
  jam_pulang?: string | null;
  status?: string;
  keterangan?: string;
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
  totalScheduledSpgCount: number;
  totalStallsCount: number;
  selisihStokCount: number;
}

export interface StatusLapakRow {
  userId?: string;
  lapakId: string;
  lapakNama: string;
  spgNama: string;
  spgUsername: string;
  spgNoHp?: string;
  spgShift: string | null;
  rawLapak?: LapakModel;
  jamMasuk: string;
  jamPulang: string;
  statusAbsensi?: string;
  keteranganAbsensi?: string;
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

    const [lapakRes, absensiRes, penjualanRes, pengirimanRes, stokRes, closingRes, usersRes] =
      await Promise.allSettled([
        apiClient.get<LapakModel[]>(ApiEndpoints.lapak, { requiresAuth: true }),
        apiClient.get<AbsensiModel[]>(`${ApiEndpoints.absensi}?tanggal=${targetDate}`, {
          requiresAuth: true,
        }),
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
        apiClient.get<UserModel[]>(ApiEndpoints.users, { requiresAuth: true }),
      ]);

    const lapakList = getListData(lapakRes);
    const absensiList = getListData(absensiRes);
    const penjualanList = getListData(penjualanRes);
    const rawPengirimanList = getListData(pengirimanRes);
    const stokLapakList = getListData(stokRes);
    const closingList = getListData(closingRes);
    const rawUsersList = getListData(usersRes);

    // 1. Map lapak by id for fast O(1) lookup
    const lapakMap = new Map<string, LapakModel>();
    for (const lapak of lapakList) {
      if (lapak.id) {
        lapakMap.set(lapak.id, lapak);
      }
    }

    // 2. Index Absensi by user id, username, and lapak id
    const absensiByUserId = new Map<string, AbsensiModel>();
    const absensiByUsername = new Map<string, AbsensiModel>();
    const absensiByLapak = new Map<string, AbsensiModel>();
    const clockedInSpgIds = new Set<string>();

    for (const a of absensiList) {
      if (a.user?.id) {
        absensiByUserId.set(a.user.id, a);
        clockedInSpgIds.add(a.user.id);
      }
      if (a.user?.username) {
        absensiByUsername.set(a.user.username.toLowerCase().trim(), a);
      }
      const stallId = a.lapak?.id || a.lapak_id;
      if (stallId && !absensiByLapak.has(stallId)) {
        absensiByLapak.set(stallId, a);
      }
    }

    // 3. Index Penjualan by spg_id and lapak_id for active shift
    const penjualanBySpg = new Map<string, number>();
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
        if (spgId) {
          penjualanBySpg.set(spgId, (penjualanBySpg.get(spgId) || 0) + saleAmount);
        }
        if (stallId) {
          penjualanByLapak.set(stallId, (penjualanByLapak.get(stallId) || 0) + saleAmount);
        }
      }
    }

    // 4. Index Stok Akhir by lapak_id
    const stokAkhirByLapak = new Map<string, number>();
    for (const s of stokLapakList) {
      const stallId = s.lapak_id || s.lapak?.id;
      if (stallId) {
        stokAkhirByLapak.set(stallId, (stokAkhirByLapak.get(stallId) || 0) + Number(s.stok_akhir || 0));
      }
    }

    // 5. Index Closing by spg_id and lapak_id & count discrepancies
    const closingBySpg = new Map<string, ClosingModel>();
    const closingByLapak = new Map<string, ClosingModel>();
    let selisihStokLapakCount = 0;

    for (const c of closingList) {
      const spgId = (c as any).spg_id || (c as any).spg?.id;
      if (spgId && !closingBySpg.has(spgId)) {
        closingBySpg.set(spgId, c);
      }
      const stallId = c.lapak?.id || c.lapak_id;
      if (stallId && !closingByLapak.has(stallId)) {
        closingByLapak.set(stallId, c);
      }
      if (Number(c.selisih_stok || 0) !== 0) selisihStokLapakCount++;
    }

    // 6. Count today's shipments
    const totalPengiriman = rawPengirimanList.reduce((acc, pg) => {
      const rawDate = pg.tanggal || pg.createdAt;
      return rawDate && getJakartaDateString(new Date(rawDate)) === targetDate ? acc + 1 : acc;
    }, 0);

    // 7. Consolidate all users from rawUsersList, lapakList, and absensiList
    const usersMap = new Map<string, {
      id: string;
      nama: string;
      username?: string;
      no_hp?: string;
      shift?: string | null;
      lapak_id?: string | null;
    }>();

    for (const u of rawUsersList) {
      if (u.id) {
        usersMap.set(u.id, {
          id: u.id,
          nama: u.nama || "",
          username: u.username || "",
          no_hp: u.no_hp || "",
          shift: u.shift || null,
          lapak_id: u.lapak_id || null,
        });
      }
    }

    for (const lapak of lapakList) {
      const assigned = [
        ...(Array.isArray(lapak.users) ? lapak.users : []),
        ...(Array.isArray(lapak.spg) ? lapak.spg : lapak.spg ? [lapak.spg] : []),
      ];

      for (const u of assigned) {
        const uid = (u as any).id || (u as any).spg_id;
        if (uid) {
          const existing = usersMap.get(uid);
          if (existing) {
            if (!existing.lapak_id) existing.lapak_id = lapak.id;
            if (!existing.shift && u.shift) existing.shift = u.shift;
            if (!existing.nama && u.nama) existing.nama = u.nama;
            if (!existing.username && u.username) existing.username = u.username;
            if (!existing.no_hp && u.no_hp) existing.no_hp = u.no_hp;
          } else {
            usersMap.set(uid, {
              id: uid,
              nama: u.nama || "",
              username: u.username || "",
              no_hp: u.no_hp || "",
              shift: u.shift || null,
              lapak_id: lapak.id,
            });
          }
        }
      }
    }

    for (const a of absensiList) {
      const uid = a.user?.id;
      const stallId = a.lapak?.id || a.lapak_id;
      const shift = a.user?.shift || a.shift_spg;
      if (uid && a.user?.nama) {
        const existing = usersMap.get(uid);
        if (existing) {
          if (!existing.lapak_id && stallId) existing.lapak_id = stallId;
          if (!existing.shift && shift) existing.shift = shift;
        } else {
          usersMap.set(uid, {
            id: uid,
            nama: a.user.nama,
            username: a.user.username || "",
            no_hp: a.user.no_hp || "",
            shift: shift || null,
            lapak_id: stallId || null,
          });
        }
      }
    }

    // 8. Filter strictly: ONLY users who have an assigned lapak AND have a designated shift
    const qualifyingUsers = Array.from(usersMap.values()).filter((u) => {
      const cleanLapakId = String(u.lapak_id || "").trim();
      const hasLapak = Boolean(
        cleanLapakId &&
        cleanLapakId.toLowerCase() !== "null" &&
        cleanLapakId.toLowerCase() !== "undefined" &&
        lapakMap.has(cleanLapakId)
      );
      const cleanShift = String(u.shift || "").trim();
      const hasShift = Boolean(
        cleanShift &&
        cleanShift.toLowerCase() !== "null" &&
        cleanShift.toLowerCase() !== "undefined"
      );
      return hasLapak && hasShift;
    });

    // 9. Compute scheduled staff belonging to activeShift and active attendance count
    const scheduledUsersForShift = qualifyingUsers.filter((u) => {
      if (!activeShift || activeShift === "all") return true;
      const userShift = (u.shift || "").toLowerCase().trim();
      return userShift === activeShift.toLowerCase().trim();
    });

    const spgAktifCount = scheduledUsersForShift.filter((u) => {
      const attendance =
        (u.id ? absensiByUserId.get(u.id) : undefined) ||
        (u.username ? absensiByUsername.get(u.username.toLowerCase().trim()) : undefined);
      const st = (attendance?.status || "").toLowerCase().trim();
      return st === "hadir" || st === "terlambat";
    }).length;

    // 10. Build status rows for each qualifying user
    const rows: StatusLapakRow[] = qualifyingUsers.map((user) => {
      const lapak = lapakMap.get(String(user.lapak_id).trim())!;

      const attendance =
        (user.id ? absensiByUserId.get(user.id) : undefined) ||
        (user.username ? absensiByUsername.get(user.username.toLowerCase().trim()) : undefined);

      const closing =
        (user.id ? closingBySpg.get(user.id) : undefined) ||
        closingByLapak.get(lapak.id);

      const spgName = attendance?.user?.nama || user.nama;
      const spgUsername = user.username || attendance?.user?.username || "";
      const spgNoHp = user.no_hp || attendance?.user?.no_hp || "";
      const spgShift = user.shift || attendance?.shift_spg || null;

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

      const totalPenjualan =
        (user.id && penjualanBySpg.has(user.id))
          ? (penjualanBySpg.get(user.id) || 0)
          : (penjualanByLapak.get(lapak.id) || 0);

      return {
        userId: user.id,
        lapakId: lapak.id,
        lapakNama: lapak.nama,
        spgNama: spgName,
        spgUsername,
        spgNoHp,
        spgShift,
        rawLapak: lapak,
        jamMasuk: formatJakartaTime(attendance?.jam_masuk),
        jamPulang: formatJakartaTime(attendance?.jam_pulang),
        statusAbsensi: attendance?.status?.toLowerCase(),
        keteranganAbsensi: attendance?.keterangan || "",
        totalPenjualan,
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
        totalScheduledSpgCount: scheduledUsersForShift.length,
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
