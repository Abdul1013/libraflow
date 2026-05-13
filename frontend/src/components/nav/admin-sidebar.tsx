"use client";

import {
  LayoutDashboard,
  BookOpen,
  ArrowLeftRight,
  Users,
  BarChart3,
  Settings,
  Library,
} from "lucide-react";
import { AdminNavItem } from "./admin-nav-item";
import { AdminUserRow } from "./admin-user-row";

const NAV_ITEMS = [
  { href: "/dashboard",    label: "Dashboard",   icon: LayoutDashboard },
  { href: "/catalogue",    label: "Catalogue",   icon: BookOpen },
  { href: "/circulation",  label: "Circulation", icon: ArrowLeftRight },
  { href: "/members",      label: "Members",     icon: Users },
  { href: "/reports",      label: "Reports",     icon: BarChart3 },
] as const;

interface AdminSidebarProps {
  overdueCount?: number;
}

export function AdminSidebar({ overdueCount = 0 }: AdminSidebarProps) {
  return (
    <aside className="w-64 bg-primary flex flex-col shrink-0 h-screen sticky top-0">
      {/* Wordmark */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="bg-white/15 rounded-lg p-1.5">
            <Library size={18} className="text-white" strokeWidth={2} />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">LibraFlow AI</p>
            <p className="text-white/50 text-xs mt-0.5">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <AdminNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            badge={item.href === "/circulation" ? overdueCount : undefined}
          />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3 space-y-0.5">
        <AdminNavItem href="/settings" label="Settings" icon={Settings} />

        <AdminUserRow />
      </div>
    </aside>
  );
}
