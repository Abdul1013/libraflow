"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useCurrentUser } from "@/lib/hooks/use-auth";

/**
 * Keeps the Zustand auth store in sync with the TanStack Query /auth/me result
 * so nav components can read user data without issuing their own queries.
 * Guards (AdminGuard, StudentGuard) use useCurrentUser() directly and do not
 * depend on this store.
 */
export function SessionHydrator() {
  const { data: user } = useCurrentUser();
  const { setUser, clearUser } = useAuthStore();

  useEffect(() => {
    if (user) setUser(user);
    else clearUser();
  }, [user, setUser, clearUser]);

  return null;
}
