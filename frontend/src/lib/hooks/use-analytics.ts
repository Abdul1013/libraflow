import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AnalyticsSummary, BorrowingTrendPoint, CategoryStat, OverdueTrendPoint } from "@/types";

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ["analytics", "summary"],
    queryFn:  () => api.get<AnalyticsSummary>("/api/v1/analytics/summary"),
    staleTime: 60 * 1000,
  });
}

export function useOverdueTrend(days = 14) {
  return useQuery({
    queryKey: ["analytics", "overdue-trend", days],
    queryFn:  () => api.get<OverdueTrendPoint[]>(`/api/v1/analytics/overdue-trend?days=${days}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBorrowingTrend(days = 30) {
  return useQuery({
    queryKey: ["analytics", "borrowing-trend", days],
    queryFn:  () => api.get<BorrowingTrendPoint[]>(`/api/v1/analytics/borrowing-trend?days=${days}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategoryStats() {
  return useQuery({
    queryKey: ["analytics", "category-stats"],
    queryFn:  () => api.get<CategoryStat[]>("/api/v1/analytics/category-stats"),
    staleTime: 5 * 60 * 1000,
  });
}
