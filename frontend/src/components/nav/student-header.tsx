"use client";

import Link from "next/link";
import { Search, BookMarked, Sparkles, Library } from "lucide-react";
import { StudentNavItem } from "./student-nav-item";
import { UserMenu } from "./user-menu";

const NAV_ITEMS = [
  { href: "/search",          label: "Search",          icon: Search },
  { href: "/borrowings",      label: "My Borrowings",   icon: BookMarked },
  { href: "/recommendations", label: "For You",         icon: Sparkles },
] as const;

export function StudentHeader() {
  return (
    <header className="bg-surface border-b border-border sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-6">

          {/* Wordmark */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Library size={18} className="text-primary" strokeWidth={2} />
            <span className="font-semibold text-sm text-foreground">
              LibraFlow <span className="text-primary">AI</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <StudentNavItem key={item.href} {...item} />
            ))}
          </nav>

          <UserMenu />

        </div>
      </div>
    </header>
  );
}
