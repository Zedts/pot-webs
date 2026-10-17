"use client";

import React from "react";

export type PengirimanTabKey = "daftar" | "konfirmasi";

interface PengirimanTabsProps {
  activeTab: PengirimanTabKey;
  onTabChange: (tab: PengirimanTabKey) => void;
  draftCount?: number;
}

export function PengirimanTabs({
  activeTab,
  onTabChange,
  draftCount = 0,
}: PengirimanTabsProps) {
  return (
    <div className="bg-[#FDF6EE] p-1.5 rounded-2xl border border-[#F3E7D8] inline-flex space-x-1.5 shadow-2xs">
      {/* Tab 1: Pengiriman */}
      <button
        type="button"
        onClick={() => onTabChange("daftar")}
        className={`px-4 py-2 rounded-xl text-xs sm:text-sm transition-all cursor-pointer flex items-center space-x-2 ${
          activeTab === "daftar"
            ? "bg-[#A81B1B] text-white font-bold shadow-xs"
            : "text-[#6B7280] hover:text-[#18314E] hover:bg-white/60 font-semibold"
        }`}
      >
        <span>Pengiriman</span>
      </button>

      {/* Tab 2: Konfirmasi Pengiriman */}
      <button
        type="button"
        onClick={() => onTabChange("konfirmasi")}
        className={`px-4 py-2 rounded-xl text-xs sm:text-sm transition-all cursor-pointer flex items-center space-x-2 ${
          activeTab === "konfirmasi"
            ? "bg-[#A81B1B] text-white font-bold shadow-xs"
            : "text-[#6B7280] hover:text-[#18314E] hover:bg-white/60 font-semibold"
        }`}
      >
        <span>Konfirmasi Pengiriman</span>
        {draftCount > 0 && (
          <span
            className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
              activeTab === "konfirmasi"
                ? "bg-white text-[#A81B1B]"
                : "bg-[#A81B1B] text-white"
            }`}
          >
            {draftCount}
          </span>
        )}
      </button>
    </div>
  );
}
