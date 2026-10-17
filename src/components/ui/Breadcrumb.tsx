"use client";

import React from "react";
import Link from "next/link";
import { HugeIcon } from "@/components/ui/HugeIcon";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs text-[#6B7280]">
      <ol className="flex items-center space-x-1.5 flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center space-x-1.5">
              {index > 0 && (
                <span className="text-slate-400 shrink-0">
                  <HugeIcon icon={ArrowRight01Icon} size={12} strokeWidth={2} />
                </span>
              )}
              {isLast || !item.href ? (
                <span className="font-bold text-[#18314E]" aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="font-medium text-[#6B7280] hover:text-[#A81B1B] transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
