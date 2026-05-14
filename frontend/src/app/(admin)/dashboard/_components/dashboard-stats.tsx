"use client";

import { BookOpen, ArrowLeftRight, AlertTriangle, Users } from "lucide-react";
import { useAnalyticsSummary } from "@/lib/hooks/use-analytics";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardStats() {
  const { data, isLoading } = useAnalyticsSummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-surface rounded-xl border border-border p-5 space-y-3">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-7 w-16 rounded" />
            <Skeleton className="h-2.5 w-32 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title:      "Total Books",
      value:      (data?.total_books ?? 0).toLocaleString(),
      subtitle:   "in the catalogue",
      icon:       BookOpen,
      trend:      "neutral" as const,
      trendLabel: "live count",
      variant:    "default"  as const,
    },
    {
      title:      "Active Loans",
      value:      (data?.active_loans ?? 0).toLocaleString(),
      subtitle:   "currently borrowed",
      icon:       ArrowLeftRight,
      trend:      "neutral" as const,
      trendLabel: "live count",
      variant:    "default"  as const,
    },
    {
      title:      "Overdue",
      value:      (data?.overdue_count ?? 0).toLocaleString(),
      subtitle:   "past due date",
      icon:       AlertTriangle,
      trend:      (data?.overdue_count ?? 0) > 0 ? ("down" as const) : ("up" as const),
      trendLabel: (data?.overdue_count ?? 0) > 0 ? "action required" : "all on time",
      variant:    (data?.overdue_count ?? 0) > 0 ? ("accent" as const) : ("default" as const),
    },
    {
      title:      "Members",
      value:      (data?.member_count ?? 0).toLocaleString(),
      subtitle:   "active accounts",
      icon:       Users,
      trend:      "neutral" as const,
      trendLabel: "live count",
      variant:    "default"  as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      {stats.map((s) => (
        <StatCard key={s.title} {...s} />
      ))}
    </div>
  );
}
