"use client";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InfoModal({ isOpen, onClose }: InfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xs bg-white rounded-2xl p-5 shadow-2xl border border-[#F3E7D8] text-center relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          aria-label="Tutup modal"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="w-11 h-11 rounded-full bg-[#A81B1B]/10 text-[#A81B1B] flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
        </div>

        <h4 className="font-bold text-[#1A1A1A] text-sm">POT System</h4>
        <p className="text-[11px] text-[#6B7280] mt-0.5">Presensi Oleh-Oleh Turki</p>

        <div className="mt-4 pt-3 border-t border-[#F3E7D8] text-left text-[11px] text-slate-600 space-y-2">
          <div className="flex justify-between items-center">
            <span>Versi:</span>
            <span className="font-semibold text-slate-800">v3.1.0</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Koneksi Server:</span>
            <span className="font-semibold text-emerald-600 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Online</span>
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Dukungan:</span>
            <span className="font-semibold text-[#A81B1B]">hrd@olehturki.id</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-4 py-2 rounded-xl bg-[#FDF6EE] hover:bg-[#F3E7D8] text-slate-700 font-semibold text-xs transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
