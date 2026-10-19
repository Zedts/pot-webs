/**
 * Shift & Jakarta (WIB) Timezone Utilities
 */

export type ShiftType = "pagi" | "siang";

export const SHIFT_CONFIG: Record<ShiftType, { label: string }> = {
  pagi: { label: "Shift Pagi" },
  siang: { label: "Shift Siang" },
};

export const TIMEZONE_WIB = "Asia/Jakarta";

export function getJakartaDateString(date?: Date | string | number): string {
  if (!date) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: TIMEZONE_WIB,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE_WIB,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function resolveCurrentActiveShift(date: Date = new Date()): ShiftType {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE_WIB,
    hour12: false,
    hour: "numeric",
  }).format(date);

  return parseInt(parts, 10) < 13 ? "pagi" : "siang";
}

/**
 * Formats date into Indonesian localized short date: e.g.
 */
export function formatJakartaDate(date: Date | string | number | null | undefined): string {
  if (!date) return "-";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: TIMEZONE_WIB,
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return "-";
  }
}

/**
 * Formats time in HH:mm (24-hour) using Jakarta timezone: e.g. "16:55"
 */
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

/**
 * Formats date into full Indonesian datetime: e.g. "18 Okt 2026, 16:55 WIB"
 */
export function formatJakartaDateTime(date: Date | string | number | null | undefined): string {
  if (!date) return "-";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";
    const datePart = formatJakartaDate(d);
    const timePart = formatJakartaTime(d);
    if (datePart === "-" || timePart === "-") return "-";
    return `${datePart}, ${timePart} WIB`;
  } catch {
    return "-";
  }
}

/**
 * Converts a date input string (YYYY-MM-DD) into an ISO timestamp with Jakarta's current or specified time
 * Prevents the UTC midnight 07:00 artifact
 */
export function createJakartaISOString(dateStr: string, timeStr?: string): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
    return new Date().toISOString();
  }
  const cleanDate = dateStr.trim();

  if (timeStr && /^\d{2}:\d{2}$/.test(timeStr.trim())) {
    return new Date(`${cleanDate}T${timeStr.trim()}:00+07:00`).toISOString();
  }

  // Merge with current Jakarta local time
  const now = new Date();
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE_WIB,
    hourCycle: "h23",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = timeFormatter.formatToParts(now);
  const h = parts.find((p) => p.type === "hour")?.value || "12";
  const m = parts.find((p) => p.type === "minute")?.value || "00";
  const s = parts.find((p) => p.type === "second")?.value || "00";

  return new Date(`${cleanDate}T${h}:${m}:${s}+07:00`).toISOString();
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

/**
 * Formats operational shift hours according to the assigned Lapak's configured bounds.
 * Falls back to system standard default hours (08:00 - 16:00 for Pagi, 13:00 - 21:00 for Siang).
 * Optionally appends " WIB" timezone indicator (defaults to true).
 */
export function formatLapakShiftHours(
  shift: ShiftType | string | null | undefined,
  lapak?: { shift_pagi?: [string, string] | null; shift_siang?: [string, string] | null } | null,
  withWib: boolean = true
): string {
  if (!shift) return "";
  const normalized = shift.toLowerCase().trim();
  const suffix = withWib ? " WIB" : "";
  if (normalized === "pagi") {
    if (lapak?.shift_pagi && Array.isArray(lapak.shift_pagi) && lapak.shift_pagi.length === 2) {
      return `${lapak.shift_pagi[0]} - ${lapak.shift_pagi[1]}${suffix}`;
    }
    return `08:00 - 16:00${suffix}`;
  }
  if (normalized === "siang") {
    if (lapak?.shift_siang && Array.isArray(lapak.shift_siang) && lapak.shift_siang.length === 2) {
      return `${lapak.shift_siang[0]} - ${lapak.shift_siang[1]}${suffix}`;
    }
    return `13:00 - 21:00${suffix}`;
  }
  return "";
}
