"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useLogin } from "@/lib/hooks/use-auth";
import { useAuthStore } from "@/stores/auth-store";
import { setAuthToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function AdminLoginForm() {
  const router   = useRouter();
  const params   = useSearchParams();
  const setUser  = useAuthStore((s) => s.setUser);
  const login    = useLogin();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const res  = await login.mutateAsync({ email, password });
      const role = res.user.role;

      if (role === "STUDENT") {
        setError("This portal is for staff only. Please use the Student Login instead.");
        return;
      }

      setAuthToken(res.access_token, role);
      setUser(res.user);

      // Honour redirect param (set by middleware); fall back to dashboard
      router.push(params.get("redirect") ?? "/dashboard");
    } catch (err) {
      setError((err as Error).message ?? "Login failed. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">

        {/* Wordmark */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center bg-accent-subtle rounded-2xl p-3 mb-4">
            <ShieldCheck size={28} className="text-accent" strokeWidth={1.8} />
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Staff Portal
          </h1>
          <p className="text-sm text-muted mt-1">Admin &amp; Librarian access — LibraFlow AI</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@lcu.edu.ng"
            required
          />

          <Input
            label="Password"
            type={showPass ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            trailingIcon={
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="text-muted hover:text-foreground transition-colors"
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          {error && (
            <p className="text-sm text-error bg-error-subtle px-3 py-2 rounded-xl">{error}</p>
          )}

          <Button
            type="submit"
            variant="accent"
            className="w-full"
            size="lg"
            loading={login.isPending}
          >
            Sign in to Staff Portal
          </Button>
        </form>

        <p className="text-center text-sm text-muted">
          Student?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Use Student Login
          </Link>
        </p>

        <p className="text-center text-xs text-muted/60">
          Lead City University Library System
        </p>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
