"use client";

import { useState, useMemo } from "react";
import { UserPlus, AlertCircle, Users, ShieldCheck, BookOpen, Search } from "lucide-react";
import { useUsers, useUpdateUser } from "@/lib/hooks/use-users";
import { useAllTransactions } from "@/lib/hooks/use-transactions";
import { ScreenWrapper } from "@/components/ui/screen-wrapper";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TableRowSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { AddMemberDialog } from "./_components/add-member-dialog";
import type { User } from "@/types";

type RoleFilter = "All" | "STUDENT" | "LIBRARIAN" | "ADMIN";

const ROLE_FILTERS: RoleFilter[] = ["All", "STUDENT", "LIBRARIAN", "ADMIN"];

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    ADMIN:     "bg-accent/10 text-accent border border-accent/20",
    LIBRARIAN: "bg-primary/10 text-primary border border-primary/20",
    STUDENT:   "bg-border/60 text-muted border border-border",
  };
  const labels: Record<string, string> = {
    ADMIN: "Admin", LIBRARIAN: "Librarian", STUDENT: "Student",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[role] ?? styles.STUDENT}`}>
      {labels[role] ?? role}
    </span>
  );
}

function StatusToggle({ user }: { user: User }) {
  const update = useUpdateUser();
  return (
    <button
      onClick={() => update.mutate({ id: user.id, data: { is_active: !user.is_active } })}
      disabled={update.isPending}
      className={[
        "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none",
        user.is_active ? "bg-primary" : "bg-border",
      ].join(" ")}
      title={user.is_active ? "Deactivate member" : "Activate member"}
    >
      <span
        className={[
          "pointer-events-none inline-block size-4 rounded-full bg-white shadow transition-transform duration-200",
          user.is_active ? "translate-x-4" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

export default function MembersPage() {
  const [addOpen,      setAddOpen]      = useState(false);
  const [roleFilter,   setRoleFilter]   = useState<RoleFilter>("All");
  const [searchQuery,  setSearchQuery]  = useState("");

  const { data: users, isLoading, isError, error } = useUsers();
  const { data: txs } = useAllTransactions({});

  // Borrow count per user, computed from transactions
  const borrowCountByUser = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tx of txs ?? []) {
      counts[tx.user_id] = (counts[tx.user_id] ?? 0) + 1;
    }
    return counts;
  }, [txs]);

  const filtered = useMemo(() => {
    let list = users ?? [];
    if (roleFilter !== "All") list = list.filter((u) => u.role === roleFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (u) =>
          u.full_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.department ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [users, roleFilter, searchQuery]);

  const stats = useMemo(() => ({
    total:      (users ?? []).length,
    students:   (users ?? []).filter((u) => u.role === "STUDENT").length,
    staff:      (users ?? []).filter((u) => u.role !== "STUDENT").length,
    active:     (users ?? []).filter((u) => u.is_active).length,
  }), [users]);

  return (
    <ScreenWrapper
      title="Members"
      subtitle="Manage library members and their access"
      actions={
        <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
          <UserPlus size={14} /> Add Member
        </Button>
      }
    >
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Members", value: stats.total,    icon: Users },
          { label: "Students",      value: stats.students, icon: BookOpen },
          { label: "Staff",         value: stats.staff,    icon: ShieldCheck },
          { label: "Active",        value: stats.active,   icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="flex items-center gap-3 py-3 px-4">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon size={15} className="text-primary" />
            </div>
            <div>
              <p className="text-xl font-semibold text-foreground tabular-nums">
                {isLoading ? "—" : value}
              </p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Search + role filter row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email or department…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-surface text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div className="flex gap-2">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={[
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                roleFilter === r
                  ? "bg-primary text-white"
                  : "bg-surface border border-border text-muted hover:text-foreground",
              ].join(" ")}
            >
              {r === "All" ? "All" : r.charAt(0) + r.slice(1).toLowerCase() + "s"}
            </button>
          ))}
        </div>
      </div>

      {isError && (
        <EmptyState icon={AlertCircle} title="Could not load members" description={(error as Error).message} />
      )}

      {!isError && (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-160">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="text-left text-xs text-muted font-medium px-6 py-3">Name</th>
                  <th className="text-left text-xs text-muted font-medium px-4 py-3">Role</th>
                  <th className="text-left text-xs text-muted font-medium px-4 py-3">Department</th>
                  <th className="text-left text-xs text-muted font-medium px-4 py-3">Borrows</th>
                  <th className="text-left text-xs text-muted font-medium px-4 py-3">Joined</th>
                  <th className="text-left text-xs text-muted font-medium px-4 py-3">Active</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(6)].map((_, i) => <TableRowSkeleton key={i} cols={6} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        icon={Users}
                        title="No members found"
                        description={searchQuery ? "Try a different search term." : "No members in this role."}
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => (
                    <tr key={user.id} className="border-b border-border last:border-0 hover:bg-background/60">
                      <td className="px-6 py-3.5">
                        <div>
                          <p className="font-medium text-foreground text-sm">{user.full_name}</p>
                          <p className="text-xs text-muted mt-0.5">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted">
                        {user.department ?? "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-semibold text-foreground tabular-nums">
                          {borrowCountByUser[user.id] ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted tabular-nums">
                        {new Date(user.created_at).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusToggle user={user} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <AddMemberDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </ScreenWrapper>
  );
}
