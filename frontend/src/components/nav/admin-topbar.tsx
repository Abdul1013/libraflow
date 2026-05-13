"use client";

import { useState } from "react";
import { Menu, X, Library } from "lucide-react";
import { AdminSidebar } from "./admin-sidebar";

export function AdminTopbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden bg-primary px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Library size={18} className="text-white" />
          <span className="text-white font-semibold text-sm">LibraFlow AI</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="text-white/80 hover:text-white p-1"
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full flex">
            <AdminSidebar />
            <button
              onClick={() => setOpen(false)}
              className="ml-2 mt-4 text-white/80 hover:text-white"
              aria-label="Close navigation"
            >
              <X size={22} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
