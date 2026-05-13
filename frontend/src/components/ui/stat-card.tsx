import type { LucideIcon } from "lucide-react";

type Trend = "up" | "down" | "neutral";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: Trend;
  trendLabel?: string;
  /** "accent" colours the icon in Wood Brown — use for overdue/critical stats */
  variant?: "default" | "accent";
}

const trendCls: Record<Trend, string> = {
  up:      "text-success",
  down:    "text-error",
  neutral: "text-muted",
};

const trendArrow: Record<Trend, string> = {
  up: "↑", down: "↓", neutral: "→",
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  variant = "default",
}: StatCardProps) {
  return (
    <div className="bg-surface rounded-xl border border-border shadow-card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted">{title}</p>
        <span
          className={[
            "p-2 rounded-lg",
            variant === "accent"
              ? "bg-accent-subtle text-accent"
              : "bg-primary-subtle text-primary",
          ].join(" ")}
        >
          <Icon size={18} strokeWidth={1.8} />
        </span>
      </div>

      <div>
        <p className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted mt-0.5">{subtitle}</p>
        )}
      </div>

      {trend && trendLabel && (
        <p className={`text-xs font-medium ${trendCls[trend]}`}>
          {trendArrow[trend]} {trendLabel}
        </p>
      )}
    </div>
  );
}
