"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BorrowDialog } from "@/components/books/borrow-dialog";
import type { Book, BookSearchResult } from "@/types";

interface BookCardProps {
  book: Book | BookSearchResult;
  /** If omitted the Issue button is hidden (e.g. in admin catalogue view) */
  showIssue?: boolean;
}

function isScoredBook(b: Book | BookSearchResult): b is BookSearchResult {
  return "score" in b;
}

export function BookCard({ book, showIssue = true }: BookCardProps) {
  const [borrowTarget, setBorrowTarget] = useState<Book | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const available = book.available_copies > 0;
  const scored = isScoredBook(book);
  const isFuzzy = scored && book.is_fuzzy;

  return (
    <>
      <article className="bg-surface rounded-xl border border-border shadow-card overflow-hidden hover:shadow-md transition-shadow duration-200">
        {/* Fuzzy match ribbon */}
        {isFuzzy && (
          <div className="bg-primary/10 border-b border-primary/20 px-3 py-1 flex items-center gap-1.5">
            <span className="text-primary font-semibold text-xs">≈</span>
            <span className="text-primary text-xs">Fuzzy match</span>
            {scored && (
              <span className="ml-auto text-primary/70 text-xs tabular-nums">
                {Math.round(book.score * 100)}%
              </span>
            )}
          </div>
        )}

        {book.cover_url && !imgFailed ? (
          <img
            src={book.cover_url}
            alt={`Cover of ${book.title}`}
            className="w-full h-44 object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="w-full h-44 bg-gradient-to-br from-primary/10 to-primary/5 flex flex-col items-center justify-center gap-2">
            <BookOpen size={28} className="text-primary/40" />
            <span className="text-xs text-muted/60 font-medium">{book.category}</span>
          </div>
        )}

        <div className="p-4 flex flex-col gap-3">
          <div>
            <h3 className="font-semibold text-foreground line-clamp-2 leading-snug text-sm">
              {book.title}
            </h3>
            <p className="text-xs text-muted mt-0.5">{book.author}</p>
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="neutral">{book.category}</Badge>
            <span className={`text-xs font-medium ${available ? "text-primary" : "text-accent"}`}>
              {available ? `${book.available_copies} available` : "Unavailable"}
            </span>
          </div>

          {showIssue && (
            <Button
              variant={available ? "primary" : "outline"}
              size="sm"
              disabled={!available}
              onClick={() => setBorrowTarget(book)}
              className="w-full"
            >
              Issue Book
            </Button>
          )}
        </div>
      </article>

      <BorrowDialog
        book={borrowTarget}
        onClose={() => setBorrowTarget(null)}
      />
    </>
  );
}
