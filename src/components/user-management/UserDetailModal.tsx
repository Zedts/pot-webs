"use client";

import React, { useEffect } from "react";
import { UserModel } from "@/types/user";
import { formatJakartaDate, formatJakartaTime, formatLapakShiftHours } from "@/utils/shift.utils";
import { LapakModel } from "@/types/slp";
import { HugeIcon } from "@/components/ui/HugeIcon";
import {
  Cancel01Icon,
  UserIcon,
  SmartPhone01Icon,
  Mail01Icon,
  Store01Icon,
  Time04Icon,
  Shield01Icon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons";

interface UserDetailModalProps {
  user: UserModel | null;
  lapak?: LapakModel | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserDetailModal({
  user,
  lapak,
  isOpen,
  onClose,
}: UserDetailModalProps) {
  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const isActive = (user.status || "").toLowerCase() === "active";
  const roleUpper = (user.role || "unassigned").toUpperCase();

  const roleBadgeStyle = (() => {
    switch (user.role?.toLowerCase()) {
      case "owner":
      case "admin":
        return "bg-[#EFF4F9] text-[#18314E] border-[#18314E]/30 font-bold";
      case "spg":
        return "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold";
      case "produksi":
        return "bg-blue-50 text-blue-800 border-blue-200 font-bold";
      case "viar":
        return "bg-purple-50 text-purple-800 border-purple-200 font-bold";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200 font-medium";
    }
  })();

  const shiftLabel = (() => {
    if (!user.shift) return "Belum Diatur";
    const hours = formatLapakShiftHours(user.shift, lapak);
    const bracket = hours ? ` (${hours})` : "";
    const s = user.shift.toLowerCase().trim();
    if (s === "pagi") return `Shift Pagi${bracket}`;
    if (s === "siang") return `Shift Siang${bracket}`;
    if (s === "long_shift" || s === "long" || s === "long shift") return `Long Shift${bracket}`;
    return `${user.shift}${bracket}`;
  })();

  const formattedCreatedAt = user.createdAt
    ? `${formatJakartaDate(user.createdAt)} ${formatJakartaTime(user.createdAt)} WIB`
    : "-";

  const formattedUpdatedAt = user.updatedAt
    ? `${formatJakartaDate(user.updatedAt)} ${formatJakartaTime(user.updatedAt)} WIB`
    : "-";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#18314E] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <HugeIcon icon={UserIcon} size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold">Rincian Profil Pengguna</h2>
              <p className="text-xs text-white/70">
                {user.nama} {user.username ? `(@${user.username})` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <HugeIcon icon={Cancel01Icon} size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Card 1: Identitas Akun */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#18314E] uppercase tracking-wider">
                Identitas Akun
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />
                <span>{isActive ? "Aktif" : "Nonaktif"}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5 font-medium">Nama Lengkap</span>
                <span className="text-slate-900 font-bold text-sm">{user.nama}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 font-medium">Username</span>
                <span className="text-slate-800 font-mono font-medium">
                  {user.username ? `@${user.username}` : "-"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <HugeIcon icon={Mail01Icon} size={15} className="text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Email</span>
                  <span className="text-slate-800 font-medium">{user.email || "-"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <HugeIcon icon={SmartPhone01Icon} size={15} className="text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Nomor WhatsApp / HP</span>
                  <span className="text-slate-800 font-medium font-mono">{user.no_hp || "-"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Role & Penugasan Operasional */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <span className="text-xs font-bold text-[#18314E] uppercase tracking-wider block">
              Role & Penugasan Operasional
            </span>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <HugeIcon icon={Shield01Icon} size={16} className="text-slate-400" />
                  <span>Wewenang Role</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-lg text-xs border ${roleBadgeStyle}`}>
                  {roleUpper}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <HugeIcon icon={Store01Icon} size={16} className="text-slate-400" />
                  <span>Outlet Lapak</span>
                </div>
                <span className="text-slate-800 font-semibold">
                  {lapak?.nama || (user.lapak_id ? `Lapak ID: ${user.lapak_id}` : "Belum Ditugaskan")}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <HugeIcon icon={Time04Icon} size={16} className="text-slate-400" />
                  <span>Shift Operasional</span>
                </div>
                <span className="text-slate-800 font-semibold">{shiftLabel}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Metadata Sistem */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <HugeIcon icon={Calendar03Icon} size={14} />
              <span>Metadata Akun Sistem</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div>
                <span className="text-slate-400">Terdaftar Sejak:</span> {formattedCreatedAt}
              </div>
              <div>
                <span className="text-slate-400">Pembaruan Terakhir:</span> {formattedUpdatedAt}
              </div>
              <div className="sm:col-span-2 text-slate-400 font-mono text-[10px] truncate">
                UID: {user.id}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
