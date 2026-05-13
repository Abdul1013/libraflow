import type { ReactNode } from "react";

export type BadgeVariant =
  | "neutral"
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "error";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantCls: Record<BadgeVariant, string> = {
  neutral: "bg-border/40     text-muted",
  primary: "bg-primary-subtle text-primary",
  accent:  "bg-accent-subtle  text-accent",
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  error:   "bg-error-subtle   text-error",
};

export function Badge({ variant = "neutral", className = "", children }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        variantCls[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

/* Convenience: maps transaction status → badge variant */
export function TransactionBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    BORROWED: "primary",
    RETURNED: "success",
    OVERDUE:  "accent",
  };
  return <Badge variant={map[status] ?? "neutral"}>{status}</Badge>;
}
