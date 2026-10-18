"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { ShiftType, resolveCurrentActiveShift } from "@/utils/shift.utils";

interface LayoutContextType {
  isDesktopCollapsed: boolean;
  isMobileOpen: boolean;
  activeShift: ShiftType;
  toggleSidebar: () => void;
  closeMobileSidebar: () => void;
  setActiveShift: (shift: ShiftType) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeShift, setActiveShift] = useState<ShiftType>("pagi");

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
