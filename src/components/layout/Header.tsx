"use client";

import { usePathname } from "next/navigation";
import { useLayout } from "@/context/LayoutContext";
import { useAuth } from "@/hooks/useAuth";
import { isAdminOrOwner } from "@/types/user";
import { ShiftSelector } from "@/components/layout/ShiftSelector";
import { UserProfileDropdown } from "@/components/layout/UserProfileDropdown";
import { HugeIcon } from "@/components/ui/HugeIcon";
import { Menu01Icon, Search01Icon, Notification01Icon } from "@hugeicons/core-free-icons";

export function Header() {
  const pathname = usePathname();
  const { toggleSidebar, searchTerm, setSearchTerm } = useLayout();
  const { user, isLoading } = useAuth();
  const showAdminControls = !isLoading && isAdminOrOwner(user);
  const showSearchBar = showAdminControls && (pathname === "/dashboard" || pathname === "/");

  return (
    <header className="h-16 bg-white border-b border-[#F3E7D8] px-4 md:px-8 flex items-center justify-between shrink-0 shadow-2xs z-30">
      {/* Left: Sidebar Toggle & Search Input */}
      <div className="flex items-center space-x-3 md:space-x-4">
        {/* Toggle Sidebar Button */}
        <button
          type="button"
          onClick={toggleSidebar}
          title="Toggle Sidebar"
          className="p-2 rounded-xl text-slate-600 hover:text-[#A81B1B] hover:bg-[#FFF8F0] active:scale-95 transition-all focus:outline-none cursor-pointer"
        >
          <HugeIcon icon={Menu01Icon} size={20} strokeWidth={2} />
        </button>

        {/* Search Bar (Contextually rendered on searchable operational pages) */}
        {showSearchBar && (
          <div className="relative w-44 sm:w-60 md:w-72 animate-in fade-in duration-150">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <HugeIcon icon={Search01Icon} size={16} strokeWidth={2} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari Lapak / SPG..."
              className="w-full pl-9 pr-3 py-1.5 text-xs md:text-sm bg-[#FDF6EE] border border-[#F3E7D8] rounded-xl text-[#1A1A1A] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#A81B1B] focus:border-[#A81B1B] focus:bg-white transition-all font-medium"
            />
          </div>
        )}
      </div>

      {/* Right: Shift Selector, Notifications & User Profile */}
      <div className="flex items-center space-x-2.5 sm:space-x-4">
        {/* Operational Shift Selector (Admin Only) */}
        {showAdminControls && (
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
