"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getUserDisplayName, getUserInitials } from "@/types/user";
import { showToast } from "@/lib/toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { HugeIcon } from "@/components/ui/HugeIcon";
import { ArrowDown01Icon, Logout01Icon } from "@hugeicons/core-free-icons";

export function UserProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, logout } = useAuth();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      showToast.info("Sesi Anda telah diakhiri.");
      router.replace("/login");
    } catch {
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);
  const role = user?.role ? user.role.toUpperCase() : "ADMIN";

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer group"
          aria-expanded={isOpen}
        >
          {/* User Initials Circle / Avatar */}
          <div className="w-8 h-8 rounded-full bg-[#A81B1B] text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#F3E7D8] shadow-xs select-none">
            {initials}
          </div>

          {/* Name & Role Text */}
          <div className="hidden sm:flex flex-col text-left leading-tight">
            <span className="text-xs font-bold text-[#1A1A1A] group-hover:text-[#A81B1B] transition-colors max-w-[120px] truncate">
              {displayName}
            </span>
            <span className="text-[10px] text-[#6B7280] font-semibold uppercase">
              {role}
            </span>
          </div>

          {/* Dropdown Chevron */}
          <HugeIcon
            icon={ArrowDown01Icon}
            size={14}
            strokeWidth={2}
            className={`text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-[#A81B1B]" : ""
            }`}
          />
        </button>

        {/* Flyout Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#F3E7D8] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Header info */}
            <div className="px-4 py-2.5 border-b border-[#F3E7D8]">
              <p className="text-xs font-bold text-[#1A1A1A] truncate">{displayName}</p>
              <p className="text-[11px] text-[#6B7280] truncate mt-0.5">{user?.email || "-"}</p>
              <div className="mt-2">
                <span className="inline-flex px-2 py-0.5 rounded-full bg-[#A81B1B]/10 text-[#A81B1B] font-bold text-[10px] tracking-wide uppercase">
                  {role}
                </span>
              </div>
            </div>

            {/* Action List */}
            <div className="pt-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowLogoutModal(true);
                }}
                className="w-full flex items-center px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <HugeIcon icon={Logout01Icon} size={16} strokeWidth={2} className="mr-2.5 text-rose-500" />
                Keluar dari Sistem
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        isLoading={isLoggingOut}
      />
    </>
  );
}
