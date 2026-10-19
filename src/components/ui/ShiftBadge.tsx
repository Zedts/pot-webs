import React from "react";
import { HugeIcon } from "@/components/ui/HugeIcon";
import { Time04Icon } from "@hugeicons/core-free-icons";
import { formatLapakShiftHours } from "@/utils/shift.utils";

interface ShiftBadgeProps {
  shift?: string | null;
  lapak?: {
    shift_pagi?: [string, string] | null;
    shift_siang?: [string, string] | null;
  } | null;
}

export function ShiftBadge({ shift, lapak }: ShiftBadgeProps) {
  if (!shift) {
    return <span className="text-slate-400 italic text-xs">Belum Diatur</span>;
  }

  const isPagi = shift.toLowerCase() === "pagi";
  const badgeStyle = isPagi
    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
    : "bg-amber-50 text-amber-800 border-amber-200";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border font-semibold ${badgeStyle}`}
    >
      <HugeIcon icon={Time04Icon} size={12} />
      <span>
        {isPagi
          ? `Pagi (${formatLapakShiftHours("pagi", lapak)})`
          : `Siang (${formatLapakShiftHours("siang", lapak)})`}
      </span>
    </span>
  );
}
