import Link from "next/link";

export default function RootPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Wordmark */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            LibraFlow <span className="text-primary">AI</span>
          </h1>
          <p className="mt-2 text-sm text-muted">
            Intelligent Library Resource Management — Lead City University
          </p>
        </div>

        {/* Portal cards */}
        <div className="grid gap-4">
          <Link
            href="/admin/login"
            className="block bg-surface border border-border rounded-xl p-5 text-left hover:border-accent hover:shadow-sm transition-all duration-200 group"
          >
            <p className="font-semibold text-foreground group-hover:text-accent transition-colors">
              Staff Portal
            </p>
            <p className="text-xs text-muted mt-0.5">
              Admins &amp; Librarians — manage catalogue, issue books, view analytics
            </p>
          </Link>

          <Link
            href="/login"
            className="block bg-surface border border-border rounded-xl p-5 text-left hover:border-primary hover:shadow-sm transition-all duration-200 group"
          >
            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
              Student Portal
            </p>
            <p className="text-xs text-muted mt-0.5">
              Search books, view borrowing history, get recommendations
            </p>
          </Link>
        </div>

        <p className="text-xs text-muted/60">Lead City University · Library Services</p>
      </div>
    </main>
  );
}
