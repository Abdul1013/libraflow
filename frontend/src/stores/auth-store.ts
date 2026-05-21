import { create } from "zustand";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

// Pure in-memory store — no sessionStorage persistence.
// TanStack Query (useCurrentUser) is the authoritative source; this store
// exists only so nav components can read the user without issuing a query.
// SessionHydrator keeps it in sync with the /auth/me query result.
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
