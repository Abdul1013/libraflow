import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TrendingBook } from "@/types";

export function useTrendingBooks(days = 30, limit = 5) {
  return useQuery({
    queryKey: ["books", "trending", { days, limit }],
    queryFn:  () => api.get<TrendingBook[]>(`/api/v1/books/trending?days=${days}&limit=${limit}`),
    staleTime: 10 * 60 * 1000, // trending data: revalidate every 10 min
  });
}
