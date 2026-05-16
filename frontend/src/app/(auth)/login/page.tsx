"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Library, Eye, EyeOff } from "lucide-react";
import { useLogin } from "@/lib/hooks/use-auth";
import { useAuthStore } from "@/stores/auth-store";
import { setAuthToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function LoginForm() {
  const router       = useRouter();
  const params       = useSearchParams();
  const redirect     = params.get("redirect") ?? "/search";
  const setUser      = useAuthStore((s) => s.setUser);
  const login        = useLogin();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const res = await login.mutateAsync({ email, password });
      setAuthToken(res.access_token, res.user.role);  // set token + role cookie before navigating
      setUser(res.user);
      const role = res.user.role;
      const dest = role === "ADMIN" || role === "LIBRARIAN" ? "/dashboard" : "/search";
      router.push(dest);
    } catch (err) {
      setError((err as Error).message ?? "Login failed. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">

        {/* Wordmark */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center bg-primary-subtle rounded-2xl p-3 mb-4">
            <Library size={28} className="text-primary" strokeWidth={1.8} />
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted mt-1">Sign in to LibraFlow AI</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
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
            className="w-full"
            size="lg"
            loading={login.isPending}
          >
            Sign in
          </Button>
        </form>

        {params.get("registered") && (
          <p className="text-center text-sm text-success bg-success-subtle px-3 py-2 rounded-xl">
            Account created — please sign in.
          </p>
        )}

        <p className="text-center text-sm text-muted">
          No account?{" "}
          <Link href="/register" className="text-primary font-medium hover:underline">
            Register
          </Link>
        </p>

        <p className="text-center text-xs text-muted/60">
          Lead City University Library System
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
