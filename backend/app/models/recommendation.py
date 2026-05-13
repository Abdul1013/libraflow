from app.models.book import BookRead


class RecommendationRead(BookRead):
    """BookRead extended with recommendation metadata."""
    reason:       str    # e.g. "Popular in Computer Science"
    confidence:   float  # 0–1 normalised relevance
    borrow_count: int    # system-wide borrow count (popularity signal)
