This folder contains Alembic migration environment for the project.

Key files:
- `env.py` - Alembic environment that points to `app.models.base.Base.metadata`.
- `versions/` - migration scripts live here.

Basic workflow (PowerShell on Windows):

# 1) Create an autogenerate migration (initial)
alembic revision --autogenerate -m "create initial tables"

# 2) Apply migrations to the configured database
alembic upgrade head

Notes:
- Ensure the `sqlalchemy.url` in `alembic.ini` points to the database you want to apply migrations to.
- This project uses an async DB URL (e.g. `postgresql+asyncpg://...`) and the provided `env.py` supports running migrations online with AsyncEngine.
