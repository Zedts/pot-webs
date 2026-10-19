"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { ShiftType } from "@/utils/shift.utils";

export type ActiveShiftFilter = ShiftType | "all";

interface LayoutContextType {
  isDesktopCollapsed: boolean;
  isMobileOpen: boolean;
  activeShift: ActiveShiftFilter;
  toggleSidebar: () => void;
  closeMobileSidebar: () => void;
  setActiveShift: (shift: ActiveShiftFilter) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeShift, setActiveShift] = useState<ActiveShiftFilter>("all");

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
        toggleSidebar,
        closeMobileSidebar,
        setActiveShift,
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
