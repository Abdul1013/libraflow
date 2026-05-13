import type { ReactNode } from "react";

interface ScreenWrapperProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ScreenWrapper({
  title,
  subtitle,
  actions,
  children,
  className = "",
}: ScreenWrapperProps) {
  return (
    <div className={`min-h-screen bg-background ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {(title || actions) && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6 sm:mb-8">
            <div>
              {title && (
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-muted">{subtitle}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">{actions}</div>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
