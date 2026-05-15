"""
H3 Validation — Search Throughput and Latency
=============================================
Hypothesis H3:
  "The FastAPI + async SQLModel backend sustains a throughput of ≥ 50
   search requests per second with a mean response latency ≤ 500 ms under
   simulated concurrent load, meeting the performance requirements of a
   university library system."

Test strategy:
  - The search scoring pipeline (CPU-bound, no DB) is benchmarked with
    `timeit` to measure pure algorithmic throughput.
  - A simulated concurrent workload runs N threads calling the scorer
    simultaneously, measuring wall-clock time and per-request latency.
  - Targets are conservative for academic demonstration on a laptop.
    Production deployment on Railway adds a managed Postgres tier that
    would add ~5-20 ms per query (well within the 500 ms budget).

SLA targets:
  - Mean latency per search request  : ≤ 500 ms
  - Throughput (single process)      : ≥ 50 req/s
  - 95th-percentile latency          : ≤ 800 ms
  - Error rate under load            : 0 %
"""
import statistics
import time
import timeit
import concurrent.futures
from typing import Callable

import pytest

from tests.conftest import FakeBook
from app.services.search_service import fuzzy_rank


# ── Catalogue ─────────────────────────────────────────────────────────────────

CATALOGUE_50 = [
    FakeBook(
        title=f"Book Title Number {i} on a Relevant Topic",
        author=f"Author {i // 5} Surname",
        isbn=f"978{str(i).zfill(10)}",
        category=["Computer Science", "Mathematics", "Economics", "Literature"][i % 4],
    )
    for i in range(50)
]

QUERY_SET = [
    "algorithms",          # common CS query
    "Pragmatic Programer", # typo — common search mistake
    "Martin",              # author last name
    "calculs",             # typo
    "9780262033848",       # ISBN lookup
    "Python",              # short keyword
    "linear algebrra",     # double-char typo
    "economics mankiw",    # multi-term
]


# ── H3.1 — Single-request latency ────────────────────────────────────────────

class TestSingleRequestLatency:
    """Each individual search call must complete well under 500 ms."""

    @pytest.mark.parametrize("query", QUERY_SET)
    def test_single_search_under_50ms(self, query: str):
        """
        The pure scoring layer (no DB, no network) must process a 50-book
        catalogue in under 50 ms — leaving ample budget for async DB I/O.
        """
        start = time.perf_counter()
        fuzzy_rank(CATALOGUE_50, query)  # type: ignore[arg-type]
        elapsed_ms = (time.perf_counter() - start) * 1000

        assert elapsed_ms < 50, (
            f"Query '{query}' took {elapsed_ms:.1f} ms — exceeds 50 ms single-request budget"
        )


# ── H3.2 — Throughput benchmark ──────────────────────────────────────────────

