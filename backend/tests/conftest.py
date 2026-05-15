"""
Shared fixtures for LibraFlow AI test suite.
"""
import sys
from pathlib import Path

# Ensure `from app.*` imports work when pytest is run from the backend/ dir
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import uuid
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class FakeBook:
    """Lightweight stand-in for app.models.book.Book — no ORM mapping needed."""
    id:               uuid.UUID   = field(default_factory=uuid.uuid4)
    title:            str         = ""
    author:           str         = ""
    isbn:             str         = ""
    category:         str         = "Computer Science"
    total_copies:     int         = 3
    available_copies: int         = 3
    shelf_location:   str         = "XX-A01"
    cover_url:        Optional[str] = None
    description:      Optional[str] = None

    def model_dump(self) -> dict:
        """Mirror SQLModel's model_dump so recommendation_service can serialise us."""
        import dataclasses
        return dataclasses.asdict(self)
