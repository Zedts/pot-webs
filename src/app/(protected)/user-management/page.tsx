"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isAdminOrOwner, UserModel, UserSummaryMetrics } from "@/types/user";
import { userService } from "@/services/user.service";
import { apiClient } from "@/lib/api-client";
import { ApiEndpoints } from "@/constants/api_endpoints";
import { LapakModel } from "@/types/slp";
import { showToast } from "@/lib/toast";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { UserSummaryCards } from "@/components/user-management/UserSummaryCards";
import { UserTable } from "@/components/user-management/UserTable";
import { UserDetailModal } from "@/components/user-management/UserDetailModal";
import { UserEditModal } from "@/components/user-management/UserEditModal";
import { HugeIcon } from "@/components/ui/HugeIcon";
import { AlertCircleIcon, Shield01Icon, Delete02Icon } from "@hugeicons/core-free-icons";

export default function UserManagementPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const isPrivileged = isAdminOrOwner(user);

  const [users, setUsers] = useState<UserModel[]>([]);
  const [lapakList, setLapakList] = useState<LapakModel[]>([]);
  const [summary, setSummary] = useState<UserSummaryMetrics | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal states
  const [previewUser, setPreviewUser] = useState<UserModel | null>(null);
  const [editingUser, setEditingUser] = useState<UserModel | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserModel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Map of lapakId -> Lapak Object for quick lookup
  const lapakMap = useMemo(() => {
    const map = new Map<string, LapakModel>();
    for (const l of lapakList) {
      map.set(l.id, l);
    }
    return map;
  }, [lapakList]);

  // Load users and stall directory
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    }
    setErrorMessage(null);

    try {
      const [usersData, lapakRes] = await Promise.all([
        userService.getAllUsers(),
        apiClient.get<LapakModel[]>(ApiEndpoints.lapak, { requiresAuth: true }).catch(() => null),
      ]);

      setUsers(usersData);

      const stalls = Array.isArray(lapakRes?.data) ? lapakRes!.data : [];
      setLapakList(stalls);

      // Compute metrics
      let activeCount = 0;
      let inactiveCount = 0;
      let unassignedRoleCount = 0;
      let noLapakCount = 0;
      let noShiftCount = 0;

      for (const u of usersData) {
        const isAct = (u.status || "active").toLowerCase() === "active";
        if (isAct) activeCount++;
        else inactiveCount++;

        if (!u.role || u.role.toLowerCase() === "unassigned") {
          unassignedRoleCount++;
        }
        if (!u.lapak_id) {
          noLapakCount++;
        }
        if (!u.shift) {
          noShiftCount++;
        }
      }

      setSummary({
        totalUsers: usersData.length,
        activeUsers: activeCount,
        inactiveUsers: inactiveCount,
        unassignedRolesCount: unassignedRoleCount,
        noLapakCount: noLapakCount,
        noShiftCount: noShiftCount,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memuat data pengguna.";
      setErrorMessage(msg);
      showToast.error(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading && isPrivileged) {
      void Promise.resolve().then(() => loadData(false));
    }
  }, [isAuthLoading, isPrivileged, loadData]);

  // Delete User Handler
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);

    try {
      await userService.deleteUser(deletingUser.id);
      showToast.success(`Akun pengguna '${deletingUser.nama}' berhasil dihapus.`);
      setDeletingUser(null);
      await loadData(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus pengguna.";
      showToast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Auth Loading Screen
  if (isAuthLoading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#A81B1B] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-[#18314E]">Memuat sesi akun...</p>
        </div>
      </div>
    );
  }

  // Unauthorized Screen
  if (!isPrivileged) {
    return (
      <div className="px-4 md:px-8 py-12 max-w-xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600">
          <HugeIcon icon={Shield01Icon} size={32} />
        </div>
        <h1 className="text-xl font-extrabold text-[#18314E]">Akses Terbatas</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          Halaman Manajemen Pengguna hanya dapat diakses oleh Administrator dan Owner. Silakan hubungi pengelola sistem jika Anda memerlukan akses wewenang ini.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-extrabold text-[#18314E] tracking-tight">
              User Management
            </h1>
            <RefreshButton
              onClick={() => loadData(true)}
              isRefreshing={isRefreshing}
              disabled={isLoading}
            />
          </div>
          <p className="text-xs md:text-sm text-[#6B7280] font-medium mt-0.5">
            Kelola data akun pengguna, alokasi role kerja, penugasan outlet lapak, dan jadwal shift operasional
          </p>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#B91C1C] flex items-center justify-between text-xs font-semibold animate-in fade-in">
          <div className="flex items-center space-x-2">
            <HugeIcon icon={AlertCircleIcon} size={18} strokeWidth={2} />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => loadData(true)}
            className="px-3 py-1 bg-white text-[#B91C1C] rounded-lg border border-[#FCA5A5] hover:bg-rose-50 transition-colors font-bold cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Summary KPI Metric Cards (4 Cards) */}
      <UserSummaryCards summary={summary} isLoading={isLoading} />

      {/* User Table with Filters */}
      <UserTable
        users={users}
        lapakList={lapakList}
        isLoading={isLoading}
        canManage={isPrivileged}
        onPreview={(u) => setPreviewUser(u)}
        onEdit={(u) => setEditingUser(u)}
        onDelete={(u) => setDeletingUser(u)}
      />

      {/* Preview Modal */}
      <UserDetailModal
        user={previewUser}
        lapak={previewUser?.lapak_id ? lapakMap.get(previewUser.lapak_id) : null}
        isOpen={Boolean(previewUser)}
        onClose={() => setPreviewUser(null)}
      />

      {/* Edit Modal (Role, Lapak, Shift, Full PUT) */}
      <UserEditModal
        user={editingUser}
        lapakList={lapakList}
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        onSuccess={async () => {
          await loadData(true);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Akun Pengguna"
        message={`Apakah Anda yakin ingin menghapus akun '${deletingUser?.nama || ""}'? Tindakan ini tidak dapat dibatalkan. Pengguna yang memiliki riwayat transaksi, pengiriman, atau presensi aktif tidak dapat dihapus.`}
        confirmLabel="Ya, Hapus Pengguna"
        cancelLabel="Batal"
        isLoading={isDeleting}
        isDestructive={true}
        icon={Delete02Icon}
      />
    </div>
  );
}
