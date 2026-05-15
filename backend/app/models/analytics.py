from sqlmodel import SQLModel


class AnalyticsSummary(SQLModel):
    total_books:       int
    active_loans:      int
    overdue_count:     int
    member_count:      int
    total_returned:    int
    books_added_month: int


class OverdueTrendPoint(SQLModel):
    date:  str  # ISO date string: "2026-05-11"
    count: int


class BorrowingTrendPoint(SQLModel):
    date:  str  # ISO date string: "2026-05-11"
    count: int


class CategoryStat(SQLModel):
    category:    str
    book_count:  int
    loan_count:  int
