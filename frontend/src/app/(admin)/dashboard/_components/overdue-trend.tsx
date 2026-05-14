"use client";

import { AlertTriangle } from "lucide-react";
import { useOverdueTrend } from "@/lib/hooks/use-analytics";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const CHART_H = 64; // px height of the bar area

function SparkBars({ points }: { points: { date: string; count: number }[] }) {
  if (points.length === 0) {
    return (
      <p className="text-xs text-muted py-4 text-center">
        No overdue records in this period.
      </p>
    );
  }

  const max = Math.max(...points.map((p) => p.count), 1);

  return (
    <div className="mt-4">
      {/* Bar chart */}
      <div className="flex items-end gap-1" style={{ height: CHART_H }}>
        {points.map((p) => {
          const pct = p.count / max;
          const barH = Math.max(4, Math.round(pct * CHART_H));
          const isHigh = pct >= 0.75;
          return (
            <div
              key={p.date}
              className="group relative flex-1 flex flex-col items-center justify-end"
              style={{ height: CHART_H }}
            >
              <div
                className={`w-full rounded-t transition-all duration-300 ${
                  isHigh ? "bg-accent" : "bg-primary/60"
                }`}
                style={{ height: barH }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                <div className="bg-foreground text-background text-xs rounded px-2 py-1 whitespace-nowrap shadow-md">
                  {p.count} overdue
                  <br />
                  <span className="opacity-60">{p.date}</span>
                </div>
                <div className="w-1.5 h-1.5 bg-foreground rotate-45 -mt-0.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* X-axis labels — first, middle, last */}
      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-muted">{formatDate(points[0].date)}</span>
        {points.length > 2 && (
          <span className="text-xs text-muted">
            {formatDate(points[Math.floor(points.length / 2)].date)}
          </span>
        )}
        <span className="text-xs text-muted">{formatDate(points[points.length - 1].date)}</span>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function OverdueTrend() {
  const { data: points, isLoading } = useOverdueTrend(14);

  const total = (points ?? []).reduce((s, p) => s + p.count, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Overdue Trend</CardTitle>
            <CardDescription>Last 14 days</CardDescription>
          </div>
          <AlertTriangle size={16} className={total > 0 ? "text-accent" : "text-muted"} />
        </div>
        {!isLoading && total > 0 && (
          <p className="text-xs text-muted mt-1">
            {total} overdue event{total !== 1 ? "s" : ""} in the period
          </p>
        )}
      </CardHeader>

      {isLoading ? (
        <div className="mt-4 flex items-end gap-1" style={{ height: CHART_H }}>
          {[...Array(14)].map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-t"
              /* Deterministic heights — avoid SSR/client hydration mismatch */
              style={{ height: ((i * 13 + 7) % (CHART_H - 10)) + 10 }}
            />
          ))}
        </div>
      ) : (
        <SparkBars points={points ?? []} />
      )}
    </Card>
  );
}
