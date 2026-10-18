"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { HugeIcon } from "@/components/ui/HugeIcon";
import { Search01Icon, ArrowDown01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  role?: string;
  [key: string]: unknown;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  renderItem?: (option: SelectOption, isSelected: boolean) => React.ReactNode;
  renderSelected?: (option: SelectOption) => React.ReactNode;
  emptyMessage?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Pilih salah satu...",
  searchPlaceholder = "Cari pilihan...",
  disabled = false,
  required = false,
  className = "",
  renderItem,
  renderSelected,
  emptyMessage = "Tidak ada pilihan yang cocok.",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const lower = searchTerm.toLowerCase().trim();
    return options.filter((opt) => {
      const labelMatch = opt.label?.toLowerCase().includes(lower);
      const subMatch = opt.sublabel?.toLowerCase().includes(lower);
      const roleMatch = opt.role?.toLowerCase().includes(lower);
      const customMatch = Object.values(opt).some(
        (val) => typeof val === "string" && val.toLowerCase().includes(lower)
      );
      return labelMatch || subMatch || roleMatch || customMatch;
    });
  }, [options, searchTerm]);

  // Handle outside click to close dropdown
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Auto-focus search input when opening
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`w-full px-3.5 py-2.5 text-left text-sm border rounded-xl bg-white flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E] ${
          isOpen ? "border-[#18314E] ring-2 ring-[#18314E]/10" : "border-slate-200"
        } ${
          disabled
            ? "bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200"
            : "hover:border-slate-300 cursor-pointer"
        }`}
      >
        <div className="flex-1 truncate mr-2">
          {selectedOption ? (
            renderSelected ? (
              renderSelected(selectedOption)
            ) : (
              <span className="text-slate-800 font-medium">{selectedOption.label}</span>
            )
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>
        <HugeIcon
          icon={ArrowDown01Icon}
          size={16}
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#18314E]" : ""
          }`}
        />
      </button>

      {/* Hidden input for form constraint */}
      {required && (
        <input
          type="text"
          value={value}
          required
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl shadow-xl border border-[#F3E7D8] overflow-hidden flex flex-col max-h-64 animate-fadeIn">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <HugeIcon icon={Search01Icon} size={15} />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#18314E]/20 focus:border-[#18314E] transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded"
                >
                  <HugeIcon icon={Cancel01Icon} size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto divide-y divide-slate-50 flex-1 py-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`px-3.5 py-2 text-sm cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#FDF6EE] text-[#18314E] font-semibold"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    {renderItem ? (
                      renderItem(opt, isSelected)
                    ) : (
                      <div className="flex flex-col">
                        <span className="truncate">{opt.label}</span>
                        {opt.sublabel && (
                          <span className="text-xs text-slate-400 truncate">
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
