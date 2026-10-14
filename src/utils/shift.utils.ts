/**
 * Shift & Jakarta (WIB) Timezone Utilities
 */

export type ShiftType = "pagi" | "siang";

export const SHIFT_CONFIG: Record<ShiftType, { label: string }> = {
  pagi: { label: "Shift Pagi" },
  siang: { label: "Shift Siang" },
};

export const TIMEZONE_WIB = "Asia/Jakarta";

export function getJakartaDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE_WIB,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function resolveCurrentActiveShift(date: Date = new Date()): ShiftType {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE_WIB,
    hour12: false,
    hour: "numeric",
  }).format(date);

  return parseInt(parts, 10) < 13 ? "pagi" : "siang";
}

export function formatJakartaTime(date: Date | string | number | null | undefined): string {
  if (!date) return "-";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";

    return new Intl.DateTimeFormat("id-ID", {
      timeZone: TIMEZONE_WIB,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d).replace(".", ":");
  } catch {
    return "-";
  }
}

export function isTimestampInShift(timestamp: Date | string | number, shift: ShiftType): boolean {
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return false;
    const hour = parseInt(
      new Intl.DateTimeFormat("en-US", {
        timeZone: TIMEZONE_WIB,
        hour12: false,
        hour: "numeric",
      }).format(d),
      10
    );
    return shift === "pagi" ? hour >= 6 && hour < 13 : hour >= 13;
  } catch {
    return false;
  }
}

export function formatRupiah(value: number | string | null | undefined): string {
  const num = typeof value === "number" ? value : Number(value || 0);
  if (isNaN(num)) return "Rp 0";
  return `Rp ${new Intl.NumberFormat("id-ID").format(num)}`;
}
