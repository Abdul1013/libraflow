"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

export type ButtonVariant = "primary" | "accent" | "ghost" | "outline" | "destructive";
export type ButtonSize    = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantCls: Record<ButtonVariant, string> = {
  primary:     "bg-primary text-white hover:bg-primary-hover active:bg-primary-active",
  accent:      "bg-accent  text-white hover:bg-accent-hover",
  ghost:       "bg-transparent text-primary hover:bg-primary-subtle",
  outline:     "border border-border text-foreground hover:bg-border/30",
  destructive: "bg-error text-white hover:bg-error/90",
};

const sizeCls: Record<ButtonSize, string> = {
  sm:   "px-3 py-1.5 text-xs",
  md:   "px-4 py-2   text-sm",
  lg:   "px-6 py-3   text-base",
  icon: "p-2  text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", loading, className = "", children, disabled, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center gap-2 font-medium rounded-xl",
        "transition-colors duration-150 cursor-pointer",
        "disabled:opacity-50 disabled:pointer-events-none",
        variantCls[variant],
        sizeCls[size],
        className,
      ].join(" ")}
      {...props}
    >
      {loading && (
        <span className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      )}
      {children}
    </button>
  ),
);

Button.displayName = "Button";
