import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StudentHeader } from "@/components/nav/student-header";
import { StudentBottomNav } from "@/components/nav/student-bottom-nav";

export const metadata: Metadata = {
  title: { template: "%s — LibraFlow", default: "LibraFlow AI" },
};

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StudentHeader />
      {/* pb-16 gives clearance for the fixed bottom nav on mobile */}
      <main className="flex-1 pb-16 sm:pb-0">{children}</main>
      <StudentBottomNav />
    </div>
  );
}
