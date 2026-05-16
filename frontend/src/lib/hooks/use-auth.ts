import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, keys, setAuthToken } from "@/lib/api";
import type { User, LoginPayload, UserCreate } from "@/types";

interface LoginResponse {
  message: string;
  user: User;
  access_token: string;
  refresh_token: string;
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
      setAuthToken(null);
      qc.clear();
    },
  });
}
