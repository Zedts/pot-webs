"use client";

import React from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  valueColor?: string;
  isLoading?: boolean;
}

export function MetricCard({
  title,
  value,
  subtext,
  valueColor = "text-[#18314E]",
  isLoading = false,
}: MetricCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-[#F3E7D8] animate-pulse flex flex-col justify-between h-32">
        <div className="space-y-3">
          <div className="h-3.5 bg-slate-200 rounded w-24"></div>
          <div className="h-7 bg-slate-200 rounded w-36"></div>
        </div>
        <div className="h-3 bg-slate-100 rounded w-20"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-[#F3E7D8] flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <span className="text-xs font-semibold text-[#6B7280]">{title}</span>
        <div className={`mt-2 text-xl xl:text-2xl font-extrabold tracking-tight ${valueColor}`}>
          {value}
        </div>
      </div>
      <div className="mt-3 min-h-[1rem]">
        {subtext ? (
          <span className="text-xs font-medium text-[#6B7280]">{subtext}</span>
        ) : (
          <div className="h-4" />
        )}
      </div>
    </div>
  );
}
