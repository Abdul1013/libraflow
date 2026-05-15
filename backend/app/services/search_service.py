"""
Smart Search Engine — Day 15 (H1: fuzzy-search discovery)

Two-stage hybrid pipeline:
  Stage 1 — DB ILIKE: fast index scan for exact substring matches.
  Stage 2 — Python fuzzy scoring: catches typos that ILIKE misses entirely.

The composite book score weights title > author > isbn and uses rapidfuzz
for token-aware Levenshtein similarity. Only books scoring ≥ THRESHOLD
are returned; results are sorted by score descending.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from rapidfuzz import fuzz

from app.models.book import Book

# ── Tunables ──────────────────────────────────────────────────────────────────

THRESHOLD       = 0.42   # minimum composite score to include a result
TITLE_WEIGHT    = 1.00   # title is the most important field
AUTHOR_WEIGHT   = 0.80
ISBN_WEIGHT     = 1.00   # exact ISBN match → perfect score
EXACT_BONUS     = 0.10   # added when the query is a substring of the field


# ── Core scoring ──────────────────────────────────────────────────────────────

def _field_score(query: str, text: str) -> float:
    """
    Return a 0–1 similarity score between query and a single book field.

    Strategy (descending priority):
      1. Exact substring → 1.0 + bonus
      2. Token-sort ratio  — handles reordered words ("Martin Robert")
      3. Partial ratio     — best-matching substring window ("Algoritms" in long title)
      4. Simple ratio      — whole-string Levenshtein
    """
    q = query.lower().strip()
    t = text.lower().strip()
    if not q or not t:
        return 0.0

    if q in t:
        return min(1.0, 0.90 + EXACT_BONUS)

    # rapidfuzz returns 0-100 floats
    token_sort = fuzz.token_sort_ratio(q, t) / 100.0
    partial    = fuzz.partial_ratio(q, t)    / 100.0
    simple     = fuzz.ratio(q, t)            / 100.0

    return max(token_sort, partial, simple)


def _isbn_score(query: str, isbn: str) -> float:
    """1.0 if the raw query (digits only) is contained in the normalised ISBN."""
    digits = "".join(c for c in query if c.isdigit())
    if digits and digits in isbn.replace("-", ""):
        return 1.0
    return 0.0


def score_book(query: str, book: Book) -> float:
    """Compute the composite relevance score for one book against the query."""
    title_s  = _field_score(query, book.title)  * TITLE_WEIGHT
    author_s = _field_score(query, book.author) * AUTHOR_WEIGHT
    isbn_s   = _isbn_score(query, book.isbn)    * ISBN_WEIGHT
    return max(title_s, author_s, isbn_s)


# ── Public interface ──────────────────────────────────────────────────────────

@dataclass
class ScoredBook:
    book:        Book
    score:       float
    match_field: str          # "title" | "author" | "isbn" — best matching field


def fuzzy_rank(
    books: list[Book],
    query: str,
    threshold: float = THRESHOLD,
) -> list[ScoredBook]:
    """
    Score every book against *query*, drop below-threshold results, and sort
    descending by score. Used by the search endpoint after DB pre-filtering.
    """
    results: list[ScoredBook] = []

    for book in books:
        title_s  = _field_score(query, book.title)  * TITLE_WEIGHT
        author_s = _field_score(query, book.author) * AUTHOR_WEIGHT
        isbn_s   = _isbn_score(query, book.isbn)    * ISBN_WEIGHT

        best_score = max(title_s, author_s, isbn_s)
        if best_score < threshold:
            continue

        # Determine which field drove the match (for UI highlighting)
        if isbn_s >= title_s and isbn_s >= author_s:
            field = "isbn"
        elif title_s >= author_s:
            field = "title"
        else:
            field = "author"

        results.append(ScoredBook(book=book, score=round(best_score, 4), match_field=field))

    results.sort(key=lambda r: r.score, reverse=True)
    return results


def is_fuzzy_match(score: float) -> bool:
    """True when the match was approximate (not an exact substring hit)."""
    return score < (0.90 + EXACT_BONUS)
