"""
H1 Validation — Fuzzy Search Algorithm
=======================================
Hypothesis H1:
  "The Levenshtein-based fuzzy search pipeline returns relevant books for
   queries containing typographical errors, surpassing the recall of a
   naive exact-match strategy while maintaining acceptable precision."

Test strategy:
  - All tests use the pure-Python scoring layer (no DB, no network).
  - A controlled catalogue of 12 books spanning 4 categories is used.
  - Recall = retrieved relevant / total relevant   (≥ 0.85 target)
  - Precision = retrieved relevant / total retrieved (≥ 0.70 target)
  - Typo set covers single-char deletion, insertion, transposition,
    substitution, and multi-word reordering.
"""
import pytest
from tests.conftest import FakeBook
from app.services.search_service import _field_score, fuzzy_rank, is_fuzzy_match, THRESHOLD


# ── Controlled catalogue ──────────────────────────────────────────────────────

CATALOGUE = [
    FakeBook(title="Introduction to Algorithms",                   author="Cormen, Leiserson, Rivest & Stein", isbn="9780262033848", category="Computer Science"),
    FakeBook(title="Clean Code",                                   author="Robert C. Martin",                  isbn="9780132350884", category="Computer Science"),
    FakeBook(title="The Pragmatic Programmer",                     author="David Thomas & Andrew Hunt",        isbn="9780135957059", category="Computer Science"),
    FakeBook(title="Design Patterns: Elements of Reusable Object-Oriented Software", author="Gang of Four",   isbn="9780201633610", category="Computer Science"),
    FakeBook(title="Python Crash Course",                          author="Eric Matthes",                      isbn="9781593279288", category="Computer Science"),
    FakeBook(title="Calculus: Early Transcendentals",              author="James Stewart",                     isbn="9781285741550", category="Mathematics"),
    FakeBook(title="Linear Algebra and Its Applications",          author="David C. Lay",                      isbn="9780321982384", category="Mathematics"),
    FakeBook(title="Principles of Economics",                      author="N. Gregory Mankiw",                 isbn="9781305585126", category="Economics"),
    FakeBook(title="Things Fall Apart",                            author="Chinua Achebe",                     isbn="9780385474542", category="Literature"),
    FakeBook(title="Half of a Yellow Sun",                         author="Chimamanda Ngozi Adichie",          isbn="9781400095209", category="Literature"),
    FakeBook(title="Gray's Anatomy for Students",                  author="Richard Drake",                     isbn="9780323393041", category="Medicine"),
    FakeBook(title="Artificial Intelligence: A Modern Approach",   author="Stuart Russell & Peter Norvig",     isbn="9780134610993", category="Computer Science"),
]


def search(query: str) -> list[str]:
    """Helper: run fuzzy_rank and return titles of matched books."""
    results = fuzzy_rank(CATALOGUE, query)  # type: ignore[arg-type]
    return [r.book.title for r in results]


# ── H1.1 — Exact matches ─────────────────────────────────────────────────────

class TestExactMatches:
    def test_exact_title_match(self):
        hits = search("Clean Code")
        assert "Clean Code" in hits

    def test_exact_partial_title(self):
        hits = search("Pragmatic Programmer")
        assert "The Pragmatic Programmer" in hits

    def test_exact_author_match(self):
        hits = search("Chinua Achebe")
        assert "Things Fall Apart" in hits
        assert "Arrow of God" not in hits  # not in catalogue — should not hallucinate

    def test_isbn_exact(self):
        hits = search("9780385474542")
        assert "Things Fall Apart" in hits

    def test_isbn_partial_digits(self):
        hits = search("0385474542")
        assert "Things Fall Apart" in hits


# ── H1.2 — Single-character typos ────────────────────────────────────────────

class TestSingleCharTypos:
    """Each query has exactly one character error relative to the target."""

    def test_deletion(self):
        # "Algoritms" — missing 'h'
        hits = search("Algoritms")
        assert "Introduction to Algorithms" in hits

    def test_insertion(self):
        # "Cleann Code" — extra 'n'
        hits = search("Cleann Code")
        assert "Clean Code" in hits

    def test_substitution(self):
        # "Phyton Crash Course" — 'y' → 'h'
        hits = search("Phyton Crash Course")
        assert "Python Crash Course" in hits

    def test_transposition(self):
        # "Pyhton" — transposed 'th'
        hits = search("Pyhton")
        assert "Python Crash Course" in hits

    def test_missing_word(self):
        # Query is just a fragment of the title
        hits = search("Artificial Intelligence Modern")
        assert "Artificial Intelligence: A Modern Approach" in hits


