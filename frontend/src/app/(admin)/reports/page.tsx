"use client";

import { useState } from "react";
import {
  BarChart3, TrendingUp, BookOpen, AlertTriangle,
  ArrowLeftRight, Users, Download,
} from "lucide-react";
import { useAnalyticsSummary, useBorrowingTrend, useOverdueTrend, useCategoryStats } from "@/lib/hooks/use-analytics";
import { useTrendingBooks } from "@/lib/hooks/use-trending";
import { ScreenWrapper } from "@/components/ui/screen-wrapper";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// ── Shared chart bar component ─────────────────────────────────────────────

const CHART_H = 96;

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function BarChart({
  points,
  color = "primary",
  emptyMessage,
}: {
  points: { date: string; count: number }[];
  color?: "primary" | "accent";
  emptyMessage?: string;
}) {
  if (points.length === 0) {
    return <p className="text-xs text-muted py-6 text-center">{emptyMessage ?? "No data in this period."}</p>;
  }
  const max = Math.max(...points.map((p) => p.count), 1);
  const colorClass = color === "accent" ? "bg-accent/70" : "bg-primary/60";
  const highClass  = color === "accent" ? "bg-accent"    : "bg-primary";

  return (
    <div className="mt-4">
      <div className="flex items-end gap-0.5" style={{ height: CHART_H }}>
        {points.map((p) => {
          const pct  = p.count / max;
          const barH = Math.max(3, Math.round(pct * CHART_H));
          return (
            <div
              key={p.date}
              className="group relative flex-1 flex flex-col items-center justify-end"
              style={{ height: CHART_H }}
            >
              <div
                className={`w-full rounded-t transition-colors ${pct >= 0.75 ? highClass : colorClass}`}
                style={{ height: barH }}
              />
              <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                <div className="bg-foreground text-background text-xs rounded px-2 py-1 whitespace-nowrap shadow-md">
                  {p.count}<br /><span className="opacity-60">{p.date}</span>
                </div>
                <div className="w-1.5 h-1.5 bg-foreground rotate-45 -mt-0.5" />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-muted">{formatDate(points[0].date)}</span>
        {points.length > 2 && (
          <span className="text-xs text-muted">{formatDate(points[Math.floor(points.length / 2)].date)}</span>
        )}
        <span className="text-xs text-muted">{formatDate(points[points.length - 1].date)}</span>
      </div>
    </div>
  );
}

function BarSkeleton({ bars }: { bars: number }) {
  return (
    <div className="mt-4 flex items-end gap-0.5" style={{ height: CHART_H }}>
      {[...Array(bars)].map((_, i) => (
        <Skeleton
          key={i}
          className="flex-1 rounded-t"
          style={{ height: ((i * 17 + 11) % (CHART_H - 12)) + 12 }}
        />
      ))}
    </div>
  );
}

// ── Category horizontal bar chart ─────────────────────────────────────────

function CategoryChart() {
  const { data: cats, isLoading } = useCategoryStats();

  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-3 w-8 rounded" />
            </div>
            <Skeleton className="h-2.5 rounded-full" style={{ width: `${((i * 23 + 40) % 60) + 30}%` }} />
          </div>
        ))}
      </div>
    );
  }

  const list = cats ?? [];
  if (list.length === 0) return <p className="text-xs text-muted mt-4 text-center">No data yet.</p>;

  const maxLoans = Math.max(...list.map((c) => c.loan_count), 1);

  return (
    <div className="space-y-3 mt-4">
      {list.map((cat) => (
        <div key={cat.category}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-foreground">{cat.category}</span>
            <span className="text-xs text-muted tabular-nums">
              {cat.loan_count} loans · {cat.book_count} books
            </span>
          </div>
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${(cat.loan_count / maxLoans) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Top books table ────────────────────────────────────────────────────────

function TopBooksTable() {
  const { data: books, isLoading } = useTrendingBooks(30, 10);

  if (isLoading) {
    return (
      <div className="space-y-2 mt-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <Skeleton className="size-6 rounded-full shrink-0" />
            <Skeleton className="h-3 flex-1 rounded" />
            <Skeleton className="h-3 w-12 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const list = books ?? [];
  if (list.length === 0) return <p className="text-xs text-muted mt-4 text-center">No borrowing data yet.</p>;

  return (
    <div className="mt-4 space-y-1">
      {list.map((book, i) => (
        <div key={book.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
          <span className={[
            "size-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
            i === 0 ? "bg-primary text-white" :
            i === 1 ? "bg-primary/70 text-white" :
            i === 2 ? "bg-primary/40 text-primary" :
                      "bg-border text-muted",
          ].join(" ")}>
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{book.title}</p>
            <p className="text-xs text-muted truncate">{book.author}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-semibold text-foreground tabular-nums">{book.borrow_count}</p>
            <p className="text-xs text-muted">borrows</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Summary KPI strip ──────────────────────────────────────────────────────

function SummaryStrip() {
  const { data: s, isLoading } = useAnalyticsSummary();

  const kpis = [
    { label: "Total Books",    value: s?.total_books,    icon: BookOpen },
    { label: "Active Loans",   value: s?.active_loans,   icon: ArrowLeftRight },
    { label: "Overdue",        value: s?.overdue_count,  icon: AlertTriangle, accent: true },
    { label: "Members",        value: s?.member_count,   icon: Users },
    { label: "Returned",       value: s?.total_returned, icon: TrendingUp },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
      {kpis.map(({ label, value, icon: Icon, accent }) => (
        <Card key={label} className="flex items-center gap-3 py-3 px-4">
          <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${accent && (value ?? 0) > 0 ? "bg-accent/10" : "bg-primary/10"}`}>
            <Icon size={15} className={(accent && (value ?? 0) > 0) ? "text-accent" : "text-primary"} />
          </div>
          <div>
            {isLoading
              ? <Skeleton className="h-5 w-10 rounded mb-1" />
              : <p className="text-xl font-semibold text-foreground tabular-nums">{value ?? 0}</p>
            }
            <p className="text-xs text-muted">{label}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

type Period = 7 | 14 | 30;

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>(30);

  const { data: borrowTrend, isLoading: borrowLoading } = useBorrowingTrend(period);
  const { data: overdueTrend, isLoading: overdueLoading } = useOverdueTrend(period);

  function exportCSV() {
    const rows = (borrowTrend ?? []).map((p) => `${p.date},${p.count}`);
    const csv  = ["Date,Borrows", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href: url, download: "libraflow-borrowing.csv" });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ScreenWrapper
      title="Reports"
      subtitle="Library activity analytics and trends"
      actions={
        <div className="flex items-center gap-2">
          {([7, 14, 30] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={[
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                period === p
                  ? "bg-primary text-white"
                  : "bg-surface border border-border text-muted hover:text-foreground",
              ].join(" ")}
            >
              {p}d
            </button>
          ))}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-surface border border-border text-muted hover:text-foreground transition-colors"
          >
            <Download size={12} /> Export
          </button>
        </div>
      }
    >
      <SummaryStrip />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Borrowing trend */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Borrowing Activity</CardTitle>
                <CardDescription>Daily new loans — last {period} days</CardDescription>
              </div>
              <TrendingUp size={16} className="text-primary" />
            </div>
          </CardHeader>
          {borrowLoading
            ? <BarSkeleton bars={period} />
            : <BarChart points={borrowTrend ?? []} color="primary" emptyMessage="No borrows recorded in this period." />
          }
        </Card>

        {/* Overdue trend */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Overdue Trend</CardTitle>
                <CardDescription>Books overdue per day — last {period} days</CardDescription>
              </div>
              <AlertTriangle size={16} className={
                (overdueTrend ?? []).some((p) => p.count > 0) ? "text-accent" : "text-muted"
              } />
            </div>
          </CardHeader>
          {overdueLoading
            ? <BarSkeleton bars={period} />
            : <BarChart points={overdueTrend ?? []} color="accent" emptyMessage="No overdue records in this period." />
          }
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Borrowing by Category</CardTitle>
                <CardDescription>Total loans and book count per department</CardDescription>
              </div>
              <BarChart3 size={16} className="text-primary" />
            </div>
          </CardHeader>
          <CategoryChart />
        </Card>

        {/* Top 10 books */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top 10 Most Borrowed</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </div>
              <BookOpen size={16} className="text-primary" />
            </div>
          </CardHeader>
          <TopBooksTable />
        </Card>
      </div>
    </ScreenWrapper>
  );
}
