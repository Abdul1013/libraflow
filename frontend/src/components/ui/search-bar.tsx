"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { Search, X, Loader2 } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  loading?: boolean;
  hint?: string;
  className?: string;
}

export function SearchBar({
  placeholder = "Search by title, author, or ISBN…",
  value: controlled,
  onChange,
  onSearch,
  loading = false,
  hint,
  className = "",
}: SearchBarProps) {
  const [internal, setInternal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const value = controlled !== undefined ? controlled : internal;

  function handleChange(v: string) {
    if (controlled === undefined) setInternal(v);
    onChange?.(v);
  }

  function handleClear() {
    handleChange("");
    inputRef.current?.focus();
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") onSearch?.(value);
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="relative group">
        {/* Leading icon */}
        <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading ? (
            <Loader2 size={18} className="text-primary animate-spin" />
          ) : (
            <Search
              size={18}
              className="text-secondary group-focus-within:text-primary transition-colors"
            />
          )}
        </span>

        <input
          ref={inputRef}
          type="search"
          autoComplete="off"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          className={[
            "w-full pl-11 pr-10 py-3 text-sm",
            "bg-surface border border-border rounded-xl",
            "text-foreground placeholder:text-secondary",
            "transition-all duration-150",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
            "hover:border-border-strong",
          ].join(" ")}
        />

        {/* Clear button */}
        {value && !loading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-muted hover:text-foreground hover:bg-border/40 transition-colors"
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Fuzzy hint */}
      {hint && <p className="mt-1.5 text-xs text-muted px-1">{hint}</p>}
    </div>
  );
}
