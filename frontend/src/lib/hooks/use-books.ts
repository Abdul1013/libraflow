import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, keys } from "@/lib/api";
import type { Book, BookCreate, BookSearchResult } from "@/types";

interface BookFilters {
  query?: string;
  category?: string;
}

// ── Queries ────────────────────────────────────────────────────────────────

export function useBooks(filters: BookFilters = {}) {
  const params = new URLSearchParams();
  if (filters.query)    params.set("q", filters.query);
  if (filters.category) params.set("category", filters.category);

  const qs = params.toString();

  return useQuery({
    queryKey: keys.books(Object.fromEntries(params)),
    queryFn:  () => api.get<BookSearchResult[]>(`/api/v1/books${qs ? `?${qs}` : ""}`),
  });
}

export function useBook(id: string) {
  return useQuery({
    queryKey: keys.book(id),
    queryFn:  () => api.get<Book>(`/api/v1/books/${id}`),
    enabled:  Boolean(id),
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────

export function useCreateBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (book: BookCreate) => api.post<Book>("/api/v1/books", book),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
    },
  });
}

export function useUpdateBook(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BookCreate>) => api.patch<Book>(`/api/v1/books/${id}`, data),
    onSuccess: (updated) => {
      qc.setQueryData(keys.book(id), updated);
      qc.invalidateQueries({ queryKey: ["books"] });
    },
  });
}

export function useDeleteBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/v1/books/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
    },
  });
}
