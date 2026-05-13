/**
 * Shimmer skeleton — shown while async data loads (context.md §2 requirement).
 * Uses the .shimmer utility class defined in globals.css.
 */
import type React from "react";

interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "full";
  style?: React.CSSProperties;
}

const roundedCls = {
  sm:   "rounded",
  md:   "rounded-xl",
  lg:   "rounded-2xl",
  full: "rounded-full",
};

export function Skeleton({ className = "", rounded = "md" }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`shimmer ${roundedCls[rounded]} ${className}`}
    />
  );
}

/* Pre-built composite skeletons */

export function BookCardSkeleton() {
  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-card">
      <Skeleton className="h-40 w-full" rounded="sm" />
      <div className="p-4 flex flex-col gap-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-20" rounded="full" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4" style={{ width: `${60 + (i * 17) % 40}%` }} />
        </td>
      ))}
    </tr>
  );
}