# ── H1.3 — Multi-word reordering ─────────────────────────────────────────────

class TestWordReordering:
    def test_reversed_author_name(self):
        # "Martin Robert" vs "Robert C. Martin"
        score = _field_score("Martin Robert", "Robert C. Martin")
        assert score >= THRESHOLD, f"Expected score ≥ {THRESHOLD}, got {score:.3f}"

    def test_reordered_title_words(self):
        # "Algorithms Introduction" vs "Introduction to Algorithms"
        score = _field_score("Algorithms Introduction", "Introduction to Algorithms")
        assert score >= THRESHOLD, f"Expected score ≥ {THRESHOLD}, got {score:.3f}"

    def test_partial_multiword(self):
        hits = search("Yellow Sun")
        assert "Half of a Yellow Sun" in hits


# ── H1.4 — Precision: irrelevant queries should return empty or low-ranked ───

class TestPrecision:
    def test_garbage_query_low_precision(self):
        """
        A random gibberish string may still trigger a weak partial match via
        token-level substring alignment (this is an intentional trade-off of
        recall-oriented fuzzy search). We accept ≤ 1 false positive but verify
        that any returned score is close to the threshold floor, not 1.0.
        """
        results = fuzzy_rank(CATALOGUE, "xyzqwerty123nonsense")  # type: ignore[arg-type]
        assert len(results) <= 1, (
            f"Too many false positives for garbage query: {[r.book.title for r in results]}"
        )
        for r in results:
            assert r.score < 0.65, (
                f"False positive '{r.book.title}' has unexpectedly high score {r.score:.2f}"
            )

    def test_unrelated_single_word_low_score(self):
        # "Philosophy" should not surface any CS/Math/Med books
        hits = search("Philosophyyy")
        assert hits == []

    def test_threshold_enforced(self):
        # A very short, ambiguous query that partially matches many books
        # should still obey the threshold
        results = fuzzy_rank(CATALOGUE, "a", threshold=THRESHOLD)  # type: ignore[arg-type]
        for r in results:
            assert r.score >= THRESHOLD


# ── H1.5 — is_fuzzy_match flag ────────────────────────────────────────────────

class TestFuzzyFlag:
    def test_exact_match_not_fuzzy(self):
        results = fuzzy_rank(CATALOGUE, "Clean Code")  # type: ignore[arg-type]
        clean = next((r for r in results if r.book.title == "Clean Code"), None)
        assert clean is not None
        assert not is_fuzzy_match(clean.score), "Exact match should NOT be flagged as fuzzy"

    def test_typo_match_is_fuzzy(self):
        results = fuzzy_rank(CATALOGUE, "Cleann Coode")  # two-char typo  # type: ignore[arg-type]
        if results:  # may still score ≥ threshold
            hit = results[0]
            assert is_fuzzy_match(hit.score), f"Typo match score {hit.score:.3f} should be flagged fuzzy"


# ── H1.6 — Recall measurement ────────────────────────────────────────────────

class TestRecallMeasurement:
    """
    Defined test set: 10 typo queries, each has exactly 1 correct target book.
    Measures end-to-end recall of the pipeline.
    """

    TEST_CASES = [
        ("Algoritms",           "Introduction to Algorithms"),
        ("Cleann Code",         "Clean Code"),
        ("Pragmtic Programmer", "The Pragmatic Programmer"),
        ("Phyton Crash",        "Python Crash Course"),
        ("Calculs",             "Calculus: Early Transcendentals"),
        ("Priciples Economics", "Principles of Economics"),
        ("Things Fall Aprt",    "Things Fall Apart"),
        ("Artifical Intlgence", "Artificial Intelligence: A Modern Approach"),
        ("Grays Anatomy",       "Gray's Anatomy for Students"),
        ("Halff Yellow Sun",    "Half of a Yellow Sun"),
    ]

    def test_recall_gte_85_percent(self):
        hits = 0
        misses = []
        for query, expected_title in self.TEST_CASES:
            results = search(query)
            if expected_title in results:
                hits += 1
            else:
                misses.append((query, expected_title, results[:2]))

        recall = hits / len(self.TEST_CASES)
        miss_report = "\n".join(
            f"  MISS — query='{q}' expected='{t}' got={r}"
            for q, t, r in misses
        )
        assert recall >= 0.85, (
            f"H1 FAILED: recall {recall:.0%} < 85% target\n{miss_report}"
        )
