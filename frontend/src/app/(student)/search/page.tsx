"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Sparkles, AlertCircle, ArrowRight } from "lucide-react";
import { useBooks } from "@/lib/hooks/use-books";
import { useRecommendations } from "@/lib/hooks/use-recommendations";
import { SearchBar } from "@/components/ui/search-bar";
import { BookCard } from "@/components/ui/book-card";
import { BookCardSkeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardTitle } from "@/components/ui/card";

const CATEGORIES = [
  "All",
  "Computer Science",
  "Engineering",
  "Mathematics",
  "Physics",
  "Literature",
  "History",
  "Economics",
  "Law",
  "Medicine",
  "Other",
];

export default function StudentSearchPage() {
  const [query, setQuery]                   = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const { data: books, isLoading, isError, error } = useBooks({
    query,
    category: activeCategory === "All" ? undefined : activeCategory,
  });

  const { data: recs, isLoading: recsLoading } = useRecommendations(3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Search hero */}
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-1">
          Find a Book
        </h1>
        <p className="text-sm text-muted mb-4">
          Search by title, author, or ISBN. Fuzzy matching catches typos automatically.
        </p>
        <SearchBar
          value={query}
          onChange={setQuery}
          onSearch={setQuery}
          loading={isLoading}
          hint="Try a partial title or the author's last name"
        />
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={[
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150",
              activeCategory === cat
                ? "bg-primary text-white"
                : "bg-surface border border-border text-muted hover:border-border-strong hover:text-foreground",
            ].join(" ")}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* ── Main book grid ────────────────────────────────────────────── */}
        <section className="lg:col-span-3">

          {/* Result count row */}
          {!isLoading && !isError && (
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted">
                  {(books ?? []).length}{" "}
                  {(books ?? []).length === 1 ? "result" : "results"}
                  {query && (
                    <>
                      {" "}for{" "}
                      <span className="font-medium text-foreground">"{query}"</span>
                    </>
                  )}
                </p>
                {query && (books ?? []).some((b) => "is_fuzzy" in b && b.is_fuzzy) && (
                  <p className="text-xs text-primary mt-0.5">
                    ≈ Some results are approximate matches (typo recovery)
                  </p>
                )}
              </div>
              <Badge variant="primary">{activeCategory}</Badge>
            </div>
          )}

          {/* Loading — shimmer grid */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <BookCardSkeleton key={i} />)}
            </div>
          )}

          {/* Error state */}
          {isError && (
            <EmptyState
              icon={AlertCircle}
              title="Could not load books"
              description={(error as Error).message ?? "Check your connection and try again."}
            />
          )}

          {/* Empty results */}
          {!isLoading && !isError && (books ?? []).length === 0 && (
            <EmptyState
              icon={BookOpen}
              title="No books found"
              description={
                query
                  ? `No results for "${query}". Try a different title or author.`
                  : "No books in this category yet."
              }
            />
          )}

          {/* Book grid */}
          {!isLoading && !isError && (books ?? []).length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {(books ?? []).map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </section>

        {/* ── Recommendations sidebar ───────────────────────────────────── */}
        <aside className="lg:col-span-1 space-y-4">
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-primary" />
              <CardTitle>For You</CardTitle>
            </div>

            {/* Loading skeletons */}
            {recsLoading && (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="size-10 rounded-lg bg-border/50 shrink-0 shimmer" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3 bg-border/60 rounded-full w-4/5 shimmer" />
                      <div className="h-2.5 bg-border/40 rounded-full w-3/5 shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Cold start */}
            {!recsLoading && (recs ?? []).length === 0 && (
              <p className="text-xs text-muted leading-relaxed">
                Borrow a book to unlock personalised picks here.
              </p>
            )}

            {/* Live recommendations */}
            {!recsLoading && (recs ?? []).length > 0 && (
              <>
                <p className="text-xs text-muted mb-3">{recs![0].reason}</p>
                <div className="space-y-3">
                  {(recs ?? []).map((rec) => (
                    <div key={rec.id} className="flex gap-3 group">
                      <div className="size-10 rounded-lg bg-primary/10 shrink-0 flex items-center justify-center">
                        <BookOpen size={14} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">
                          {rec.title}
                        </p>
                        <p className="text-xs text-muted mt-0.5 truncate">{rec.author}</p>
                        <div className="mt-1 h-1 rounded-full bg-border overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${rec.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/recommendations"
                  className="mt-4 flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                >
                  See all recommendations <ArrowRight size={12} />
                </Link>
              </>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
