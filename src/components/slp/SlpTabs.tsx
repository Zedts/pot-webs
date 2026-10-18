"use client";

import React from "react";
import { SlpTabKey } from "@/types/slp";
import { HugeIcon } from "@/components/ui/HugeIcon";
import type { IconSvgElement } from "@hugeicons/react";
import { Store01Icon, PackageIcon, Layers01Icon } from "@hugeicons/core-free-icons";

interface SlpTabsProps {
  activeTab: SlpTabKey;
  onTabChange: (tab: SlpTabKey) => void;
  lapakCount?: number;
  stokCount?: number;
  produkCount?: number;
}

const TABS: Array<{ key: SlpTabKey; label: string; icon: IconSvgElement }> = [
  { key: "lapak", label: "Lapak", icon: Store01Icon },
  { key: "stok", label: "Stok Lapak", icon: PackageIcon },
  { key: "produk", label: "Produk", icon: Layers01Icon },
];

export function SlpTabs({
  activeTab,
  onTabChange,
}: SlpTabsProps) {
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
          </button>
        );
      })}
    </div>
  );
}
