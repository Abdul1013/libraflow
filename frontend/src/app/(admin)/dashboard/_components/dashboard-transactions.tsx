"use client";

import { Clock, AlertCircle } from "lucide-react";
import { useAllTransactions } from "@/lib/hooks/use-transactions";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TransactionBadge } from "@/components/ui/badge";
import { TableRowSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export function DashboardTransactions() {
  const { data: transactions, isLoading, isError, error } = useAllTransactions();

  return (
    <Card padding="none" className="lg:col-span-2 overflow-hidden">
      <CardHeader className="px-6 pt-5 pb-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest borrowing activity</CardDescription>
          </div>
          <Button variant="ghost" size="sm">View all</Button>
        </div>
      </CardHeader>

      <div className="mt-4">
        {isError ? (
          <div className="px-6 pb-5">
            <EmptyState
              icon={AlertCircle}
              title="Failed to load transactions"
              description={(error as Error).message}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-96">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-muted font-medium px-6 py-3">Member</th>
                <th className="text-left text-xs text-muted font-medium px-4 py-3">Status</th>
                <th className="text-left text-xs text-muted font-medium px-4 py-3">Due</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <TableRowSkeleton key={i} cols={3} />
                  ))}
                </>
              ) : (transactions ?? []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-muted">
                    No transactions yet
                  </td>
                </tr>
              ) : (
                (transactions ?? []).slice(0, 7).map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-border last:border-0 hover:bg-background/60 transition-colors"
                  >
                    <td className="px-6 py-3.5 font-medium text-foreground text-xs">
                      {tx.user_id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3.5">
                      <TransactionBadge status={tx.status} />
                    </td>
                    <td className="px-4 py-3.5 text-muted flex items-center gap-1.5 text-xs">
                      <Clock size={11} />
                      {new Date(tx.due_date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </Card>
  );
}
