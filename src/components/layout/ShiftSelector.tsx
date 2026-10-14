"use client";

import React from "react";
import { useLayout } from "@/context/LayoutContext";
import { HugeIcon } from "@/components/ui/HugeIcon";
import { Time04Icon } from "@hugeicons/core-free-icons";

export function ShiftSelector() {
  const { activeShift, setActiveShift } = useLayout();

  return (
    <div className="flex items-center space-x-1 bg-[#FDF6EE] border border-[#F3E7D8] p-1 rounded-xl shadow-2xs">
      <button
        type="button"
        onClick={() => setActiveShift("pagi")}
        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
          activeShift === "pagi"
            ? "bg-[#A81B1B] text-white shadow-xs"
            : "text-[#6B7280] hover:text-[#1A1A1A] hover:bg-white/60"
        }`}
      >
        <HugeIcon icon={Time04Icon} size={14} strokeWidth={2} />
        <span>Pagi</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveShift("siang")}
        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
          activeShift === "siang"
            ? "bg-[#A81B1B] text-white shadow-xs"
            : "text-[#6B7280] hover:text-[#1A1A1A] hover:bg-white/60"
        }`}
      >
        <HugeIcon icon={Time04Icon} size={14} strokeWidth={2} />
        <span>Siang</span>
      </button>
    </div>
  );
}
