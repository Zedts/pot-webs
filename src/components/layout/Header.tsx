"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLayout } from "@/context/LayoutContext";
import { useAuth } from "@/hooks/useAuth";
import { isAdminOrOwner } from "@/types/user";
import { ShiftSelector } from "@/components/layout/ShiftSelector";
import { UserProfileDropdown } from "@/components/layout/UserProfileDropdown";
import { HugeIcon } from "@/components/ui/HugeIcon";
import { Menu01Icon, Notification01Icon } from "@hugeicons/core-free-icons";

export function Header() {
  const pathname = usePathname();
  const { toggleSidebar } = useLayout();
  const { user, isLoading } = useAuth();
  const showAdminControls = !isLoading && isAdminOrOwner(user);
  const isDashboard = pathname === "/dashboard" || pathname === "/dashboard/";

  // Real-time Jakarta clock
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      try {
        const timeStr = new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date());
        setCurrentTime(timeStr.replace(/\./g, ":"));
      } catch {
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, "0");
        setCurrentTime(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-[#F3E7D8] px-4 md:px-8 flex items-center justify-between shrink-0 shadow-2xs z-30">
      {/* Left: Sidebar Toggle Button */}
      <div className="flex items-center space-x-3 md:space-x-4">
        <button
          type="button"
          onClick={toggleSidebar}
          title="Toggle Sidebar"
          className="p-2 rounded-xl text-slate-600 hover:text-[#A81B1B] hover:bg-[#FFF8F0] active:scale-95 transition-all focus:outline-none cursor-pointer"
        >
          <HugeIcon icon={Menu01Icon} size={20} strokeWidth={2} />
        </button>
      </div>

      {/* Right: Real-Time Clock, Shift Selector, Notifications & User Profile */}
      <div className="flex items-center space-x-2.5 sm:space-x-4">
        {/* Real-time Clock (Visible across all pages) */}
        <div className="hidden sm:flex items-center space-x-1.5 bg-[#FDF6EE] border border-[#F3E7D8] px-3 py-1.5 rounded-xl shadow-2xs text-xs font-mono font-semibold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{currentTime || "--:--:--"} WIB</span>
        </div>

        {/* Operational Shift Selector (Dashboard & Admin Only) */}
        {showAdminControls && isDashboard && (
          <div className="hidden sm:block">
            <ShiftSelector />
          </div>
        )}

        {/* Notification Bell */}
        <button
          type="button"
          className="relative p-2 text-slate-500 hover:text-[#A81B1B] hover:bg-[#FFF8F0] rounded-xl transition-colors cursor-pointer"
          title="Notifikasi"
        >
          <HugeIcon icon={Notification01Icon} size={20} strokeWidth={1.8} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#A81B1B] rounded-full ring-2 ring-white"></span>
        </button>

        {/* User Profile Pill & Dropdown */}
        <UserProfileDropdown />
      </div>
    </header>
  );
}
