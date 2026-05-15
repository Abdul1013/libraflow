import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User, UserCreate, UserUpdate } from "@/types";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn:  () => api.get<User[]>("/api/v1/users"),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserCreate) => api.post<User>("/api/v1/users", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserUpdate }) =>
      api.patch<User>(`/api/v1/users/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: { current_password: string; new_password: string }) =>
      api.post<void>("/api/v1/auth/change-password", payload),
  });
}
