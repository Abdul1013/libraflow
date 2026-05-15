"""
LibraFlow AI — Locust Load Test
================================
Simulates realistic concurrent user workflows against a running backend.

Usage (from backend/ directory):
  locust -f locustfile.py --host http://localhost:8000 --users 50 --spawn-rate 5

Web UI: http://localhost:8089

User scenarios:
  - StudentUser  (70 % weight): search → browse → borrow → check history
  - LibrarianUser (20 % weight): view all transactions → mark overdue → analytics
  - GuestUser    (10 % weight): health check + search only (unauthenticated paths)
"""
import json
import random

from locust import HttpUser, TaskSet, between, task


# ── Credentials (must match seeded users) ─────────────────────────────────────

STUDENTS = [
    {"email": "chisimdi@lcu.edu.ng",      "password": "Student@1234"},
    {"email": "emeka.obi@lcu.edu.ng",     "password": "Student@1234"},
    {"email": "fatima.aliyu@lcu.edu.ng",  "password": "Student@1234"},
    {"email": "tunde.adeyemi@lcu.edu.ng", "password": "Student@1234"},
    {"email": "ngozi.eze@lcu.edu.ng",     "password": "Student@1234"},
    {"email": "ibrahim.musa@lcu.edu.ng",  "password": "Student@1234"},
    {"email": "amaka.nwosu@lcu.edu.ng",   "password": "Student@1234"},
    {"email": "david.okafor@lcu.edu.ng",  "password": "Student@1234"},
]

LIBRARIAN = {"email": "librarian@lcu.edu.ng", "password": "Librarian@1234"}

# Representative search queries including typos (H1 stress)
SEARCH_QUERIES = [
    "algorithms",
    "Pragmatic Programmer",
    "Cleann Code",          # typo
    "Phyton",               # typo
    "Calculs Early",        # typo
    "chinua achebe",
    "Economics",
    "Grays Anatomy",        # missing apostrophe
    "9780262033848",        # ISBN lookup
    "linear algebrra",      # double-r typo
]

CATEGORIES = [
    "Computer Science", "Mathematics", "Economics",
    "Literature", "Medicine", "Law", "Physics",
]


# ── Student workflow ──────────────────────────────────────────────────────────

class StudentTasks(TaskSet):
    book_ids: list[str] = []

    def on_start(self):
        """Authenticate before tasks begin."""
        creds = random.choice(STUDENTS)
        with self.client.post(
            "/api/v1/auth/login",
            json=creds,
            catch_response=True,
            name="POST /auth/login",
        ) as r:
            if r.status_code != 200:
                r.failure(f"Login failed: {r.status_code}")

    def on_stop(self):
        self.client.post("/api/v1/auth/logout", name="POST /auth/logout")

    @task(5)
    def search_books(self):
        q = random.choice(SEARCH_QUERIES)
        self.client.get(
            f"/api/v1/books?query={q}",
            name="GET /books?query=<query>",
        )

    @task(3)
    def browse_catalogue(self):
        cat = random.choice(CATEGORIES)
        with self.client.get(
            f"/api/v1/books?category={cat}",
            name="GET /books?category=<cat>",
            catch_response=True,
        ) as r:
            if r.status_code == 200:
                data = r.json()
                # Cache book IDs for borrow tasks
                StudentTasks.book_ids = [b["id"] for b in data if b.get("available_copies", 0) > 0]

    @task(2)
    def get_recommendations(self):
        self.client.get(
            "/api/v1/recommendations?limit=5",
            name="GET /recommendations",
        )

    @task(2)
    def view_my_borrowings(self):
        self.client.get(
            "/api/v1/transactions/me",
            name="GET /transactions/me",
        )

    @task(1)
    def borrow_and_return(self):
        """Attempt to borrow a random available book, then immediately return it."""
        if not StudentTasks.book_ids:
            return

        book_id = random.choice(StudentTasks.book_ids)

        # Borrow
        with self.client.post(
            "/api/v1/transactions",
            json={
                "book_id":  book_id,
                "due_date": "2026-06-30T00:00:00",  # naive UTC ISO
            },
            name="POST /transactions (borrow)",
            catch_response=True,
        ) as r:
            if r.status_code == 201:
                tx_id = r.json().get("id")
                if tx_id:
                    # Return immediately — avoids polluting the DB state
                    self.client.patch(
                        f"/api/v1/transactions/{tx_id}/return",
                        name="PATCH /transactions/:id/return",
                    )
            elif r.status_code in (409,):
                r.success()  # 409 = already borrowed / out of stock — expected


# ── Librarian workflow ────────────────────────────────────────────────────────

class LibrarianTasks(TaskSet):
    def on_start(self):
        with self.client.post(
            "/api/v1/auth/login",
            json=LIBRARIAN,
            catch_response=True,
            name="POST /auth/login",
        ) as r:
            if r.status_code != 200:
                r.failure(f"Librarian login failed: {r.status_code}")

    def on_stop(self):
        self.client.post("/api/v1/auth/logout", name="POST /auth/logout")

    @task(4)
    def view_all_transactions(self):
        self.client.get("/api/v1/transactions", name="GET /transactions (all)")

    @task(3)
    def view_analytics_summary(self):
        self.client.get("/api/v1/analytics/summary", name="GET /analytics/summary")

    @task(2)
    def view_overdue_trend(self):
        self.client.get(
            "/api/v1/analytics/overdue-trend?days=14",
            name="GET /analytics/overdue-trend",
        )

    @task(2)
    def view_borrowing_trend(self):
        self.client.get(
            "/api/v1/analytics/borrowing-trend?days=30",
            name="GET /analytics/borrowing-trend",
        )

    @task(1)
    def view_category_stats(self):
        self.client.get(
            "/api/v1/analytics/category-stats",
            name="GET /analytics/category-stats",
        )

    @task(1)
    def view_users(self):
        self.client.get("/api/v1/users", name="GET /users")

    @task(1)
    def view_trending(self):
        self.client.get(
            "/api/v1/books/trending?days=30&limit=10",
            name="GET /books/trending",
        )


# ── Guest workflow ────────────────────────────────────────────────────────────

class GuestTasks(TaskSet):
    @task(3)
    def health_check(self):
        self.client.get("/health", name="GET /health")

    @task(1)
    def search_unauthenticated(self):
        """Search without auth cookie — should return 200 with results."""
        q = random.choice(SEARCH_QUERIES[:5])
        self.client.get(
            f"/api/v1/books?query={q}",
            name="GET /books (unauthenticated)",
        )


# ── User classes with weights ─────────────────────────────────────────────────

class StudentUser(HttpUser):
    tasks       = [StudentTasks]
    weight      = 70
    wait_time   = between(1, 3)


class LibrarianUser(HttpUser):
    tasks       = [LibrarianTasks]
    weight      = 20
    wait_time   = between(2, 5)


class GuestUser(HttpUser):
    tasks       = [GuestTasks]
    weight      = 10
    wait_time   = between(0.5, 2)
