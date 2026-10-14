"use client";

import { useEffect } from "react";
import { HugeIcon } from "@/components/ui/HugeIcon";
import type { IconSvgElement } from "@hugeicons/react";
import { Logout01Icon, AlertCircleIcon } from "@hugeicons/core-free-icons";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  isDestructive?: boolean;
  icon?: IconSvgElement;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Konfirmasi Keluar",
  message = "Apakah Anda yakin ingin keluar dari sistem? Sesi Anda saat ini akan diakhiri.",
  confirmLabel = "Ya, Keluar",
  cancelLabel = "Batal",
  isLoading = false,
  isDestructive = true,
  icon,
}: ConfirmModalProps) {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const displayIcon = icon || (isDestructive ? Logout01Icon : AlertCircleIcon);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#F3E7D8] text-center relative animate-in zoom-in-95 duration-150">
        {/* Close X Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Tutup modal"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Action Icon Badge */}
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            isDestructive ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-amber-50 text-amber-600 border border-amber-100"
          }`}
        >
          <HugeIcon icon={displayIcon} size={24} strokeWidth={2} />
        </div>

        {/* Modal Title & Body */}
        <h3 className="font-extrabold text-[#18314E] text-base md:text-lg">
          {title}
        </h3>
        <p className="text-xs text-[#6B7280] mt-1.5 leading-relaxed">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl border border-[#F3E7D8] bg-[#FDF6EE] hover:bg-[#F3E7D8] text-[#18314E] text-xs font-bold transition-all cursor-pointer disabled:opacity-60"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-60 flex items-center justify-center space-x-1.5 ${
              isDestructive
                ? "bg-[#A81B1B] hover:bg-[#851515] active:scale-[0.99]"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