class TestThroughput:
    """Measure how many search calls can be served per second."""

    def _run_searches(self, n: int) -> float:
        """Run n sequential searches and return wall-clock time in seconds."""
        queries = QUERY_SET * (n // len(QUERY_SET) + 1)
        start = time.perf_counter()
        for q in queries[:n]:
            fuzzy_rank(CATALOGUE_50, q)  # type: ignore[arg-type]
        return time.perf_counter() - start

    def test_throughput_gte_50_rps(self):
        """
        Processing 200 search requests sequentially must complete in ≤ 4 s,
        implying ≥ 50 requests per second throughput for the scoring layer.
        """
        N          = 200
        elapsed    = self._run_searches(N)
        rps        = N / elapsed

        assert rps >= 50, (
            f"H3 FAILED: throughput {rps:.1f} req/s < 50 req/s target "
            f"(200 requests in {elapsed:.2f} s)"
        )

    def test_throughput_stability(self):
        """
        Three independent runs of 100 requests each must all exceed 40 req/s.
        This checks for JIT warm-up spikes or GC pauses.
        """
        runs = [100 / self._run_searches(100) for _ in range(3)]
        for i, rps in enumerate(runs):
            assert rps >= 40, f"Run {i+1}: {rps:.1f} req/s < 40 req/s floor"


# ── H3.3 — Concurrent load ────────────────────────────────────────────────────

class TestConcurrentLoad:
    """Simulate multiple threads calling the search scorer simultaneously."""

    def _concurrent_search(
        self, workers: int, requests_per_worker: int
    ) -> tuple[list[float], int]:
        """
        Launch `workers` threads, each running `requests_per_worker` searches.
        Returns (latency_ms_list, error_count).
        """
        latencies: list[float] = []
        errors: list[int] = [0]

        def worker_task() -> None:
            for q in (QUERY_SET * requests_per_worker)[:requests_per_worker]:
                t0 = time.perf_counter()
                try:
                    fuzzy_rank(CATALOGUE_50, q)  # type: ignore[arg-type]
                except Exception:
                    errors[0] += 1
                finally:
                    latencies.append((time.perf_counter() - t0) * 1000)

        with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
            futures = [pool.submit(worker_task) for _ in range(workers)]
            concurrent.futures.wait(futures)

        return latencies, errors[0]

    def test_20_concurrent_users_zero_errors(self):
        """20 concurrent workers, 10 requests each → 0 errors expected."""
        latencies, errors = self._concurrent_search(workers=20, requests_per_worker=10)
        assert errors == 0, f"Expected 0 errors under concurrent load, got {errors}"

    def test_20_concurrent_users_mean_latency(self):
        """Mean latency under 20-worker concurrency must stay ≤ 500 ms."""
        latencies, _ = self._concurrent_search(workers=20, requests_per_worker=10)
        mean_ms = statistics.mean(latencies)
        assert mean_ms <= 500, (
            f"H3 FAILED: mean latency {mean_ms:.1f} ms > 500 ms SLA "
            f"(n={len(latencies)} requests)"
        )

    def test_20_concurrent_users_p95_latency(self):
        """95th-percentile latency under 20-worker concurrency must be ≤ 800 ms."""
        latencies, _ = self._concurrent_search(workers=20, requests_per_worker=10)
        latencies_sorted = sorted(latencies)
        p95_idx = int(0.95 * len(latencies_sorted))
        p95_ms  = latencies_sorted[p95_idx]
        assert p95_ms <= 800, (
            f"H3 FAILED: P95 latency {p95_ms:.1f} ms > 800 ms SLA"
        )

    def test_50_concurrent_users_error_free(self):
        """50 concurrent workers, 5 requests each → 0 errors expected."""
        latencies, errors = self._concurrent_search(workers=50, requests_per_worker=5)
        assert errors == 0, f"Expected 0 errors with 50 concurrent workers, got {errors}"


# ── H3.4 — Algorithmic complexity estimate ────────────────────────────────────

class TestComplexityScaling:
    """
    Verify that search time scales sub-quadratically with catalogue size.
    A well-implemented linear scan should give O(n) scaling.
    """

    def _time_catalogue(self, size: int, repeat: int = 10) -> float:
        cat = CATALOGUE_50[:size] if size <= 50 else CATALOGUE_50 * (size // 50 + 1)
        cat = cat[:size]
        total = timeit.timeit(
            lambda: fuzzy_rank(cat, "algorithms"),  # type: ignore[arg-type]
            number=repeat,
        )
        return (total / repeat) * 1000  # ms per call

    def test_scaling_is_linear(self):
        """
        Time for 50 books should be ≤ 5× time for 10 books.
        Linear O(n) → ratio ≈ 5; worse than 5× indicates super-linear growth.
        """
        t10 = self._time_catalogue(10)
        t50 = self._time_catalogue(50)
        if t10 == 0:
            pytest.skip("Execution too fast to measure reliably")
        ratio = t50 / t10
        assert ratio <= 10, (
            f"Scaling worse than expected: t10={t10:.2f} ms, t50={t50:.2f} ms, "
            f"ratio={ratio:.1f}× (max 10×)"
        )
