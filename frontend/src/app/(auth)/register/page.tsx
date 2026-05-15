"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Library } from "lucide-react";
import { useRegister } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UserRole } from "@/types";

export default function RegisterPage() {
  const router   = useRouter();
  const register = useRegister();

  const [form, setForm] = useState({
    full_name:  "",
    email:      "",
    password:   "",
    role:       "STUDENT" as UserRole,
    department: "",
  });
  const [error, setError] = useState("");

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await register.mutateAsync({
        ...form,
        department: form.department || null,
      });
      router.push("/login?registered=1");
    } catch (err) {
      setError((err as Error).message ?? "Registration failed.");
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        {/* Wordmark */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center bg-primary-subtle rounded-2xl p-3 mb-4">
            <Library size={28} className="text-primary" strokeWidth={1.8} />
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Create account
          </h1>
          <p className="text-sm text-muted mt-1">Join LibraFlow AI</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full name"
            type="text"
            autoComplete="name"
            value={form.full_name}
            onChange={update("full_name")}
            placeholder="Igwe Chisimdi Evans"
            required
          />

          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={update("email")}
            placeholder="you@lcu.edu.ng"
            required
          />

          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={update("password")}
            placeholder="Min. 8 characters"
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Role</label>
            <select
              value={form.role}
              onChange={update("role")}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="STUDENT">Student</option>
              <option value="LIBRARIAN">Librarian</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <Input
            label="Department (optional)"
            type="text"
            value={form.department}
            onChange={update("department")}
            placeholder="Computer Science"
          />

          {error && (
            <p className="text-sm text-error bg-error-subtle px-3 py-2 rounded-xl">{error}</p>
          )}

          <Button type="submit" className="w-full" size="lg" loading={register.isPending}>
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
