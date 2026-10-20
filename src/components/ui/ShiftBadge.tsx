import React from "react";
import { HugeIcon } from "@/components/ui/HugeIcon";
import { Time04Icon } from "@hugeicons/core-free-icons";
import { formatLapakShiftHours } from "@/utils/shift.utils";

interface ShiftBadgeProps {
  shift?: string | null;
  lapak?: {
    shift_pagi?: [string, string] | null;
    shift_siang?: [string, string] | null;
    shift_long?: [string, string] | null;
  } | null;
}

export function ShiftBadge({ shift, lapak }: ShiftBadgeProps) {
  if (!shift) {
    return <span className="text-slate-400 italic text-xs">Belum Diatur</span>;
  }

  const s = shift.toLowerCase().trim();
  const isPagi = s === "pagi";
  const isLong = s === "long_shift" || s === "long" || s === "long shift";

  let badgeStyle = "bg-amber-50 text-amber-800 border-amber-200";
  let label = `Siang (${formatLapakShiftHours("siang", lapak)})`;

  if (isPagi) {
    badgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-200";
    label = `Pagi (${formatLapakShiftHours("pagi", lapak)})`;
  } else if (isLong) {
    badgeStyle = "bg-blue-50 text-blue-800 border-blue-200";
    label = `Long Shift (${formatLapakShiftHours("long_shift", lapak)})`;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border font-semibold ${badgeStyle}`}
    >
      <HugeIcon icon={Time04Icon} size={12} />
      <span>{label}</span>
    </span>
  );
}
