const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Token store — sessionStorage so it survives page refresh but not new tabs ──

const _TOKEN_KEY = "lf_tok";
const _COOKIE_MAX_AGE = 7 * 24 * 3600; // 7 days, matches refresh token lifetime

let _token: string | null = null;
if (typeof window !== "undefined") {
  _token = sessionStorage.getItem(_TOKEN_KEY);
}

function _setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function _clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

// role is passed so middleware can enforce role-based route guards without
// decoding the JWT (which isn't possible in Edge Runtime without extra deps).
export function setAuthToken(token: string | null, role?: string): void {
  _token = token;
  if (typeof window === "undefined") return;
  if (token) {
    sessionStorage.setItem(_TOKEN_KEY, token);
    _setCookie("lf_authed", "1", _COOKIE_MAX_AGE);
    if (role) _setCookie("lf_role", role, _COOKIE_MAX_AGE);
  } else {
    sessionStorage.removeItem(_TOKEN_KEY);
    _clearCookie("lf_authed");
    _clearCookie("lf_role");
  }
}

export function getAuthToken(): string | null {
  return _token;
}

// ── Token refresh ─────────────────────────────────────────────────────────

// Coalesces concurrent 401s into a single refresh call.
let _refreshPromise: Promise<boolean> | null = null;

async function _tryRefresh(): Promise<boolean> {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.access_token) setAuthToken(data.access_token);
      return true;
    } catch {
      return false;
    } finally {
      _refreshPromise = null;
    }
  })();
  return _refreshPromise;
}

// Auth endpoints that should never trigger a refresh:
// - /auth/login    : 401 = wrong credentials, not an expired token
// - /auth/register : same
// - /auth/refresh  : the refresh call itself
// - /auth/logout   : clearing the session intentionally
// All other 401s (books, transactions, etc.) are treated as expired-token and refreshed.
const _NO_REFRESH_PATHS = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];

// ── Core fetch wrapper ─────────────────────────────────────────────────────

async function request<T>(path: string, init?: RequestInit, isRetry = false): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (_token) headers["Authorization"] = `Bearer ${_token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  // On 401 from a data endpoint (not an auth endpoint), attempt one silent
  // token refresh then retry. Guards (AdminGuard, StudentGuard) observe the
  // useCurrentUser query and handle the redirect to the correct login portal
  // when a refresh ultimately fails — keeping api.ts free of routing logic.
  if (
    res.status === 401 &&
    !isRetry &&
    !_NO_REFRESH_PATHS.some((p) => path.includes(p))
  ) {
    const refreshed = await _tryRefresh();
    if (refreshed) return request<T>(path, init, true);
    // Refresh failed — clear local token state. The guard components will
    // detect the auth error via useCurrentUser() and redirect to the right portal.
    setAuthToken(null);
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    // Throw the FastAPI `detail` string — TanStack Query catches it as error.message
    throw new Error(
      typeof body.detail === "string"
        ? body.detail
        : JSON.stringify(body.detail),
    );
  }

  return res.json() as Promise<T>;
}

export const api = {
  get:    <T>(path: string)               => request<T>(path),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: "POST",   body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH",  body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) => request<T>(path, { method: "PUT",    body: JSON.stringify(body) }),
  delete: <T>(path: string)               => request<T>(path, { method: "DELETE" }),
};

// ── Query key factory — prevents key collisions across hooks ───────────────

export const keys = {
  books:        (filters?: Record<string, string>) => ["books", filters ?? {}] as const,
  book:         (id: string)                       => ["books", id] as const,
  transactions: (filters?: Record<string, string>) => ["transactions", filters ?? {}] as const,
  transaction:  (id: string)                       => ["transactions", id] as const,
  currentUser:  ()                                 => ["auth", "me"] as const,
  recommendations: (userId: string)               => ["recommendations", userId] as const,
};
