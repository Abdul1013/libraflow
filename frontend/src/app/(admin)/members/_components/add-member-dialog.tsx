"use client";

import { useState } from "react";
import { useCreateUser } from "@/lib/hooks/use-users";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ROLES = ["STUDENT", "LIBRARIAN", "ADMIN"] as const;
const DEPARTMENTS = [
  "Computer Science", "Engineering", "Mathematics", "Physics",
  "Literature", "History", "Economics", "Law", "Medicine",
  "Library Services", "ICT", "Other",
];

interface Props {
  open: boolean;
  onClose: () => void;
}

const EMPTY = {
  full_name: "", email: "", password: "",
  role: "STUDENT" as (typeof ROLES)[number],
  department: "Computer Science",
};

export function AddMemberDialog({ open, onClose }: Props) {
  const [form,  setForm]  = useState(EMPTY);
  const [error, setError] = useState("");
  const create = useCreateUser();

  function update(field: keyof typeof EMPTY) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await create.mutateAsync({
        full_name:  form.full_name,
        email:      form.email,
        password:   form.password,
        role:       form.role,
        department: form.department || null,
      });
      setForm(EMPTY);
      onClose();
    } catch (err) {
      setError((err as Error).message ?? "Failed to create member.");
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Add Member" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          value={form.full_name}
          onChange={update("full_name")}
          placeholder="Adaeze Okonkwo"
          required
        />
        <Input
          label="Email Address"
          type="email"
          value={form.email}
          onChange={update("email")}
          placeholder="student@lcu.edu.ng"
          required
        />
        <Input
          label="Temporary Password"
          type="password"
          value={form.password}
          onChange={update("password")}
          placeholder="Min. 8 characters"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Role</label>
            <select
              value={form.role}
              onChange={update("role")}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Department</label>
            <select
              value={form.department}
              onChange={update("department")}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <p className="text-sm text-error bg-error-subtle px-3 py-2 rounded-xl">{error}</p>
        )}

        <DialogFooter>
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" type="submit" loading={create.isPending}>
            Create Member
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
