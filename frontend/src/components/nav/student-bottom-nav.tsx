"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, BookMarked, Sparkles } from "lucide-react";

const TABS = [
  { href: "/search",          label: "Search",      icon: Search    },
  { href: "/borrowings",      label: "Borrowings",  icon: BookMarked },
  { href: "/recommendations", label: "For You",     icon: Sparkles  },
] as const;

export function StudentBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-20 bg-surface border-t border-border safe-area-inset-bottom">
      <div className="flex">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex-1 flex flex-col items-center justify-center py-2.5 gap-1",
                "min-h-[56px] transition-colors",
                active ? "text-primary" : "text-muted active:text-primary",
              ].join(" ")}
            >
              <Icon size={22} strokeWidth={active ? 2.2 : 1.6} />
              <span className={`text-[10px] font-medium ${active ? "text-primary" : "text-muted"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
