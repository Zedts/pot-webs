"use client";

import React, { useState, useMemo } from "react";
import { UserModel } from "@/types/user";
import { LapakModel } from "@/types/slp";
import { SearchableSelect, SelectOption } from "@/components/ui/SearchableSelect";
import { ShiftBadge } from "@/components/ui/ShiftBadge";
import { HugeIcon } from "@/components/ui/HugeIcon";
import {
  Search01Icon,
  ViewIcon,
  Edit01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";

interface UserTableProps {
  users: UserModel[];
  lapakList: LapakModel[];
  isLoading: boolean;
  canManage?: boolean;
  onPreview: (user: UserModel) => void;
  onEdit: (user: UserModel) => void;
  onDelete: (user: UserModel) => void;
}

const roleFilterOptions: SelectOption[] = [
  { value: "all", label: "Semua Role" },
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Administrator" },
  { value: "spg", label: "SPG" },
  { value: "produksi", label: "Produksi" },
  { value: "viar", label: "Viar" },
  { value: "unassigned", label: "Belum Ditentukan" },
];

const shiftFilterOptions: SelectOption[] = [
  { value: "all", label: "Semua Shift" },
  { value: "pagi", label: "Shift Pagi" },
  { value: "siang", label: "Shift Siang" },
  { value: "unassigned", label: "Belum Ada Shift" },
];

const statusFilterOptions: SelectOption[] = [
  { value: "all", label: "Semua Status Akun" },
  { value: "active", label: "Akun Aktif" },
  { value: "inactive", label: "Akun Nonaktif" },
];

export function UserTable({
  users,
  lapakList,
  isLoading,
  canManage = true,
  onPreview,
  onEdit,
  onDelete,
}: UserTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [lapakFilter, setLapakFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Map of lapakId -> Lapak Object for quick O(1) lookup
  const lapakMap = useMemo(() => {
    const map = new Map<string, LapakModel>();
    for (const l of lapakList) {
      map.set(l.id, l);
    }
    return map;
  }, [lapakList]);

  // Dynamic Lapak filter options
  const lapakFilterOptions: SelectOption[] = useMemo(() => {
    const opts: SelectOption[] = [
      { value: "all", label: "Semua Lapak" },
      { value: "unassigned", label: "Belum Ada Lapak" },
    ];
    for (const l of lapakList) {
      opts.push({
        value: l.id,
        label: l.nama,
        sublabel: l.lokasi || "Lokasi belum diisi",
      });
    }
    return opts;
  }, [lapakList]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // 1. Text search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const stall = u.lapak_id ? lapakMap.get(u.lapak_id) : null;
        const stallName = (stall ? stall.nama : "")?.toLowerCase() || "";
        const matchesName = u.nama?.toLowerCase().includes(query);
        const matchesUsername = u.username?.toLowerCase().includes(query);
        const matchesEmail = u.email?.toLowerCase().includes(query);
        const matchesPhone = u.no_hp?.toLowerCase().includes(query);
        const matchesStall = stallName.includes(query);

        if (!matchesName && !matchesUsername && !matchesEmail && !matchesPhone && !matchesStall) {
          return false;
        }
      }

      // 2. Role filter
      if (roleFilter !== "all") {
        if ((u.role || "").toLowerCase() !== roleFilter) return false;
      }

      // 3. Shift filter
      if (shiftFilter !== "all") {
        if (shiftFilter === "unassigned") {
          if (u.shift) return false;
        } else {
          if ((u.shift || "").toLowerCase() !== shiftFilter) return false;
        }
      }

      // 4. Lapak filter
      if (lapakFilter !== "all") {
        if (lapakFilter === "unassigned") {
          if (u.lapak_id) return false;
        } else {
          if (u.lapak_id !== lapakFilter) return false;
        }
      }

      // 5. Status filter
      if (statusFilter !== "all") {
        if ((u.status || "active").toLowerCase() !== statusFilter) return false;
      }

      return true;
    });
  }, [users, searchTerm, roleFilter, shiftFilter, lapakFilter, statusFilter, lapakMap]);

  return (
    <div className="space-y-3">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#F3E7D8] shadow-sm">
        <div className="flex flex-1 flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <HugeIcon icon={Search01Icon} size={16} strokeWidth={2} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama, username, email, lapak..."
              className="w-full pl-9 pr-8 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E] transition-all font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="min-w-[150px]">
            <SearchableSelect
              options={roleFilterOptions}
              value={roleFilter}
              onChange={setRoleFilter}
              placeholder="Semua Role"
            />
          </div>

          {/* Shift Filter */}
          <div className="min-w-[150px]">
            <SearchableSelect
              options={shiftFilterOptions}
              value={shiftFilter}
              onChange={setShiftFilter}
              placeholder="Semua Shift"
            />
          </div>

          {/* Lapak Filter */}
          <div className="min-w-[170px]">
            <SearchableSelect
              options={lapakFilterOptions}
              value={lapakFilter}
              onChange={setLapakFilter}
              placeholder="Semua Lapak"
            />
          </div>

          {/* Status Filter */}
          <div className="min-w-[140px]">
            <SearchableSelect
              options={statusFilterOptions}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Semua Status"
            />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-[#F3E7D8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-[#18314E] text-white text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th scope="col" className="px-5 py-3.5">Pengguna</th>
                <th scope="col" className="px-5 py-3.5">Role</th>
                <th scope="col" className="px-5 py-3.5">Outlet Lapak</th>
                <th scope="col" className="px-5 py-3.5">Shift Kerja</th>
                <th scope="col" className="px-5 py-3.5">Status</th>
                <th scope="col" className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="h-4 bg-slate-200 rounded w-36 mb-1.5" />
                      <div className="h-3 bg-slate-100 rounded w-28" />
                    </td>
                    <td className="px-5 py-4"><div className="h-5 bg-slate-200 rounded-lg w-20" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                    <td className="px-5 py-4"><div className="h-5 bg-slate-100 rounded-lg w-24" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                    <td className="px-5 py-4 text-right"><div className="h-8 bg-slate-200 rounded-xl w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada data pengguna yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleLower = (u.role || "unassigned").toLowerCase();
                  const roleUpper = (u.role || "unassigned").toUpperCase();
                  const stall = u.lapak_id ? lapakMap.get(u.lapak_id) : null;
                  const stallName = stall ? stall.nama : null;
                  const isActive = (u.status || "active").toLowerCase() === "active";

                  const roleBadgeStyle = (() => {
                    switch (roleLower) {
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


                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Pengguna */}
                      <td className="px-5 py-4 font-medium text-slate-800">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{u.nama}</span>
                          <span className="text-xs text-slate-400 mt-0.5">
                            {u.username ? `@${u.username}` : ""}
                            {u.username && u.no_hp ? " • " : ""}
                            {u.no_hp || u.email || ""}
                          </span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs border ${roleBadgeStyle}`}>
                          {roleUpper}
                        </span>
                      </td>

                      {/* Outlet Lapak */}
                      <td className="px-5 py-4">
                        {stallName ? (
                          <span className="font-semibold text-slate-800 text-xs">
                            {stallName}
                          </span>
                        ) : (
                          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg font-medium">
                            Belum Ditugaskan
                          </span>
                        )}
                      </td>

                      {/* Shift Kerja */}
                      <td className="px-5 py-4 font-mono text-xs">
                        <ShiftBadge shift={u.shift} lapak={stall} />
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
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
                      </td>

                      {/* Aksi */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Preview */}
                          <button
                            type="button"
                            onClick={() => onPreview(u)}
                            title="Lihat Rincian Pengguna"
                            aria-label="Lihat Rincian Pengguna"
                            className="p-1.5 text-slate-500 hover:text-[#18314E] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <HugeIcon icon={ViewIcon} size={16} />
                          </button>

                          {/* Edit */}
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => onEdit(u)}
                              title="Ubah Data Pengguna"
                              aria-label="Ubah Data Pengguna"
                              className="p-1.5 text-slate-500 hover:text-[#18314E] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <HugeIcon icon={Edit01Icon} size={16} />
                            </button>
                          )}

                          {/* Delete */}
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => onDelete(u)}
                              title="Hapus Pengguna"
                              aria-label="Hapus Pengguna"
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
      </div>
    </div>
  );
}
