"use client";

import { forwardRef, InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leadingIcon, trailingIcon, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}

        <div className="relative">
          {leadingIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
              {leadingIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={[
              "w-full rounded-xl border bg-surface text-foreground text-sm",
              "placeholder:text-secondary",
              "transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
              error
                ? "border-error focus:ring-error"
                : "border-border hover:border-border-strong",
              leadingIcon  ? "pl-10" : "pl-3.5",
              trailingIcon ? "pr-10" : "pr-3.5",
              "py-2.5",
              className,
            ].join(" ")}
            {...props}
          />

          {trailingIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
              {trailingIcon}
            </span>
          )}
        </div>

        {error && <p className="text-xs text-error">{error}</p>}
        {!error && hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
