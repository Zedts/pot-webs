"use client";

import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { InfoModal } from "@/components/auth/InfoModal";

export function BrandShowcase() {
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  return (
    <>
      <section className="lg:col-span-5 bg-[#800000] p-6 sm:p-8 lg:p-10 text-white flex flex-col justify-between select-none relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-[#A81B1B]/40 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-[#D4AF37]/20 blur-3xl pointer-events-none"></div>

        {/* Top Status Indicator & Info Button */}
        <div className="flex items-center justify-between relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-black/20 border border-white/10 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-semibold text-slate-200">Sistem Aktif</span>
          </div>
          <button
            type="button"
            onClick={() => setIsInfoOpen(true)}
            title="Informasi Sistem"
            className="w-8 h-8 rounded-xl bg-black/20 hover:bg-black/30 border border-white/10 flex items-center justify-center text-slate-200 hover:text-white transition-all text-xs cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
          </button>
        </div>

        {/* Brand Center */}
        <div className="my-8 flex flex-col items-center lg:items-start text-center lg:text-left relative z-10">
          <div className="relative w-24 h-24 mb-4 drop-shadow-md">
            <Logo width={96} height={96} className="w-24 h-24 object-contain drop-shadow-md" priority />
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-wider">POT</h1>
          <h2 className="text-sm font-semibold text-slate-200 mt-1 tracking-wide">Presensi & Operasional</h2>
          <p className="text-xs text-slate-200/90 font-normal mt-2.5 leading-relaxed max-w-xs">
            Portal terpadu pencatatan presensi, pemantauan pengiriman stok, dan rekonsiliasi data lapak harian.
          </p>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between relative z-10">
          <div>
            <span className="text-xs font-semibold text-slate-200 block">Oleh-Oleh Turki Official</span>
            <span className="text-xs text-[#FDE68A] font-script italic">Lebih Dekat untuk Semua</span>
          </div>
          <span className="text-[11px] text-slate-300">v3.1.0</span>
        </div>
      </section>

      <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
    </>
  );
}
