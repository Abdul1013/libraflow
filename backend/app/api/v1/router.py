from fastapi import APIRouter
from app.api.v1.endpoints import analytics, auth, users, books, notifications, transactions, recommendations

api_router = APIRouter()

api_router.include_router(auth.router,            prefix="/auth",            tags=["Auth"])
api_router.include_router(users.router,           prefix="/users",           tags=["Users"])
api_router.include_router(books.router,           prefix="/books",           tags=["Books"])
api_router.include_router(transactions.router,    prefix="/transactions",    tags=["Transactions"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])
api_router.include_router(analytics.router,       prefix="/analytics",       tags=["Analytics"])
api_router.include_router(notifications.router,   prefix="/notifications",   tags=["Notifications"])
