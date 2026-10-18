"use client";

import React, { useState, useMemo } from "react";
import { UserModel, UpdateUserPayload } from "@/types/user";
import { LapakModel } from "@/types/slp";
import { formatLapakShiftHours } from "@/utils/shift.utils";
import { userService } from "@/services/user.service";
import { showToast } from "@/lib/toast";
import { SearchableSelect, SelectOption } from "@/components/ui/SearchableSelect";
import { HugeIcon } from "@/components/ui/HugeIcon";
import {
  AlertCircleIcon,
  Cancel01Icon,
  Edit01Icon,
  Shield01Icon,
  Store01Icon,
  Time04Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";

type EditOperationMode = "role" | "lapak" | "shift" | "full";

interface UserEditModalProps {
  user: UserModel | null;
  lapakList: LapakModel[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

const roleOptions: SelectOption[] = [
  { value: "owner", label: "Owner", sublabel: "Hak akses penuh kepemilikan bisnis" },
  { value: "admin", label: "Administrator", sublabel: "Hak akses manajerial operasional penuh" },
  { value: "spg", label: "SPG (Sales Promotion)", sublabel: "Staf operasional kasir & stok outlet lapak" },
  { value: "produksi", label: "Tim Produksi", sublabel: "Staf dapur & alokasi pengiriman barang" },
  { value: "viar", label: "Driver Viar", sublabel: "Kurir distribusi fisik logistik antar lapak" },
  { value: "unassigned", label: "Belum Ditentukan", sublabel: "Akun baru tanpa wewenang aktif" },
];



export function UserEditModal({
  user,
  lapakList,
  isOpen,
  onClose,
  onSuccess,
}: UserEditModalProps) {
  const [activeMode, setActiveMode] = useState<EditOperationMode>("role");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mode 1: Role state
  const [selectedRole, setSelectedRole] = useState("unassigned");

  // Mode 2: Lapak state
  const [selectedLapakId, setSelectedLapakId] = useState("none");

  // Mode 3: Shift state
  const [selectedShift, setSelectedShift] = useState("none");

  // Mode 4: Full Update states
  const [nama, setNama] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [noHp, setNoHp] = useState("");
  const [status, setStatus] = useState("active");
  const [password, setPassword] = useState("");

  const [prevUserId, setPrevUserId] = useState<string | null>(null);

  if (user && user.id !== prevUserId) {
    setPrevUserId(user.id);
    setSelectedRole(user.role?.toLowerCase() || "unassigned");
    setSelectedLapakId(user.lapak_id || "none");
    setSelectedShift(user.shift?.toLowerCase() || "none");
    setNama(user.nama || "");
    setUsername(user.username || "");
    setEmail(user.email || "");
    setNoHp(user.no_hp || "");
    setStatus(user.status?.toLowerCase() || "active");
    setPassword("");
    setErrorMessage(null);
    setActiveMode("role");
  }

  // Target lapak to compute operational shift hours and validate assignment
  const currentTargetLapak = useMemo(() => {
    if (selectedLapakId === "none") return null;
    return lapakList.find((l) => l.id === selectedLapakId) || null;
  }, [selectedLapakId, lapakList]);

  const hasLapak = Boolean(currentTargetLapak);

  // Dynamic Shift dropdown options reflecting ONLY the selected Lapak's real shift hours
  const shiftOptions: SelectOption[] = useMemo(() => {
    if (!currentTargetLapak) return [];

    const pagiHours = formatLapakShiftHours("pagi", currentTargetLapak);
    const siangHours = formatLapakShiftHours("siang", currentTargetLapak);

    return [
      {
        value: "pagi",
        label: "Shift Pagi",
        sublabel: `${pagiHours} (${currentTargetLapak.nama})`,
      },
      {
        value: "siang",
        label: "Shift Siang",
        sublabel: `${siangHours} (${currentTargetLapak.nama})`,
      },
      {
        value: "none",
        label: "Kosongkan Shift",
        sublabel: "Hapus penugasan jadwal shift pengguna",
      },
    ];
  }, [currentTargetLapak]);

  // Lapak dropdown options: active stalls + unassign option
  const lapakOptions: SelectOption[] = useMemo(() => {
    const opts: SelectOption[] = [
      {
        value: "none",
        label: "Kosongkan Penugasan Lapak",
        sublabel: "Hapus penempatan outlet lapak pengguna",
      },
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

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (activeMode === "role") {
        await userService.updateUserRole(user.id, selectedRole);
        showToast.success(`Role pengguna berhasil diubah menjadi '${selectedRole.toUpperCase()}'.`);
      } else if (activeMode === "lapak") {
        const cleanLapakId = selectedLapakId === "none" ? null : selectedLapakId;
        await userService.updateUserLapak(user.id, cleanLapakId);
        showToast.success(
          cleanLapakId
            ? "Penugasan outlet lapak berhasil diperbarui."
            : "Penugasan outlet lapak berhasil dikosongkan."
        );
      } else if (activeMode === "shift") {
        if (!hasLapak) {
          setErrorMessage("Pilih outlet lapak terlebih dahulu sebelum mengatur jadwal shift kerja.");
          setIsSubmitting(false);
          return;
        }
        const cleanShift = selectedShift === "none" ? null : selectedShift;
        await userService.updateUserShift(user.id, cleanShift);
        showToast.success(
          cleanShift
            ? `Shift kerja berhasil diatur ke '${cleanShift.toUpperCase()}'.`
            : "Jadwal shift kerja berhasil dikosongkan."
        );
      } else {
        // Mode: full (PUT)
        const payload: UpdateUserPayload = {
          nama: nama.trim(),
          username: username.trim(),
          email: email.trim().toLowerCase(),
          no_hp: noHp.trim(),
          status: status.toLowerCase(),
        };
        if (password.trim()) {
          if (password.trim().length < 6) {
            throw new Error("Kata sandi baru minimal harus 6 karakter.");
          }
          payload.password = password.trim();
        }
        await userService.updateUser(user.id, payload);
        showToast.success("Profil lengkap pengguna berhasil diperbarui.");
      }

      await onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui pengguna.";
      setErrorMessage(msg);
      showToast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#18314E] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <HugeIcon icon={Edit01Icon} size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold">Ubah Data Pengguna</h2>
              <p className="text-xs text-white/70">
                Pilih opsi pembaruan data untuk {user.nama}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Tutup modal"
          >
            <HugeIcon icon={Cancel01Icon} size={20} />
          </button>
        </div>

        {/* Operation Mode Selector Tabs */}
        <div className="px-6 pt-5 pb-2 bg-slate-50/70 border-b border-slate-100">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Pilih Operasi Perubahan
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-200/60 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveMode("role");
                setErrorMessage(null);
              }}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeMode === "role"
                  ? "bg-white text-[#18314E] shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <HugeIcon icon={Shield01Icon} size={14} />
              <span>Atur Role</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMode("lapak");
                setErrorMessage(null);
              }}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeMode === "lapak"
                  ? "bg-white text-[#18314E] shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <HugeIcon icon={Store01Icon} size={14} />
              <span>Atur Lapak</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMode("shift");
                setErrorMessage(null);
              }}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeMode === "shift"
                  ? "bg-white text-[#18314E] shadow-2xs"
                  : hasLapak
                  ? "text-slate-600 hover:text-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <HugeIcon icon={Time04Icon} size={14} />
              <span>Atur Shift</span>
              {!hasLapak && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Outlet lapak belum ditentukan" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMode("full");
                setErrorMessage(null);
              }}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeMode === "full"
                  ? "bg-white text-[#18314E] shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <HugeIcon icon={UserIcon} size={14} />
              <span>Ubah Normal</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 flex flex-col">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <span className="font-semibold">Perhatian:</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* MODE 1: ATUR ROLE */}
          {activeMode === "role" && (
            <div className="space-y-3 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Role Wewenang Pengguna <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={roleOptions}
                  value={selectedRole}
                  onChange={setSelectedRole}
                  placeholder="Pilih role..."
                  searchPlaceholder="Cari role wewenang..."
                  required
                />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                Pembaruan ini akan mengeksekusi operasi <code className="text-[#18314E] font-bold">PATCH /api/v1/users/:id/role</code> secara spesifik untuk mengubah tingkat hak akses dan hak operasional pengguna di sistem POT.
              </p>
            </div>
          )}

          {/* MODE 2: ATUR LAPAK */}
          {activeMode === "lapak" && (
            <div className="space-y-3 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Penugasan Outlet Lapak <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={lapakOptions}
                  value={selectedLapakId}
                  onChange={setSelectedLapakId}
                  placeholder="Pilih outlet lapak..."
                  searchPlaceholder="Cari outlet lapak..."
                  required
                />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                Pembaruan ini akan mengeksekusi operasi <code className="text-[#18314E] font-bold">PATCH /api/v1/users/:id/lapak</code>. Menugaskan staf ke lapak baru secara otomatis memperbarui relasi tanpa memutus riwayat transaksi lampau.
              </p>
            </div>
          )}

          {/* MODE 3: ATUR SHIFT */}
          {activeMode === "shift" && (
            <div className="space-y-3.5 flex-1">
              {hasLapak && currentTargetLapak ? (
                /* Selected Lapak Info Card */
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#18314E] flex items-center justify-center border border-blue-100 shrink-0">
                      <HugeIcon icon={Store01Icon} size={16} />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Outlet Lapak Terpilih
                      </span>
                      <span className="font-semibold text-slate-800">
                        {currentTargetLapak.nama}
                      </span>
                      {currentTargetLapak.lokasi && (
                        <span className="text-[11px] text-slate-500 block">
                          {currentTargetLapak.lokasi}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] font-mono bg-white text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md font-medium">
                    ID: {currentTargetLapak.id}
                  </span>
                </div>
              ) : (
                /* Warning Banner: Lapak Not Selected */
                <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs space-y-2">
                  <div className="font-semibold flex items-center gap-1.5">
                    <HugeIcon icon={AlertCircleIcon} size={16} className="text-amber-600 shrink-0" />
                    <span>Outlet Lapak Belum Ditentukan</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Pengguna ini belum memiliki penugasan outlet lapak aktif. Jadwal shift kerja terikat dengan jam operasional lapak dan hanya dapat ditentukan setelah outlet lapak dipilih.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveMode("lapak")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                  >
                    <HugeIcon icon={Store01Icon} size={14} />
                    <span>Pilih Outlet di Tab Atur Lapak</span>
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Jadwal Shift Kerja <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={shiftOptions}
                  value={hasLapak ? selectedShift : ""}
                  onChange={setSelectedShift}
                  disabled={!hasLapak}
                  placeholder={hasLapak ? "Pilih shift..." : "Pilih outlet lapak terlebih dahulu..."}
                  searchPlaceholder="Cari shift..."
                  required={hasLapak}
                />
              </div>

              {hasLapak && currentTargetLapak ? (
                <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                  Pembaruan ini akan mengeksekusi operasi <code className="text-[#18314E] font-bold">PATCH /api/v1/users/:id/shift</code>. Menentukan jadwal tugas staf di outlet <span className="font-semibold text-slate-700">{currentTargetLapak.nama}</span> berdasarkan konfigurasi jam operasional lapak tersebut.
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                  Pilihan shift kerja dinonaktifkan sampai outlet lapak ditentukan dan disimpan.
                </p>
              )}
            </div>
          )}

          {/* MODE 4: UBAH PROFIL LENGKAP (PUT) */}
          {activeMode === "full" && (
            <div className="space-y-3.5 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: budi_spg"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                    Alamat Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                    Nomor WhatsApp / HP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                    Status Akun <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E]"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                    Kata Sandi Baru (Opsional)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Kosongkan jika tidak diubah"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E]"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                * Eksekusi melalui operasi <code className="font-bold text-[#18314E]">PUT /api/v1/users/:id</code>. Password yang diisi akan disinkronkan ke Firebase Authentication dan Firestore secara aman.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (activeMode === "shift" && !hasLapak)}
              className={`px-5 py-2 text-xs font-semibold text-white bg-[#A81B1B] hover:bg-[#8B1717] rounded-xl shadow-sm transition-all flex items-center gap-1.5 ${
                isSubmitting || (activeMode === "shift" && !hasLapak)
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Perubahan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
