"use client";

import React from "react";
import { HugeIcon } from "@/components/ui/HugeIcon";
import type { IconSvgElement } from "@hugeicons/react";
import { DeliveryTruck01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

export type PengirimanTabKey = "daftar" | "konfirmasi";

interface PengirimanTabsProps {
  activeTab: PengirimanTabKey;
  onTabChange: (tab: PengirimanTabKey) => void;
  draftCount?: number;
}

const TABS: Array<{ key: PengirimanTabKey; label: string; icon: IconSvgElement }> = [
  { key: "daftar", label: "Pengiriman", icon: DeliveryTruck01Icon },
  { key: "konfirmasi", label: "Konfirmasi Pengiriman", icon: CheckmarkCircle02Icon },
];

export function PengirimanTabs({
  activeTab,
  onTabChange,
  draftCount = 0,
}: PengirimanTabsProps) {
  return (
    <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              isActive
                ? "bg-[#18314E] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <HugeIcon
              icon={tab.icon}
              size={17}
              className={isActive ? "text-white" : "text-slate-500"}
            />
            <span>{tab.label}</span>
            {tab.key === "konfirmasi" && typeof draftCount === "number" && draftCount > 0 && (
              <span
                className={`ml-1 px-2 py-0.5 text-xs font-bold rounded-full transition-all ${
                  isActive
                    ? "bg-[#A81B1B] text-white shadow-xs"
                    : "bg-amber-100 text-amber-800 border border-amber-300"
                }`}
              >
                {draftCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
