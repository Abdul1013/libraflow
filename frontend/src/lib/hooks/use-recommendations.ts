import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Recommendation } from "@/types";

export function useRecommendations(limit = 5) {
  return useQuery({
    queryKey: ["recommendations", limit],
    queryFn:  () => api.get<Recommendation[]>(`/api/v1/recommendations?limit=${limit}`),
    staleTime: 5 * 60 * 1000, // recommendations are stable; revalidate every 5 min
  });
}
