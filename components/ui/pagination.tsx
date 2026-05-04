"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblings?: number;
  className?: string;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function buildRange(current: number, total: number, siblings: number) {
  const pages: (number | "ellipsis-start" | "ellipsis-end")[] = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  pages.push(1);

  const start = Math.max(2, current - siblings);
  const end = Math.min(total - 1, current + siblings);

  if (start > 2) pages.push("ellipsis-start");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("ellipsis-end");

  pages.push(total);
  return pages;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblings = 1,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const range = buildRange(currentPage, totalPages, siblings);

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-1", className)}
    >
      <Button
        variant="ghost"
        size="icon"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {range.map((item) => {
        if (item === "ellipsis-start" || item === "ellipsis-end") {
          return (
            <span
              key={item}
              className="flex h-9 w-9 items-center justify-center text-xs text-muted-foreground"
              aria-hidden="true"
            >
              <MoreHorizontal className="h-4 w-4" />
            </span>
          );
        }

        const isActive = item === currentPage;
        return (
          <Button
            key={item}
            variant={isActive ? "default" : "ghost"}
            size="icon"
            onClick={() => onPageChange(item)}
            aria-label={`Page ${item}`}
            aria-current={isActive ? "page" : undefined}
          >
            {item}
          </Button>
        );
      })}

      <Button
        variant="ghost"
        size="icon"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
