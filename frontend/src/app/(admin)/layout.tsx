import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/nav/admin-sidebar";
import { AdminTopbar } from "@/components/nav/admin-topbar";

export const metadata: Metadata = {
  title: { template: "%s — LibraFlow Admin", default: "LibraFlow Admin" },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar — sticky, full height */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <AdminTopbar />

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
