"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { HugeIcon } from "@/components/ui/HugeIcon";
import { Delete02Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

interface TtdPengirimCanvasProps {
  onChange: (blob: Blob | null) => void;
  initialImageUrl?: string | null;
  disabled?: boolean;
}

export function TtdPengirimCanvas({
  onChange,
  initialImageUrl,
  disabled = false,
}: TtdPengirimCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(Boolean(initialImageUrl));

  // Set up canvas resolution for HiDPI/Retina screens
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set internal resolution
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.strokeStyle = "#000000"; // strictly black ink
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  }, []);

  useEffect(() => {
    setupCanvas();
    const handleResize = () => {
      // Re-setup on window resize
      setupCanvas();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setupCanvas]);

  // Load existing signature image if provided
  useEffect(() => {
    if (initialImageUrl && canvasRef.current) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const scale = Math.min(rect.width / img.width, rect.height / img.height);
        const x = (rect.width - img.width * scale) / 2;
        const y = (rect.height - img.height * scale) / 2;
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        setHasSignature(true);
      };
      img.src = initialImageUrl;
    }
  }, [initialImageUrl]);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();

    if (!hasSignature) {
      setHasSignature(true);
    }
  };

  const exportBlob = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      onChange(blob);
    }, "image/png");
  }, [onChange]);

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }
    setIsDrawing(false);
    exportBlob();
  };

  const handleClear = () => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange(null);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Tanda Tangan Petugas Pengirim <span className="text-slate-400 font-normal normal-case">(Opsional)</span>
        </label>
        <div className="flex items-center gap-2">
          {hasSignature ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <HugeIcon icon={CheckmarkCircle02Icon} size={12} />
              Tanda Tangan Terisi
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">
              Belum ditandatangani
            </span>
          )}
          {hasSignature && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
            >
              <HugeIcon icon={Delete02Icon} size={12} />
              Hapus
            </button>
          )}
        </div>
      </div>

      <div className="relative border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-32 touch-none cursor-crosshair bg-white block"
          style={{ touchAction: "none" }}
        />
        {!hasSignature && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-slate-300 select-none">
            Goreskan tanda tangan petugas pengirim di area ini
          </div>
        )}
      </div>
      <p className="text-[11px] text-slate-400">
        Tanda tangan digital ini akan dilampirkan sebagai verifikasi fisik saat pengiriman DO.
      </p>
    </div>
  );
}
