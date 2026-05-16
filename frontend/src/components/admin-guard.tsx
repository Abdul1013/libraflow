"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }
    if (user.role === "STUDENT") {
      router.replace("/search");
    }
  }, [mounted, isAuthenticated, user, router]);

  // Don't render or redirect until client has mounted — prevents flash redirect
  // caused by Zustand store reading as empty before sessionStorage hydrates
  if (!mounted || !isAuthenticated || !user || user.role === "STUDENT") return null;

  return <>{children}</>;
}
