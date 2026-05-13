import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, keys } from "@/lib/api";
import type { Transaction, TransactionCreate } from "@/types";

// ── Admin: all transactions ────────────────────────────────────────────────

export function useAllTransactions(filters: { status?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  const qs = params.toString();

  return useQuery({
    queryKey: keys.transactions(Object.fromEntries(params)),
    queryFn:  () => api.get<Transaction[]>(`/api/v1/transactions${qs ? `?${qs}` : ""}`),
  });
}

// ── Student: my borrowing history ──────────────────────────────────────────

export function useMyTransactions() {
  return useQuery({
    queryKey: keys.transactions({ scope: "me" }),
    queryFn:  () => api.get<Transaction[]>("/api/v1/transactions/me"),
  });
}

// ── Borrow a book ──────────────────────────────────────────────────────────

export function useBorrowBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransactionCreate) =>
      api.post<Transaction>("/api/v1/transactions", payload),
    onSuccess: () => {
      // Refresh both the book list (available_copies changed) and transaction list
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

// ── Return a book ──────────────────────────────────────────────────────────

export function useReturnBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (transactionId: string) =>
      api.patch<Transaction>(`/api/v1/transactions/${transactionId}/return`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
