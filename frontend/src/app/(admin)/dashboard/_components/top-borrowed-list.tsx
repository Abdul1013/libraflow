"use client";

import { TrendingUp, AlertCircle } from "lucide-react";
import { useTrendingBooks } from "@/lib/hooks/use-trending";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TopBorrowedList() {
  const { data: books, isLoading, isError } = useTrendingBooks(30, 5);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Top Borrowed</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </div>
          <TrendingUp size={16} className="text-muted" />
        </div>
      </CardHeader>

      <div className="mt-4 space-y-3">
        {isLoading && (
          <>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-4 h-3 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-4/5 rounded" />
                  <Skeleton className="h-2.5 w-2/5 rounded" />
                </div>
                <Skeleton className="w-6 h-3 rounded" />
              </div>
            ))}
          </>
        )}

        {isError && (
          <div className="flex items-center gap-2 py-2 text-xs text-muted">
            <AlertCircle size={13} />
            <span>Could not load data</span>
          </div>
        )}

        {!isLoading && !isError && (books ?? []).length === 0 && (
          <p className="text-xs text-muted py-2">No borrowing activity yet.</p>
        )}

        {!isLoading && !isError && (books ?? []).length > 0 && (
          <ol className="space-y-3">
            {(books ?? []).map((book, i) => (
              <li key={book.id} className="flex items-center gap-3">
                <span className="text-xs font-semibold text-muted w-4 shrink-0 text-center">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{book.title}</p>
                  <p className="text-xs text-muted">{book.category}</p>
                </div>
                <span className="text-xs font-semibold text-primary shrink-0">
                  {book.borrow_count}×
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Card>
  );
}
