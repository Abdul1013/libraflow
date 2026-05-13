from sqlmodel import SQLModel


class AnalyticsSummary(SQLModel):
    total_books:   int
    active_loans:  int
    overdue_count: int
    member_count:  int


class OverdueTrendPoint(SQLModel):
    date:  str  # ISO date string: "2026-05-11"
    count: int
