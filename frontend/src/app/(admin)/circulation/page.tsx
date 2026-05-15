"use client";

import { useState } from "react";
import { RefreshCw, Bell, AlertCircle, ArrowLeftRight, CheckCircle2, XCircle, Mail } from "lucide-react";
import { useAllTransactions, useReturnBook } from "@/lib/hooks/use-transactions";
import { useBooks } from "@/lib/hooks/use-books";
import { useNotifications, useSendOverdueNotifications } from "@/lib/hooks/use-notifications";
import { ScreenWrapper } from "@/components/ui/screen-wrapper";
import { Button } from "@/components/ui/button";
import { TransactionBadge } from "@/components/ui/badge";
import { TableRowSkeleton, Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { api } from "@/lib/api";

type StatusFilter = "" | "BORROWED" | "RETURNED" | "OVERDUE";

const FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "All",      value: "" },
  { label: "Borrowed", value: "BORROWED" },
  { label: "Overdue",  value: "OVERDUE" },
  { label: "Returned", value: "RETURNED" },
];

export default function CirculationPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [marking,      setMarking]      = useState(false);
  const [markResult,   setMarkResult]   = useState<string | null>(null);

  const { data: txs,   isLoading, isError, error } = useAllTransactions({ status: statusFilter });
  const { data: books }                             = useBooks();
  const returnBook                                  = useReturnBook();
  const { data: notifs, isLoading: notifsLoading }  = useNotifications(10);
  const sendNotifs                                  = useSendOverdueNotifications();

  function getBookTitle(bookId: string) {
    return books?.find((b) => b.id === bookId)?.title ?? bookId.slice(0, 8) + "…";
  }

  async function handleMarkOverdue() {
    setMarking(true);
    setMarkResult(null);
    try {
      const res = await api.post<{ updated: number; message: string }>(
        "/api/v1/transactions/admin/mark-overdue", {}
      );
      setMarkResult(res.message);
    } catch (err) {
      setMarkResult((err as Error).message);
    } finally {
      setMarking(false);
    }
  }

  async function handleSendNotifications() {
    try {
      const res = await sendNotifs.mutateAsync();
      alert(`Notifications sent: ${res.sent} | Already notified today: ${res.skipped}`);
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function handleReturn(txId: string) {
    try {
      await returnBook.mutateAsync(txId);
    } catch (err) {
      alert((err as Error).message);
    }
  }

  return (
    <ScreenWrapper
      title="Circulation"
      subtitle="Manage all borrowing and return activity"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            loading={sendNotifs.isPending}
            onClick={handleSendNotifications}
          >
            <Bell size={14} /> Send Notifications
          </Button>
          <Button variant="accent" size="sm" loading={marking} onClick={handleMarkOverdue}>
            <RefreshCw size={14} /> Mark Overdue
          </Button>
        </div>
      }
    >
      {/* Mark-overdue feedback banner */}
      {markResult && (
        <div className="mb-4 px-4 py-3 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary">
          {markResult}
        </div>
      )}

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={[
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              statusFilter === f.value
                ? "bg-primary text-white"
                : "bg-surface border border-border text-muted hover:border-border-strong hover:text-foreground",
            ].join(" ")}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isError && (
        <EmptyState icon={AlertCircle} title="Could not load transactions" description={(error as Error).message} />
      )}

      {!isError && (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-160">
            <thead>
              <tr className="border-b border-border bg-background/50">
                <th className="text-left text-xs text-muted font-medium px-6 py-3">Book</th>
                <th className="text-left text-xs text-muted font-medium px-4 py-3">Member ID</th>
                <th className="text-left text-xs text-muted font-medium px-4 py-3">Status</th>
                <th className="text-left text-xs text-muted font-medium px-4 py-3">Borrowed</th>
                <th className="text-left text-xs text-muted font-medium px-4 py-3">Due</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => <TableRowSkeleton key={i} cols={6} />)
              ) : (txs ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={ArrowLeftRight}
                      title="No transactions"
                      description="No records match the current filter."
                    />
                  </td>
                </tr>
              ) : (
                (txs ?? []).map((tx) => (
                  <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-background/60">
                    <td className="px-6 py-3.5 font-medium text-foreground max-w-45 truncate text-sm">
                      {getBookTitle(tx.book_id)}
                    </td>
                    <td className="px-4 py-3.5 text-muted font-mono text-xs">
                      {tx.user_id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3.5">
                      <TransactionBadge status={tx.status} />
                    </td>
                    <td className="px-4 py-3.5 text-muted text-xs">
                      {new Date(tx.borrowed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-4 py-3.5 text-muted text-xs">
                      {new Date(tx.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {tx.status !== "RETURNED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={returnBook.isPending}
                          onClick={() => handleReturn(tx.id)}
                        >
                          Return
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </Card>
      )}

      {/* ── Notification log ──────────────────────────────────────────── */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Notification Log</CardTitle>
                <CardDescription>Last 10 overdue alerts sent</CardDescription>
              </div>
              <Mail size={16} className="text-muted" />
            </div>
          </CardHeader>

          <div className="mt-4 space-y-2">
            {notifsLoading && (
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-5 rounded-full shrink-0" />
                  <Skeleton className="h-3 flex-1 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              ))
            )}

            {!notifsLoading && (notifs ?? []).length === 0 && (
              <p className="text-xs text-muted py-2">
                No notifications sent yet. Click &quot;Send Notifications&quot; to begin.
              </p>
            )}

            {!notifsLoading && (notifs ?? []).length > 0 && (
              <div className="space-y-2">
                {(notifs ?? []).map((n) => (
                  <div key={n.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                    {n.email_sent ? (
                      <CheckCircle2 size={15} className="text-primary mt-0.5 shrink-0" />
                    ) : (
                      <XCircle size={15} className="text-accent mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {n.book_title}
                      </p>
                      <p className="text-xs text-muted truncate">{n.email_address}</p>
                    </div>
                    <time className="text-xs text-muted shrink-0 tabular-nums">
                      {new Date(n.sent_at).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </time>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </ScreenWrapper>
  );
}
