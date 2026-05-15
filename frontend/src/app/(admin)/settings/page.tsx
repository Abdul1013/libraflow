"use client";

import { useState } from "react";
import { User, Lock, Shield, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useUpdateUser, useChangePassword } from "@/lib/hooks/use-users";
import { ScreenWrapper } from "@/components/ui/screen-wrapper";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ── Inline feedback banner ────────────────────────────────────────────────

function Banner({ type, message }: { type: "success" | "error"; message: string }) {
  const isSuccess = type === "success";
  return (
    <div className={[
      "flex items-center gap-2 px-4 py-3 rounded-xl text-sm",
      isSuccess
        ? "bg-primary/10 border border-primary/20 text-primary"
        : "bg-accent/10 border border-accent/20 text-accent",
    ].join(" ")}>
      {isSuccess
        ? <CheckCircle2 size={15} className="shrink-0" />
        : <AlertCircle   size={15} className="shrink-0" />
      }
      {message}
    </div>
  );
}

// ── Account information section ───────────────────────────────────────────

function AccountSection() {
  const { user, setUser } = useAuthStore();
  const updateUser = useUpdateUser();

  const [name,       setName]       = useState(user?.full_name ?? "");
  const [department, setDepartment] = useState(user?.department ?? "");
  const [feedback,   setFeedback]   = useState<{ type: "success" | "error"; msg: string } | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    if (!user) return;
    try {
      const updated = await updateUser.mutateAsync({
        id:   user.id,
        data: { full_name: name, department: department || null },
      });
      setUser(updated);
      setFeedback({ type: "success", msg: "Profile updated successfully." });
    } catch (err) {
      setFeedback({ type: "error", msg: (err as Error).message });
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <User size={16} className="text-primary" />
          <div>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Update your display name and department</CardDescription>
          </div>
        </div>
      </CardHeader>

      <form onSubmit={handleSave} className="mt-5 space-y-4">
        {/* Read-only email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Email Address</label>
          <input
            type="email"
            value={user?.email ?? ""}
            disabled
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-muted cursor-not-allowed"
          />
          <p className="text-xs text-muted">Email cannot be changed. Contact system administrator.</p>
        </div>

        <Input
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          required
        />

        <Input
          label="Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="e.g. Library Services"
        />

        {/* Role badge — read-only */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Role</label>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
              <Shield size={11} />
              {user?.role.charAt(0) + (user?.role.slice(1).toLowerCase() ?? "")}
            </span>
            <span className="text-xs text-muted">Role is assigned by system administrators.</span>
          </div>
        </div>

        {feedback && <Banner type={feedback.type} message={feedback.msg} />}

        <div className="flex justify-end pt-1">
          <Button variant="primary" size="sm" type="submit" loading={updateUser.isPending}>
            Save Changes
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ── Change password section ───────────────────────────────────────────────

function PasswordSection() {
  const changePassword = useChangePassword();

  const [current,  setCurrent]  = useState("");
  const [next,     setNext]     = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    if (next.length < 8) {
      setFeedback({ type: "error", msg: "New password must be at least 8 characters." });
      return;
    }
    if (next !== confirm) {
      setFeedback({ type: "error", msg: "Passwords do not match." });
      return;
    }

    try {
      await changePassword.mutateAsync({ current_password: current, new_password: next });
      setFeedback({ type: "success", msg: "Password changed successfully." });
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      setFeedback({ type: "error", msg: (err as Error).message });
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock size={16} className="text-primary" />
          <div>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Use a strong password of at least 8 characters</CardDescription>
          </div>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <Input
          label="Current Password"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="Enter current password"
          required
        />
        <Input
          label="New Password"
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder="Min. 8 characters"
          required
        />
        <Input
          label="Confirm New Password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat new password"
          required
        />

        {feedback && <Banner type={feedback.type} message={feedback.msg} />}

        <div className="flex justify-end pt-1">
          <Button variant="primary" size="sm" type="submit" loading={changePassword.isPending}>
            Update Password
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ── System information section ────────────────────────────────────────────

function SystemInfoSection() {
  const info = [
    { label: "Application",     value: "LibraFlow AI" },
    { label: "Version",         value: "1.0.0" },
    { label: "Institution",     value: "Lead City University" },
    { label: "Loan Duration",   value: "14 days (default)" },
    { label: "Max Active Loans",value: "5 per student" },
    { label: "Fuzzy Search",    value: "Enabled (threshold 0.42)" },
    { label: "Recommendations", value: "Collaborative filtering + popularity" },
    { label: "Email Alerts",    value: process.env.NEXT_PUBLIC_API_URL?.includes("localhost") ? "Dev mode (logged only)" : "Resend API" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Info size={16} className="text-primary" />
          <div>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Read-only configuration reference</CardDescription>
          </div>
        </div>
      </CardHeader>

      <dl className="mt-5 divide-y divide-border">
        {info.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between py-3">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="text-sm font-medium text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <ScreenWrapper title="Settings" subtitle="Manage your account and view system configuration">
      <div className="max-w-2xl space-y-6">
        <AccountSection />
        <PasswordSection />
        <SystemInfoSection />
      </div>
    </ScreenWrapper>
  );
}
