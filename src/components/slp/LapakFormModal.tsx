"use client";

import React, { useState, useEffect, useMemo } from "react";
import { LapakModel, SpgUserOption } from "@/types/slp";
import { SearchableSelect, SelectOption } from "@/components/ui/SearchableSelect";
import { HugeIcon } from "@/components/ui/HugeIcon";
import { Cancel01Icon, PlusSignIcon, Store01Icon } from "@hugeicons/core-free-icons";

interface LapakFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: any, previousSpgIds?: string[]) => Promise<void>;
  initialData?: LapakModel;
  lapak?: LapakModel;
  spgUsers: SpgUserOption[];
  mode: "create" | "edit";
}

export function LapakFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  lapak,
  spgUsers,
  mode,
}: LapakFormModalProps) {
  const isEdit = mode === "edit";
  const targetLapak = initialData || lapak;

  // Initial staff IDs assigned to this lapak
  const initialStaffIds = useMemo(() => {
    if (!targetLapak) return [];
    const list: string[] = [];
    if (Array.isArray(targetLapak.spg)) {
      for (const u of targetLapak.spg) {
        const uid = (u as any).id || (u as any).spg_id;
        if (uid && !list.includes(uid)) list.push(uid);
      }
    } else if (targetLapak.spg) {
      const uid = (targetLapak.spg as any).id || (targetLapak.spg as any).spg_id;
      if (uid) list.push(uid);
    }
    if (targetLapak.spg_id && !list.includes(targetLapak.spg_id)) {
      list.unshift(targetLapak.spg_id);
    }
    return list;
  }, [targetLapak]);

  // Form states
  const [nama, setNama] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radiusMeter, setRadiusMeter] = useState(25);
  const [selectedSpgIds, setSelectedSpgIds] = useState<string[]>([]);
  const [showUserPicker, setShowUserPicker] = useState<boolean>(false);
  const [pickerSelection, setPickerSelection] = useState<string>("");

  const [shiftPagiStart, setShiftPagiStart] = useState("08:00");
  const [shiftPagiEnd, setShiftPagiEnd] = useState("16:00");
  const [shiftSiangStart, setShiftSiangStart] = useState("13:00");
  const [shiftSiangEnd, setShiftSiangEnd] = useState("21:00");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (targetLapak) {
        setNama(targetLapak.nama || "");
        setLokasi(targetLapak.lokasi || "");
        setKeterangan(targetLapak.keterangan || "");
        setLatitude(targetLapak.latitude !== null && targetLapak.latitude !== undefined ? String(targetLapak.latitude) : "");
        setLongitude(targetLapak.longitude !== null && targetLapak.longitude !== undefined ? String(targetLapak.longitude) : "");
        setRadiusMeter(targetLapak.radius_meter ?? 25);
        setSelectedSpgIds(initialStaffIds);
        setShiftPagiStart(targetLapak.shift_pagi ? targetLapak.shift_pagi[0] : "08:00");
        setShiftPagiEnd(targetLapak.shift_pagi ? targetLapak.shift_pagi[1] : "16:00");
        setShiftSiangStart(targetLapak.shift_siang ? targetLapak.shift_siang[0] : "13:00");
        setShiftSiangEnd(targetLapak.shift_siang ? targetLapak.shift_siang[1] : "21:00");
      } else {
        setNama("");
        setLokasi("");
        setKeterangan("");
        setLatitude("");
        setLongitude("");
        setRadiusMeter(25);
        setSelectedSpgIds([]);
        setShiftPagiStart("08:00");
        setShiftPagiEnd("16:00");
        setShiftSiangStart("13:00");
        setShiftSiangEnd("21:00");
      }
      setShowUserPicker(false);
      setPickerSelection("");
      setErrorMessage("");
    }
  }, [isOpen, targetLapak, initialStaffIds]);

  // Options for SearchableSelect: only staff who haven't been selected yet
  const availableSpgOptions: SelectOption[] = useMemo(() => {
    return spgUsers
      .filter((u) => !selectedSpgIds.includes(u.id))
      .map((u) => ({
        value: u.id,
        label: u.nama,
        sublabel: `${u.username ? `@${u.username}` : ""} ${u.role ? `• ${u.role}` : ""}`.trim(),
        role: u.role,
      }));
  }, [spgUsers, selectedSpgIds]);

  const handleAddSpg = (userId: string) => {
    if (!userId) return;
    if (!selectedSpgIds.includes(userId)) {
      setSelectedSpgIds((prev) => [...prev, userId]);
    }
    setShowUserPicker(false);
    setPickerSelection("");
  };

  const handleRemoveSpg = (userId: string) => {
    setSelectedSpgIds((prev) => prev.filter((id) => id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!nama.trim()) {
      setErrorMessage("Nama lapak wajib diisi.");
      return;
    }
    if (!lokasi.trim()) {
      setErrorMessage("Lokasi / alamat lapak wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        nama: nama.trim(),
        lokasi: lokasi.trim(),
        keterangan: keterangan.trim(),
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        radius_meter: radiusMeter,
        spg_id: selectedSpgIds[0] || null,
        spg_ids: selectedSpgIds,
        shift_pagi: [shiftPagiStart, shiftPagiEnd],
        shift_siang: [shiftSiangStart, shiftSiangEnd],
      };

      await onSubmit(payload, initialStaffIds);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal menyimpan data lapak.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#18314E] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <HugeIcon icon={Store01Icon} size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold">
                {isEdit ? "Edit Outlet Lapak" : "Tambah Outlet Lapak Baru"}
              </h2>
              <p className="text-xs text-white/70">
                {isEdit
                  ? "Perbarui informasi lapak, penugasan staf, dan konfigurasi shift"
                  : "Daftarkan gerai/outlet baru beserta jam operasional dan staf"}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <span className="font-semibold">Perhatian:</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Nama Lapak */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Nama Lapak / Outlet <span className="text-[#A81B1B]">*</span>
            </label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Lapak Tebet Barat"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E] transition-all font-medium"
            />
          </div>

          {/* Lokasi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Alamat / Lokasi <span className="text-[#A81B1B]">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              placeholder="Contoh: Jl. Tebet Barat Dalam Raya No. 42, Jakarta Selatan"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E] transition-all"
            />
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Keterangan Tambahan (Opsional)
            </label>
            <input
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Depan Alfamart, samping halte bus"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E] transition-all"
            />
          </div>

          {/* Koordinat Geofencing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Latitude
              </label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="-6.200000"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Longitude
              </label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="106.816666"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Radius (Meter)
              </label>
              <input
                type="number"
                min="5"
                max="500"
                value={radiusMeter}
                onChange={(e) => setRadiusMeter(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E]"
              />
            </div>
          </div>

          {/* Penugasan User / SPG Multi-Selection */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Penugasan SPG / User Utama (Opsional)
              </label>
              <button
                type="button"
                onClick={() => setShowUserPicker(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-[#A81B1B] hover:bg-[#8B1717] rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                <HugeIcon icon={PlusSignIcon} size={14} />
                <span>Tambah Staf</span>
              </button>
            </div>

            {/* Selected staff list */}
            {selectedSpgIds.length > 0 ? (
              <div className="space-y-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                {selectedSpgIds.map((uid, index) => {
                  const staff = spgUsers.find((u) => u.id === uid) ||
                    (Array.isArray(targetLapak?.spg) ? targetLapak.spg.find((u) => ((u as any).id || (u as any).spg_id) === uid) : null);
                  const isPrimary = index === 0;

                  return (
                    <div
                      key={uid}
                      className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-slate-200/80 shadow-2xs text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isPrimary ? "text-slate-900" : "text-slate-700"}`}>
                          {staff?.nama || "Staf ID: " + uid}
                        </span>
                        {isPrimary && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Utama
                          </span>
                        )}
                        {staff?.role && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-600 uppercase">
                            {staff.role}
                          </span>
                        )}
                        {staff?.username && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            @{staff.username}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSpg(uid)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Hapus penugasan"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Belum ada staf / SPG yang ditugaskan ke outlet ini. Klik "+ Tambah Staf" untuk memilih.
              </p>
            )}

            {/* Dynamic Picker dropdown when adding */}
            {showUserPicker && (
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-900">Pilih Staf untuk Ditugaskan:</span>
                  <button
                    type="button"
                    onClick={() => setShowUserPicker(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                  >
                    ✕ Batal
                  </button>
                </div>
                <SearchableSelect
                  options={availableSpgOptions}
                  value={pickerSelection}
                  onChange={handleAddSpg}
                  placeholder="Pilih nama staf / SPG..."
                  searchPlaceholder="Cari user berdasarkan nama, username, atau role..."
                />
              </div>
            )}
          </div>

          {/* Konfigurasi Shift */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <span className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Jam Operasional Shift
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
                <span className="text-xs font-semibold text-slate-700">Shift Pagi</span>
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="time"
                    value={shiftPagiStart}
                    onChange={(e) => setShiftPagiStart(e.target.value)}
                    className="flex-1 p-1.5 bg-white border border-slate-200 rounded-lg text-center font-mono"
                  />
                  <span>-</span>
                  <input
                    type="time"
                    value={shiftPagiEnd}
                    onChange={(e) => setShiftPagiEnd(e.target.value)}
                    className="flex-1 p-1.5 bg-white border border-slate-200 rounded-lg text-center font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
                <span className="text-xs font-semibold text-slate-700">Shift Siang</span>
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="time"
                    value={shiftSiangStart}
                    onChange={(e) => setShiftSiangStart(e.target.value)}
                    className="flex-1 p-1.5 bg-white border border-slate-200 rounded-lg text-center font-mono"
                  />
                  <span>-</span>
                  <input
                    type="time"
                    value={shiftSiangEnd}
                    onChange={(e) => setShiftSiangEnd(e.target.value)}
                    className="flex-1 p-1.5 bg-white border border-slate-200 rounded-lg text-center font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#A81B1B] hover:bg-[#8B1717] rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : isEdit ? "Perbarui Lapak" : "Simpan Lapak"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
