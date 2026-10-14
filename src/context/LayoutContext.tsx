"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { ShiftType, resolveCurrentActiveShift } from "@/utils/shift.utils";

interface LayoutContextType {
  isDesktopCollapsed: boolean;
  isMobileOpen: boolean;
  activeShift: ShiftType;
  searchTerm: string;
  toggleSidebar: () => void;
  closeMobileSidebar: () => void;
  setActiveShift: (shift: ShiftType) => void;
  setSearchTerm: (term: string) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeShift, setActiveShift] = useState<ShiftType>("pagi");

  // Reset search filter on route change
  useEffect(() => {
    setSearchTerm("");
  }, [pathname]);

  // Set initial shift based on current time after mount (avoids prerender mismatch)
  useEffect(() => {
    setActiveShift(resolveCurrentActiveShift());
  }, []);

  const toggleSidebar = useCallback(() => {
    if (window.innerWidth < 768) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsDesktopCollapsed((prev) => !prev);
    }
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  return (
    <LayoutContext.Provider
      value={{
        isDesktopCollapsed,
        isMobileOpen,
        activeShift,
        searchTerm,
        toggleSidebar,
        closeMobileSidebar,
        setActiveShift,
        setSearchTerm,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout(): LayoutContextType {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}
