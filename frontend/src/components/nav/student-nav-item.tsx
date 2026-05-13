"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

interface StudentNavItemProps {
  href: string;
  label: string;
  icon?: LucideIcon;
}

export function StudentNavItem({ href, label, icon: Icon }: StudentNavItemProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150",
        active
          ? "bg-primary-subtle text-primary"
          : "text-muted hover:text-foreground hover:bg-border/30",
      ].join(" ")}
    >
      {Icon && <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />}
      {label}
    </Link>
  );
}
