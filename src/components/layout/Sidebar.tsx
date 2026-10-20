"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLayout } from "@/context/LayoutContext";
import { useAuth } from "@/hooks/useAuth";
import { isAdminOrOwner } from "@/types/user";
import { showToast } from "@/lib/toast";
import { Logo } from "@/components/ui/Logo";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { HugeIcon } from "@/components/ui/HugeIcon";
import type { IconSvgElement } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  DeliveryTruck01Icon,
  PackageIcon,
  Time04Icon,
  Money03Icon,
  Settings02Icon,
  Logout01Icon,
  Profile,
  Invoice03Icon,
  FileCheckIcon,
} from "@hugeicons/core-free-icons";

interface NavItem {
  label: string;
  href: string;
  icon: IconSvgElement;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardSquare01Icon },
  { label: "Pengiriman", href: "/pengiriman", icon: DeliveryTruck01Icon },
  { label: "Stok Lapak Produk", href: "/slp", icon: PackageIcon },
  { label: "User Management", href: "/user-management", icon: Profile, adminOnly: true },
  { label: "Penjualan", href: "/penjualan", icon: Invoice03Icon },
  { label: "Absensi", href: "/absensi", icon: Time04Icon },
  { label: "Closingan", href: "/closingan", icon: FileCheckIcon },
  { label: "Payroll", href: "/payroll", icon: Money03Icon, adminOnly: true },
  { label: "Pengaturan", href: "/pengaturan", icon: Settings02Icon },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isDesktopCollapsed, isMobileOpen, closeMobileSidebar } = useLayout();
  const { user, logout } = useAuth();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const isPrivileged = isAdminOrOwner(user);
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.adminOnly || isPrivileged);
  const roleName = user?.role ? user.role.toUpperCase() : "ADMIN";

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={closeMobileSidebar}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Aside */}
      <aside
        id="main-sidebar"
        className={`fixed md:static inset-y-0 left-0 z-50 bg-[#17304C] text-slate-300 flex flex-col shrink-0 border-r border-slate-700/50 shadow-xl md:shadow-none transition-all duration-300 ease-in-out ${
          isDesktopCollapsed ? "md:w-20" : "md:w-64"
        } ${isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Brand Top Header */}
        <div className="h-16 flex items-center px-4 border-b border-slate-700/50 shrink-0">
          <div className="flex items-center space-x-3 overflow-hidden">
            {/* Brand Logo from logo.svg */}
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1.5 shrink-0 shadow-sm ring-1 ring-white/10 select-none">
              <Logo width={32} height={32} className="w-7 h-7 object-contain" priority />
            </div>

            {/* Brand Title & Role Tagline */}
            {(!isDesktopCollapsed || isMobileOpen) && (
              <div className="flex flex-col transition-opacity duration-200 overflow-hidden leading-tight">
                <span className="text-white font-extrabold text-lg tracking-wider">POT</span>
                <span className="text-red-200/90 text-[10.5px] uppercase font-semibold tracking-tight whitespace-nowrap">
                  Dashboard {roleName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu Items */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700">
          {visibleNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/dashboard" && pathname === "/");

            return (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  onClick={() => {
                    if (isMobileOpen) closeMobileSidebar();
                  }}
                  className={`flex items-center px-3.5 py-2.5 rounded-xl font-medium transition-colors ${
                    isActive
                      ? "text-white bg-[#1F3C5E] shadow-sm font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-[#1C395B]"
                  }`}
                >
                  <HugeIcon
                    icon={item.icon}
                    size={20}
                    strokeWidth={isActive ? 2 : 1.8}
                    className={`shrink-0 ${isActive ? "text-white" : "opacity-80 group-hover:opacity-100"}`}
                  />

                  {(!isDesktopCollapsed || isMobileOpen) && (
                    <span className="ml-3.5 text-sm truncate">{item.label}</span>
                  )}
                </Link>

                {/* Floating Tooltip in Desktop Collapsed Mode */}
                {isDesktopCollapsed && !isMobileOpen && (
                  <div className="hidden md:group-hover:block absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-2.5 py-1 bg-[#0F1E33] text-white text-xs font-semibold rounded-lg shadow-lg whitespace-nowrap border border-slate-700/60 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar Bottom: Logout */}
        <div className="p-3 border-t border-slate-700/50 relative group">
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-red-400 hover:bg-[#1C395B] transition-colors cursor-pointer text-left focus:outline-none"
          >
            <HugeIcon
              icon={Logout01Icon}
              size={20}
              strokeWidth={1.8}
              className="shrink-0 opacity-80 group-hover:opacity-100"
            />
            {(!isDesktopCollapsed || isMobileOpen) && (
              <span className="ml-3.5 text-sm font-medium truncate">Keluar</span>
            )}
          </button>

          {/* Tooltip for Logout in Collapsed Mode */}
          {isDesktopCollapsed && !isMobileOpen && (
            <div className="hidden md:group-hover:block absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-2.5 py-1 bg-[#0F1E33] text-red-400 text-xs font-semibold rounded-lg shadow-lg whitespace-nowrap border border-slate-700/60 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
              Keluar
            </div>
          )}
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        isLoading={isLoggingOut}
      />
    </>
  );
}
