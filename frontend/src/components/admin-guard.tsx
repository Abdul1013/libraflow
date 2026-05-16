"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }
    if (user.role === "STUDENT") {
      router.replace("/search");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || !user || user.role === "STUDENT") return null;

  return <>{children}</>;
}
