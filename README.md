# LibraFlow AI

**Intelligent Library Resource Management System**  

---

## Project Overview

LibraFlow AI replaces manual library processes with an intelligent, database-driven platform. It automates book cataloguing and circulation, and uses a recommendation engine and fuzzy search to improve resource discovery.

**Stack:** Python 3.12 + FastAPI · SQLModel + PostgreSQL · Next.js 14 + Tailwind CSS  
**Deployment:** Railway (API + DB) · Vercel (Frontend)

---

## Prerequisites

| Tool | Minimum Version |
|------|----------------|
| Python | 3.12 |
| Node.js | 20.9.0+ |
| Docker + Docker Compose | Latest |
| Git | Any |



---

## Local Setup — Step by Step

### 1. Clone the repository

```bash
git clone <repo-url>
cd libraflow
```

### 2. Start the database and cache (Docker)

```bash
docker compose up -d
```

This starts PostgreSQL on port `5432` and Redis on port `6379`.

### 3. Set up the backend

```bash
cd backend

# Create a virtual environment
python3 -m venv .venv
source .venv/bin/activate       # macOS/Linux
# .venv\Scripts\activate        # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Open .env and set SECRET_KEY and DATABASE_URL

# Run database migrations
alembic upgrade head

# Start the API server
uvicorn app.main:app --reload --port 8000
```

API docs (DEBUG mode): [http://localhost:8000/docs](http://localhost:8000/docs)  
Health check: [http://localhost:8000/health](http://localhost:8000/health)

### 4. Set up the frontend

```bash
cd frontend

# Configure environment
cp .env.local.example .env.local

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend: [http://localhost:3000](http://localhost:3000)

---

## Architecture

```
libraflow/
├── backend/                 # FastAPI + SQLModel (Python 3.12)
│   ├── app/
│   │   ├── api/v1/          # REST endpoints (auth, users, books, transactions)
│   │   ├── core/            # Config (Pydantic BaseSettings), JWT, Middleware
│   │   ├── models/          # SQLModel table classes + Pydantic schemas
│   │   ├── services/        # Business logic (circulation, AI recommendations)
│   │   └── db/              # Async SQLAlchemy session
│   └── alembic/             # Database migrations
├── frontend/                # Next.js 14 + Tailwind CSS (TypeScript)
│   └── src/
│       ├── app/(admin)/     # Librarian dashboard routes
│       ├── app/(student)/   # Student search & profile routes
│       ├── components/ui/   # Shared components (Yacht Club palette)
│       ├── lib/api.ts       # Fetch wrapper for backend API
│       └── types/           # TypeScript domain types
├── scripts/                 # AI model training, data migration utilities
├── docker-compose.yml       # PostgreSQL 16 + Redis 7
└── README.md
```

---

## Design System — Yacht Club Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#F2F0EF` | Page body, off-white |
| Primary (Teal) | `#245F73` | Issue Book buttons, nav, headers |
| Secondary (Silver) | `#BBBDBC` | Borders, disabled states, placeholders |
| Accent (Wood Brown) | `#733E24` | Overdue warnings, history buttons |

All interactive elements use **12px border-radius** (`rounded-xl`) following Apple Design principles.

---


## Sprint Timeline

| Sprint | Days | Focus |
|--------|------|-------|
| 1 | 1–7 | Foundation: monorepo, schema, Yacht Club theme |
| 2 | 8–14 | Auth (JWT), User Management, Circulation |
| 3 | 15–21 | Intelligence: Fuzzy Search + KNN Recommendations |
| 4 | 22–28 | Validation (H1-H3), Load Testing, Deployment |
cd backend

