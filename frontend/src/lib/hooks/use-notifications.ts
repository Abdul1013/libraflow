import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Notification } from "@/types";

export function useNotifications(limit = 20) {
  return useQuery({
    queryKey: ["notifications", limit],
    queryFn:  () => api.get<Notification[]>(`/api/v1/notifications?limit=${limit}`),
    staleTime: 30 * 1000,
  });
}

export function useSendOverdueNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<{ sent: number; skipped: number }>("/api/v1/notifications/send-overdue", {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
