"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useLogout } from "@/lib/hooks/use-auth";
import { Avatar } from "@/components/ui/avatar";

export function UserMenu() {
  const { user, clearUser } = useAuthStore();
  const logout = useLogout();
  const router = useRouter();

  async function handleLogout() {
    await logout.mutateAsync();
    clearUser();
    router.push("/login");
  }

  if (!user) return null;

  return (
    <div className="flex items-center gap-2 group relative">
      <Avatar name={user.full_name} size="sm" />
      <div className="hidden sm:block min-w-0">
        <p className="text-sm font-medium text-foreground truncate max-w-[120px]">
          {user.full_name}
        </p>
        <p className="text-xs text-muted capitalize">{user.role.toLowerCase()}</p>
      </div>
      <button
        onClick={handleLogout}
        disabled={logout.isPending}
        className="ml-1 p-1.5 rounded-lg text-muted hover:text-error hover:bg-error-subtle transition-colors"
        title="Sign out"
      >
        <LogOut size={15} />
      </button>
    </div>
  );
}
