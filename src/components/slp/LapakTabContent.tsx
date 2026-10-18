"use client";

import React, { useState, useMemo } from "react";
import { LapakModel, SpgUserOption, AbsensiSummaryItem } from "@/types/slp";
import { resolveCurrentActiveShift, formatJakartaTime } from "@/utils/shift.utils";
import { LapakFormModal } from "./LapakFormModal";
import { LapakDetailModal } from "./LapakDetailModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { SearchableSelect, SelectOption } from "@/components/ui/SearchableSelect";
import { HugeIcon } from "@/components/ui/HugeIcon";
import {
  PlusSignIcon,
  Search01Icon,
  ViewIcon,
  Edit01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";

interface LapakTabContentProps {
  rows?: LapakModel[];
  lapakList?: LapakModel[];
  spgUsers: SpgUserOption[];
  todayAbsensi?: AbsensiSummaryItem[];
  isLoading: boolean;
  canManage: boolean;
  onRefresh?: () => Promise<void>;
  onCreate: (payload: any) => Promise<void>;
  onUpdate: (id: string, payload: any, previousSpgIds?: string[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const spgStatusOptions: SelectOption[] = [
  { value: "all", label: "Semua Status SPG" },
  { value: "with_spg", label: "Lapak Terisi SPG" },
  { value: "no_spg", label: "Belum Ada SPG" },
];

export function LapakTabContent({
  rows,
  lapakList,
  spgUsers,
  todayAbsensi,
  isLoading,
  canManage,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete,
}: LapakTabContentProps) {
  const allLapakList = rows || lapakList || [];
  const currentActiveShift = resolveCurrentActiveShift();

  const absensiMap = useMemo(() => {
    const map = new Map<string, AbsensiSummaryItem>();
    if (todayAbsensi && Array.isArray(todayAbsensi)) {
      for (const a of todayAbsensi) {
        const stallId = a.lapak_id || a.lapak?.id;
        if (stallId) map.set(stallId, a);
      }
    }
    return map;
  }, [todayAbsensi]);
  const [searchTerm, setSearchTerm] = useState("");
  const [spgFilter, setSpgFilter] = useState("all");

  // Modals state
  const [formModal, setFormModal] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    lapak?: LapakModel;
  }>({ isOpen: false, mode: "create" });

  const [detailModalLapak, setDetailModalLapak] = useState<LapakModel | null>(null);
  const [deletingLapak, setDeletingLapak] = useState<LapakModel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Client-side filtering
  const filteredLapakList = useMemo(() => {
    return allLapakList.filter((lapak) => {
      // 1. Search Query
      const q = searchTerm.toLowerCase().trim();
      const matchName = lapak.nama?.toLowerCase().includes(q);
      const matchLokasi = lapak.lokasi?.toLowerCase().includes(q);
      const spgArr = Array.isArray(lapak.spg)
        ? lapak.spg
        : lapak.spg
        ? [lapak.spg]
        : [];
      const matchSpg = spgArr.some(
        (u) =>
          u.nama?.toLowerCase().includes(q) ||
          (u.username && u.username.toLowerCase().includes(q))
      );
      const matchesSearch = !q || matchName || matchLokasi || matchSpg;

      // 2. SPG Status Filter
      const hasSpg = spgArr.length > 0 || Boolean(lapak.spg_id);
      let matchesFilter = true;
      if (spgFilter === "with_spg") matchesFilter = hasSpg;
      else if (spgFilter === "no_spg") matchesFilter = !hasSpg;

      return matchesSearch && matchesFilter;
    });
  }, [allLapakList, searchTerm, spgFilter]);

  const handleConfirmDelete = async () => {
    if (!deletingLapak) return;
    setIsDeleting(true);
    try {
      await onDelete(deletingLapak.id);
      setDeletingLapak(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Top Filter and Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-2xl border border-[#F3E7D8] shadow-sm">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <HugeIcon icon={Search01Icon} size={16} strokeWidth={2} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama lapak, lokasi, atau SPG..."
              className="w-full pl-9 pr-8 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E] transition-all font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* SPG Filter with SearchableSelect */}
          <div className="min-w-[180px]">
            <SearchableSelect
              options={spgStatusOptions}
              value={spgFilter}
              onChange={setSpgFilter}
              placeholder="Semua Status SPG"
            />
          </div>
        </div>

        {/* Action Button: Create New Lapak */}
        {canManage && (
          <button
            type="button"
            onClick={() => setFormModal({ isOpen: true, mode: "create" })}
            className="px-4 py-2 bg-[#A81B1B] hover:bg-[#8B1717] text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <HugeIcon icon={PlusSignIcon} size={16} />
            <span>Tambah Lapak Baru</span>
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-[#F3E7D8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-[#18314E] text-white text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th scope="col" className="px-5 py-3.5">Nama Lapak & Alamat</th>
                <th scope="col" className="px-5 py-3.5">SPG Bertugas</th>
                <th scope="col" className="px-5 py-3.5">Shift Operasional</th>
                <th scope="col" className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-36" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded w-32" /></td>
                    <td className="px-5 py-4 text-right"><div className="h-8 bg-slate-200 rounded-xl w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredLapakList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    Tidak ada outlet lapak yang sesuai filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredLapakList.map((lapak) => {
                  const spgUsersArr = Array.isArray(lapak.spg)
                    ? lapak.spg
                    : lapak.spg
                    ? [lapak.spg]
                    : [];

                  return (
                    <tr key={lapak.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Nama & Alamat */}
                      <td className="px-5 py-4 font-medium text-slate-800">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{lapak.nama}</span>
                          <span className="text-xs text-slate-400 mt-0.5">
                            {lapak.lokasi || "Lokasi belum diisi"}
                          </span>
                        </div>
                      </td>

                      {/* SPG Bertugas */}
                      <td className="px-5 py-4 text-slate-700">
                        {(() => {
                          const attendance = absensiMap.get(lapak.id);
                          const hasAttendance = Boolean(attendance?.user?.nama);

                          if (spgUsersArr.length === 0 && !hasAttendance) {
                            return (
                              <span className="text-xs text-slate-400 italic">
                                Belum ada staf
                              </span>
                            );
                          }

                          // Filter out attendance user from scheduled list if already shown
                          const scheduledList = spgUsersArr.filter(
                            (u) => !(hasAttendance && (attendance?.user?.id === u.id || attendance?.user?.id === (u as any).spg_id))
                          );

                          // Combine for capping (max 2 visible cards)
                          const maxScheduledVisible = hasAttendance ? 1 : 2;
                          const visibleScheduled = scheduledList.slice(0, maxScheduledVisible);
                          const totalStaffCount = (hasAttendance ? 1 : 0) + scheduledList.length;
                          const hiddenCount = totalStaffCount - ((hasAttendance ? 1 : 0) + visibleScheduled.length);

                          return (
                            <div className="flex flex-col gap-1.5">
                              <div className="flex flex-wrap gap-1.5 items-center">
                                {/* Clocked-in attendee via attendance */}
                                {hasAttendance && attendance?.user && (
                                  <div className="inline-flex flex-col px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                      <span>{attendance.user.nama}</span>
                                      <span className="text-[10px] text-emerald-600 font-medium">
                                        ({attendance.jam_masuk ? formatJakartaTime(attendance.jam_masuk) : "Hadir"} • Shift {attendance.shift ? (attendance.shift.toLowerCase() === "pagi" ? "Pagi" : "Siang") : (currentActiveShift === "pagi" ? "Pagi" : "Siang")})
                                      </span>
                                    </div>
                                    {(attendance.user.username || (attendance.user as any).no_hp) && (
                                      <div className="text-[10px] text-emerald-700/80 font-normal pl-3">
                                        {attendance.user.username ? `@${attendance.user.username}` : ""}
                                        {attendance.user.username && (attendance.user as any).no_hp ? " • " : ""}
                                        {(attendance.user as any).no_hp || ""}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Scheduled staff (up to limit) */}
                                {visibleScheduled.map((u, i) => {
                                  const isShiftActive = (u.shift || "").toLowerCase() === currentActiveShift;
                                  const shiftLabel = u.shift ? (u.shift.toLowerCase() === "pagi" ? "Pagi" : "Siang") : null;

                                  return (
                                    <div
                                      key={u.id || (u as any).spg_id || i}
                                      className={`inline-flex flex-col px-2.5 py-1 rounded-xl text-xs font-medium border transition-all ${
                                        isShiftActive
                                          ? "bg-[#EFF4F9] text-[#18314E] border-[#18314E]/30"
                                          : "bg-slate-50 text-slate-600 border-slate-200"
                                      }`}
                                    >
                                      <div className="flex items-center gap-1">
                                        <span className="font-semibold">{u.nama}</span>
                                        {shiftLabel && (
                                          <span className="text-[10px] text-slate-400 font-normal">
                                            ({shiftLabel})
                                          </span>
                                        )}
                                      </div>
                                      {(u.username || u.no_hp) && (
                                        <div className="text-[10px] text-slate-400 font-normal">
                                          {u.username ? `@${u.username}` : ""}
                                          {u.username && u.no_hp ? " • " : ""}
                                          {u.no_hp || ""}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}

                                {/* Badge for remaining staff beyond the cap */}
                                {hiddenCount > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setDetailModalLapak(lapak)}
                                    className="inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-colors cursor-pointer shadow-2xs"
                                    title="Klik untuk melihat semua staf di modal detail"
                                  >
                                    +{hiddenCount} staf lainnya
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Shift Operasional */}
                      <td className="px-5 py-4 font-mono text-xs">
                        {/* Shift Pagi */}
                        <div
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg w-fit transition-all ${
                            currentActiveShift === "pagi"
                              ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
                              : "text-slate-500"
                          }`}
                        >
                          {currentActiveShift === "pagi" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                          <span>
                            Pagi: {lapak.shift_pagi ? `${lapak.shift_pagi[0]} - ${lapak.shift_pagi[1]}` : "08:00 - 16:00"} WIB
                          </span>
                          {currentActiveShift === "pagi" && (
                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100/70 px-1 rounded">
                              Aktif
                            </span>
                          )}
                        </div>

                        {/* Shift Siang */}
                        <div
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg w-fit mt-1 transition-all ${
                            currentActiveShift === "siang"
                              ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
                              : "text-slate-500"
                          }`}
                        >
                          {currentActiveShift === "siang" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                          <span>
                            Siang: {lapak.shift_siang ? `${lapak.shift_siang[0]} - ${lapak.shift_siang[1]}` : "13:00 - 21:00"} WIB
                          </span>
                          {currentActiveShift === "siang" && (
                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100/70 px-1 rounded">
                              Aktif
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Aksi: 1. Preview, 2. Edit, 3. Delete */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Preview */}
                          <button
                            type="button"
                            onClick={() => setDetailModalLapak(lapak)}
                            title="Lihat Rincian Lapak"
                            aria-label="Lihat Rincian Lapak"
                            className="p-1.5 text-slate-500 hover:text-[#18314E] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <HugeIcon icon={ViewIcon} size={16} />
                          </button>

                          {/* Edit */}
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => setFormModal({ isOpen: true, mode: "edit", lapak })}
                              title="Ubah Data Lapak"
                              aria-label="Ubah Data Lapak"
                              className="p-1.5 text-slate-500 hover:text-[#18314E] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <HugeIcon icon={Edit01Icon} size={16} />
                            </button>
                          )}

                          {/* Delete */}
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => setDeletingLapak(lapak)}
                              title="Hapus Lapak"
                              aria-label="Hapus Lapak"
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <HugeIcon icon={Delete02Icon} size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Standard Table Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan {filteredLapakList.length} dari {allLapakList.length} outlet lapak</span>
        </div>
      </div>

      {/* Form Modal */}
      <LapakFormModal
        isOpen={formModal.isOpen}
        mode={formModal.mode}
        initialData={formModal.lapak}
        spgUsers={spgUsers}
        onClose={() => setFormModal({ isOpen: false, mode: "create" })}
        onSubmit={async (payload, prevSpgIds) => {
          if (formModal.mode === "create") {
            await onCreate(payload);
          } else if (formModal.lapak) {
            await onUpdate(formModal.lapak.id, payload, prevSpgIds);
          }
          if (onRefresh) await onRefresh();
        }}
      />

      {/* Detail Modal */}
      <LapakDetailModal
        lapak={detailModalLapak}
        isOpen={Boolean(detailModalLapak)}
        onClose={() => setDetailModalLapak(null)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingLapak)}
        onClose={() => !isDeleting && setDeletingLapak(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Outlet Lapak"
        message={
          deletingLapak
            ? `Apakah Anda yakin ingin menghapus outlet lapak "${deletingLapak.nama}"? Data stok dan riwayat terkait lapak ini mungkin terpengaruh.`
            : ""
        }
        confirmLabel="Ya, Hapus Lapak"
        cancelLabel="Batal"
        isLoading={isDeleting}
        isDestructive={true}
        icon={Delete02Icon}
      />
    </div>
  );
}
