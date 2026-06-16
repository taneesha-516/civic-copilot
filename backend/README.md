# Civic Copilot Backend

FastAPI starter backend for Civic Copilot with PostgreSQL, SQLAlchemy, Alembic, and Pydantic.

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Update `.env` with your PostgreSQL credentials.

## Database

```bash
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

## Run

```bash
uvicorn app.main:app --reload
```

Open:

- API: `http://localhost:8000`
- Docs: `http://localhost:8000/docs`

## Starter Endpoints

- `GET /api/v1/health`
- `GET /api/v1/complaints`
- `POST /api/v1/complaints`
- `GET /api/v1/complaints/{complaint_id}`
- `PATCH /api/v1/complaints/{complaint_id}`
- `GET /api/v1/departments`
- `POST /api/v1/departments`
- `GET /api/v1/statuses`
- `GET /api/v1/users`
- `POST /api/v1/users`
