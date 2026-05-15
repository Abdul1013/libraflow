"use client";

import { Sparkles, TrendingUp, AlertCircle, BookOpen, Flame } from "lucide-react";
import { useRecommendations } from "@/lib/hooks/use-recommendations";
import { useTrendingBooks } from "@/lib/hooks/use-trending";
import { BookCard } from "@/components/ui/book-card";
import { BookCardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

export default function RecommendationsPage() {
  const { data: recs,     isLoading: recsLoading, isError, error } = useRecommendations(10);
  const { data: trending, isLoading: trendLoading }                = useTrendingBooks(30, 6);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">

      {/* ── For You ─────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={20} className="text-primary" />
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              For You
            </h1>
          </div>
          <p className="text-sm text-muted">
            Personalised picks powered by borrowing history — collaborative
            filtering blended with category popularity.
          </p>
        </div>

        {recsLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <BookCardSkeleton key={i} />)}
          </div>
        )}

        {isError && (
          <EmptyState
            icon={AlertCircle}
            title="Could not load recommendations"
            description={(error as Error).message ?? "Check your connection and try again."}
          />
        )}

        {!recsLoading && !isError && (recs ?? []).length === 0 && (
          <EmptyState
            icon={BookOpen}
            title="No recommendations yet"
            description="Borrow a few books and we'll surface personalised picks for you here."
          />
        )}

        {!recsLoading && !isError && (recs ?? []).length > 0 && (
          <>
            <div className="flex items-center gap-2">
              <Badge variant="primary">{recs![0].reason}</Badge>
              <span className="text-xs text-muted">
                {recs!.length} recommendation{recs!.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(recs ?? []).map((rec) => (
                <div key={rec.id}>
                  <BookCard book={rec} />
                  <div className="mt-1.5 px-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-muted">Match</span>
                      <span className="text-xs font-medium text-primary tabular-nums">
                        {Math.round(rec.confidence * 100)}%
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${rec.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── Trending Now ────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame size={18} className="text-accent" />
            <h2 className="text-xl font-semibold text-foreground tracking-tight">
              Trending Now
            </h2>
          </div>
          <p className="text-sm text-muted">
            Most borrowed across the library in the last 30 days.
          </p>
        </div>

        {trendLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <BookCardSkeleton key={i} />)}
          </div>
        )}

        {!trendLoading && (trending ?? []).length === 0 && (
          <EmptyState
            icon={TrendingUp}
            title="No trending data yet"
            description="Once students start borrowing, trending books will appear here."
          />
        )}

        {!trendLoading && (trending ?? []).length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(trending ?? []).map((book, idx) => (
              <div key={book.id}>
                <BookCard book={book} />
                <div className="mt-1.5 px-1 flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-accent tabular-nums">
                    #{idx + 1}
                  </span>
                  <span className="text-xs text-muted">
                    {book.borrow_count} borrow{book.borrow_count !== 1 ? "s" : ""} this month
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
