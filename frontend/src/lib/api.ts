const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Token store — sessionStorage so it survives page refresh but not new tabs ──

const _TOKEN_KEY = "lf_tok";

let _token: string | null = null;
if (typeof window !== "undefined") {
  _token = sessionStorage.getItem(_TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  _token = token;
  if (typeof window === "undefined") return;
  if (token) sessionStorage.setItem(_TOKEN_KEY, token);
  else sessionStorage.removeItem(_TOKEN_KEY);
}

export function getAuthToken(): string | null {
  return _token;
}

// ── Core fetch wrapper ─────────────────────────────────────────────────────

async function request<T>(path: string, init?: RequestInit): Promise<T> {
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
