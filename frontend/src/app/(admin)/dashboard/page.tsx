import type { Metadata } from "next";
import { ScreenWrapper } from "@/components/ui/screen-wrapper";
import { Button } from "@/components/ui/button";
import { DashboardStats } from "./_components/dashboard-stats";
import { DashboardTransactions } from "./_components/dashboard-transactions";
import { TopBorrowedList } from "./_components/top-borrowed-list";
import { OverdueTrend } from "./_components/overdue-trend";

export const metadata: Metadata = { title: "Dashboard" };

export default function AdminDashboardPage() {
  return (
    <ScreenWrapper
      title="Dashboard"
      subtitle="Library overview — Lead City University"
      actions={<Button size="sm">Issue Book</Button>}
    >
      {/* Live KPI cards */}
      <DashboardStats />

      {/* Main content row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardTransactions />

        <div className="space-y-6">
          <TopBorrowedList />
          <OverdueTrend />
        </div>
      </div>
    </ScreenWrapper>
  );
}
