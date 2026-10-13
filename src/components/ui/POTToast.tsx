"use client";

export type ToastType = "success" | "error" | "warning" | "info";

export interface POTToastProps {
  type: ToastType;
  title?: string;
  message: string;
  closeToast?: () => void;
}

export function POTToast({ type, title, message, closeToast }: POTToastProps) {
  const config = {
    success: {
      defaultTitle: "Berhasil",
      titleColor: "text-emerald-700",
      dotBg: "bg-emerald-500",
      badgeBg: "bg-emerald-50 border-emerald-200",
      icon: (
        <svg
          className="w-4 h-4 text-emerald-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    error: {
      defaultTitle: "Gagal",
      titleColor: "text-[#A81B1B]",
      dotBg: "bg-[#A81B1B]",
      badgeBg: "bg-[#FEF2F2] border-[#FCA5A5]",
      icon: (
        <svg
          className="w-4 h-4 text-[#A81B1B]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
          <circle cx="12" cy="16" r="1" fill="currentColor" />
        </svg>
      ),
    },
    warning: {
      defaultTitle: "Perhatian",
      titleColor: "text-amber-700",
      dotBg: "bg-amber-500",
      badgeBg: "bg-amber-50 border-amber-200",
      icon: (
        <svg
          className="w-4 h-4 text-amber-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.5m0 3.5h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      ),
    },
    info: {
      defaultTitle: "Informasi",
      titleColor: "text-sky-700",
      dotBg: "bg-sky-500",
      badgeBg: "bg-sky-50 border-sky-200",
      icon: (
        <svg
          className="w-4 h-4 text-sky-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="16" x2="12" y2="12" strokeLinecap="round" />
          <circle cx="12" cy="8" r="1" fill="currentColor" />
        </svg>
      ),
    },
  }[type];

  const displayTitle = title || config.defaultTitle;

  return (
    <div className="flex items-start w-full gap-3 select-none">
      {/* Icon Badge */}
      <div
        className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-xs ${config.badgeBg}`}
      >
        {config.icon}
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center space-x-1.5 mb-0.5">
          <span className={`w-1.5 h-1.5 rounded-full ${config.dotBg}`} />
          <span className={`text-xs font-bold tracking-tight ${config.titleColor}`}>
            {displayTitle}
          </span>
        </div>
        <p className="text-xs text-[#4B5563] font-medium leading-relaxed select-text break-words">
          {message}
        </p>
      </div>

      {/* Sleek Close Button */}
      {closeToast && (
        <button
          type="button"
          onClick={closeToast}
          aria-label="Tutup notifikasi"
          className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#1A1A1A] hover:bg-[#F3E7D8]/60 transition-colors cursor-pointer shrink-0 ml-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
