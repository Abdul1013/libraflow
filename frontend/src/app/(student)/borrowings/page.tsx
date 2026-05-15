"use client";

import { BookMarked, AlertCircle } from "lucide-react";
import { useMyTransactions, useReturnBook } from "@/lib/hooks/use-transactions";
import { useBooks } from "@/lib/hooks/use-books";
import { ScreenWrapper } from "@/components/ui/screen-wrapper";
import { TransactionBadge } from "@/components/ui/badge";
import { TableRowSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Transaction } from "@/types";

function useBookTitle(bookId: string, books: ReturnType<typeof useBooks>["data"]) {
  return books?.find((b) => b.id === bookId)?.title ?? bookId.slice(0, 8) + "…";
}

function ReturnButton({ transaction }: { transaction: Transaction }) {
  const returnBook = useReturnBook();
  const [error, setError]       = [null, () => {}]; // inline for brevity

  if (transaction.status === "RETURNED") return null;

  async function handle() {
    try {
      await returnBook.mutateAsync(transaction.id);
    } catch (err) {
      alert((err as Error).message);
    }
  }

  return (
    <Button
      variant="accent"
      size="sm"
      loading={returnBook.isPending}
      onClick={handle}
    >
      Return
    </Button>
  );
}

export default function BorrowingsPage() {
  const { data: txs,   isLoading: txLoading,   isError: txError   } = useMyTransactions();
  const { data: books, isLoading: booksLoading                     } = useBooks();

  const loading = txLoading || booksLoading;

  const active   = (txs ?? []).filter((t) => t.status !== "RETURNED");
  const returned = (txs ?? []).filter((t) => t.status === "RETURNED");

  return (
    <ScreenWrapper title="My Borrowings" subtitle="Track your active loans and borrowing history">
      {txError && (
        <EmptyState
          icon={AlertCircle}
          title="Could not load borrowings"
          description="Check your connection or sign in again."
        />
      )}

      {!txError && (
        <div className="space-y-6">
          {/* Active loans */}
          <Card padding="none" className="overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Active Loans</h2>
                <p className="text-xs text-muted mt-0.5">
                  {loading ? "…" : active.length} book{active.length !== 1 ? "s" : ""} on loan
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-120">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs text-muted font-medium px-6 py-3">Book</th>
                  <th className="text-left text-xs text-muted font-medium px-4 py-3">Status</th>
                  <th className="text-left text-xs text-muted font-medium px-4 py-3">Due Date</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(3)].map((_, i) => <TableRowSkeleton key={i} cols={4} />)
                ) : active.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-muted">
                      No active loans — browse the catalogue to borrow a book.
                    </td>
                  </tr>
                ) : (
                  active.map((tx) => (
                    <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-background/60">
                      <td className="px-6 py-3.5 font-medium text-foreground">
                        {useBookTitle(tx.book_id, books)}
                      </td>
                      <td className="px-4 py-3.5">
                        <TransactionBadge status={tx.status} />
                      </td>
                      <td className="px-4 py-3.5 text-muted text-xs">
                        {new Date(tx.due_date).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <ReturnButton transaction={tx} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </Card>

          {/* History */}
          {returned.length > 0 && (
            <Card padding="none" className="overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Return History</h2>
              </div>
              <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-96">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs text-muted font-medium px-6 py-3">Book</th>
                    <th className="text-left text-xs text-muted font-medium px-4 py-3">Borrowed</th>
                    <th className="text-left text-xs text-muted font-medium px-4 py-3">Returned</th>
                  </tr>
                </thead>
                <tbody>
                  {returned.map((tx) => (
                    <tr key={tx.id} className="border-b border-border last:border-0">
                      <td className="px-6 py-3 text-foreground font-medium">
                        {useBookTitle(tx.book_id, books)}
                      </td>
                      <td className="px-4 py-3 text-muted text-xs">
                        {new Date(tx.borrowed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-4 py-3 text-muted text-xs">
                        {tx.returned_at
                          ? new Date(tx.returned_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </Card>
          )}

          {!loading && (txs ?? []).length === 0 && (
            <EmptyState
              icon={BookMarked}
              title="No borrowing history yet"
              description="Head to Search to find your first book."
            />
          )}
        </div>
      )}
    </ScreenWrapper>
  );
}
