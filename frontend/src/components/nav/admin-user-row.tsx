"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useLogout } from "@/lib/hooks/use-auth";

export function AdminUserRow() {
  const { user, clearUser } = useAuthStore();
  const logout = useLogout();
  const router = useRouter();

  async function handleLogout() {
    await logout.mutateAsync();
    clearUser();
    router.push("/admin/login");
  }

  const displayName = user?.full_name ?? "Librarian";
  const initials    = displayName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
      <div className="size-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
        <span className="text-white text-xs font-semibold">{initials}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-white text-xs font-medium truncate">{displayName}</p>
        <p className="text-white/50 text-[10px] truncate capitalize">
          {user?.role.toLowerCase() ?? "staff"}
        </p>
      </div>
      <button
        onClick={handleLogout}
        disabled={logout.isPending}
        className="text-white/50 hover:text-white transition-colors p-1"
        title="Sign out"
      >
        <LogOut size={14} />
      </button>
    </div>
  );
}
