import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, keys } from "@/lib/api";
import type { User, LoginPayload, UserCreate } from "@/types";

interface LoginResponse {
  message: string;
  user: User;
}

// ── Current session (reads JWT cookie server-side; returns null when logged out) ──

export function useCurrentUser() {
  return useQuery({
    queryKey: keys.currentUser(),
    queryFn:  () => api.get<User>("/api/v1/auth/me"),
    retry:    false,
    staleTime: 5 * 60 * 1000, // 5 min — re-fetch only if stale
  });
}

// ── Register ───────────────────────────────────────────────────────────────

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserCreate) =>
      api.post<User>("/api/v1/auth/register", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.currentUser() });
    },
  });
}

// ── Login — returns { user } on success; cookie set by the API ─────────────

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (creds: LoginPayload) =>
      api.post<LoginResponse>("/api/v1/auth/login", creds),
    onSuccess: ({ user }) => {
      // Seed the current-user cache so components reading useCurrentUser() don't refetch
      qc.setQueryData(keys.currentUser(), user);
    },
  });
}

// ── Logout ─────────────────────────────────────────────────────────────────

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<void>("/api/v1/auth/logout", {}),
    onSuccess: () => {
      qc.clear(); // wipe all cached data — user is logged out
    },
  });
}
