"use client";

import React from "react";
import { LapakModel } from "@/types/slp";
import { resolveCurrentActiveShift } from "@/utils/shift.utils";
import { HugeIcon } from "@/components/ui/HugeIcon";
import {
  Cancel01Icon,
  Store01Icon,
  Location01Icon,
  Time04Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";

interface LapakDetailModalProps {
  lapak: LapakModel | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LapakDetailModal({ lapak, isOpen, onClose }: LapakDetailModalProps) {
  if (!isOpen || !lapak) return null;

  const hasCoords =
    lapak.latitude !== null &&
    lapak.latitude !== undefined &&
    lapak.longitude !== null &&
    lapak.longitude !== undefined;

  const currentActiveShift = resolveCurrentActiveShift();
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${lapak.latitude},${lapak.longitude}`
    : null;

  // Extract all assigned users
  const assignedUsers = Array.isArray(lapak.spg)
    ? lapak.spg
    : lapak.spg
    ? [lapak.spg]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#18314E] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <HugeIcon icon={Store01Icon} size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold">Rincian Profil Outlet Lapak</h2>
              <p className="text-xs text-white/70">
                {lapak.nama} {lapak.lokasi ? `• ${lapak.lokasi}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <HugeIcon icon={Cancel01Icon} size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Card 1: Lokasi & Geofence */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center space-x-2 text-[#18314E] font-bold text-sm">
              <HugeIcon icon={Location01Icon} size={18} strokeWidth={2} />
              <span>Lokasi & Presensi Geofence</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {lapak.lokasi || "Lokasi belum diisi"}
            </p>
            {lapak.keterangan && (
              <p className="text-xs text-slate-500 italic">
                Catatan: {lapak.keterangan}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Koordinat (Lat, Lng)</span>
                <span className="font-mono font-semibold text-[#18314E]">
                  {hasCoords ? `${lapak.latitude}, ${lapak.longitude}` : "Belum ditentukan"}
                </span>
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-[#A81B1B] hover:underline font-bold mt-0.5 text-[11px]"
                  >
                    Buka di Google Maps ↗
                  </a>
                )}
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Radius Geofence</span>
                <span className="font-bold text-[#18314E]">
                  {lapak.radius_meter || 25} meter
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Batas toleransi radius presensi mobile SPG
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Jam Operasional Shift */}
          <div className="bg-[#FFFDF9] rounded-2xl p-4 border border-[#F3E7D8] space-y-3">
            <div className="flex items-center space-x-2 text-[#18314E] font-bold text-sm">
              <HugeIcon icon={Time04Icon} size={18} strokeWidth={2} />
              <span>Jam Operasional Shift</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-[#F3E7D8]">
                <span className="font-bold text-[#A81B1B] block">Shift Pagi</span>
                <span className="font-mono font-semibold text-slate-700 text-sm mt-0.5 block">
                  {lapak.shift_pagi ? `${lapak.shift_pagi[0]} - ${lapak.shift_pagi[1]}` : "08:00 - 16:00"} WIB {currentActiveShift === "pagi" ? "(Aktif)" : ""}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#F3E7D8]">
                <span className="font-bold text-[#A81B1B] block">Shift Siang</span>
                <span className="font-mono font-semibold text-slate-700 text-sm mt-0.5 block">
                  {lapak.shift_siang ? `${lapak.shift_siang[0]} - ${lapak.shift_siang[1]}` : "13:00 - 21:00"} WIB {currentActiveShift === "siang" ? "(Aktif)" : ""}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#F3E7D8]">
                <span className="font-bold text-[#A81B1B] block">Long Shift</span>
                <span className="font-mono font-semibold text-slate-700 text-sm mt-0.5 block">
                  {lapak.shift_long ? `${lapak.shift_long[0]} - ${lapak.shift_long[1]}` : "08:00 - 20:00"} WIB {currentActiveShift === "long_shift" ? "(Aktif)" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Personel & SPG Bertugas */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center space-x-2 text-[#18314E] font-bold text-sm">
              <HugeIcon icon={UserIcon} size={18} strokeWidth={2} />
              <span>Personel & Staf Bertugas ({assignedUsers.length})</span>
            </div>

            {assignedUsers.length > 0 ? (
              <div className="space-y-2">
                {assignedUsers.map((u, idx) => (
                  <div
                    key={u.id || idx}
                    className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#18314E] text-sm">{u.nama}</span>
                        {u.role && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                            {u.role}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {u.username ? `@${u.username}` : ""} {u.no_hp ? `• ${u.no_hp}` : ""}
                      </p>
                    </div>
                    {u.shift && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                        Shift {u.shift}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Belum ada staf yang ditugaskan ke outlet lapak ini.
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
