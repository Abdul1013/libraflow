// ── Domain Types (mirrored from backend Pydantic schemas) ──────────────────

export type UserRole = "ADMIN" | "LIBRARIAN" | "STUDENT";
export type TransactionStatus = "BORROWED" | "RETURNED" | "OVERDUE";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  total_copies: number;
  available_copies: number;
  shelf_location: string;
  cover_url: string | null;
  description: string | null;
}

export interface BookSearchResult extends Book {
  score: number;       // 0–1 relevance; 1.0 in catalogue mode
  match_field: string; // "title" | "author" | "isbn"
  is_fuzzy: boolean;   // true when match is approximate (typo recovery)
}

export interface Transaction {
  id: string;
  user_id: string;
  book_id: string;
  borrowed_at: string;
  due_date: string;
  returned_at: string | null;
  status: TransactionStatus;
}

// ── Write payloads (match backend Create schemas) ──────────────────────────

export interface BookCreate {
  title: string;
  author: string;
  isbn: string;
  category: string;
  total_copies: number;
  shelf_location: string;
  cover_url?: string | null;
  description?: string | null;
}

export interface TransactionCreate {
  book_id: string;
  due_date: string; // ISO 8601
}

export interface UserCreate {
  email: string;
  password: string;
  full_name: string;
  role?: UserRole;
  department?: string | null;
}

// ── Auth ───────────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

export interface Recommendation extends Book {
  reason:       string;  // "Popular in Computer Science" | "Colleagues also borrowed"
  confidence:   number;  // 0–1
  borrow_count: number;
}

export interface TrendingBook extends Book {
  borrow_count:      number;
  trend_period_days: number;
}

export interface Notification {
  id:             string;
  user_id:        string;
  transaction_id: string;
  email_address:  string;
  book_title:     string;
  type:           string;
  email_sent:     boolean;
  sent_at:        string;
}

export interface AnalyticsSummary {
  total_books:       number;
  active_loans:      number;
  overdue_count:     number;
  member_count:      number;
  total_returned:    number;
  books_added_month: number;
}

export interface OverdueTrendPoint {
  date:  string; // "2026-05-11"
  count: number;
}

export interface BorrowingTrendPoint {
  date:  string;
  count: number;
}

export interface CategoryStat {
  category:   string;
  book_count: number;
  loan_count: number;
}

export interface UserUpdate {
  full_name?:   string;
  department?:  string | null;
  is_active?:   boolean;
}

// ── Pagination wrapper (matches FastAPI paginated responses) ───────────────

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}
