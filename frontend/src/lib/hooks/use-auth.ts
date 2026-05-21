import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, keys, setAuthToken } from "@/lib/api";
import type { User, LoginPayload, UserCreate } from "@/types";

interface LoginResponse {
  message: string;
  user: User;
  access_token: string;
  refresh_token: string;
}

// ── Current session ────────────────────────────────────────────────────────
// staleTime of 2 min lets guards re-verify the session without hammering the
// backend on every navigation, while staying well inside the 15-min token window.

export function useCurrentUser() {
  return useQuery({
    queryKey: keys.currentUser(),
    queryFn:  () => api.get<User>("/api/v1/auth/me"),
    retry:    false,
    staleTime: 2 * 60 * 1000,
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

// ── Login ──────────────────────────────────────────────────────────────────

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (creds: LoginPayload) =>
      api.post<LoginResponse>("/api/v1/auth/login", creds),
    onSuccess: async ({ user }) => {
      // Cancel any in-flight /auth/me fetch before writing the new user into
      // the cache. Without this, a pending fetch that started after logout
      // (from SessionHydrator) could resolve *after* setQueryData and wipe the
      // newly-logged-in user's data, causing a phantom redirect to login.
      await qc.cancelQueries({ queryKey: keys.currentUser() });
      qc.setQueryData(keys.currentUser(), user);
    },
  });
}

// ── Logout ─────────────────────────────────────────────────────────────────

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<void>("/api/v1/auth/logout", {}),
    onSuccess: async () => {
      setAuthToken(null);
      // Cancel any in-flight /auth/me and remove it from cache so the guards
      // immediately see "no user" on their next render. Using removeQueries
      // (not qc.clear) preserves other cached data (books, transactions) for
      // the next login without stale cross-user bleed.
      await qc.cancelQueries({ queryKey: keys.currentUser() });
      qc.removeQueries({ queryKey: keys.currentUser() });
    },
  });
}
