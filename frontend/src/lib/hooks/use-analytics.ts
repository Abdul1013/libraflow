import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AnalyticsSummary, OverdueTrendPoint } from "@/types";

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ["analytics", "summary"],
    queryFn:  () => api.get<AnalyticsSummary>("/api/v1/analytics/summary"),
    staleTime: 60 * 1000, // revalidate every minute
  });
}

export function useOverdueTrend(days = 14) {
  return useQuery({
    queryKey: ["analytics", "overdue-trend", days],
    queryFn:  () => api.get<OverdueTrendPoint[]>(`/api/v1/analytics/overdue-trend?days=${days}`),
    staleTime: 5 * 60 * 1000,
  });
}
