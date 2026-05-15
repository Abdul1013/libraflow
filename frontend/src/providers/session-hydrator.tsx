"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useCurrentUser } from "@/lib/hooks/use-auth";

/**
 * Runs on every page load and syncs the TanStack Query /auth/me result
 * with the Zustand store. Keeps auth state consistent after cookie expiry
 * or a new login in another tab.
 */
export function SessionHydrator() {
  const { data: user, isError } = useCurrentUser();
  const { setUser, clearUser }  = useAuthStore();

  useEffect(() => {
    if (user)    setUser(user);
    if (isError) clearUser();
  }, [user, isError, setUser, clearUser]);

  return null; // renders nothing
}
