"""Alembic env file for async SQLAlchemy with autogenerate support.

This env.py imports your project's SQLAlchemy `Base` (from
`app.models.base`) and sets `target_metadata` so Alembic can
autogenerate migrations. It supports both offline and async online
migration modes.
"""
from __future__ import with_statement
import asyncio
import os
import sys
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy import engine_from_config
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context

# ensure project package path is importable (project root)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# this should import the declarative Base used by your models
from app.models.base import Base  # noqa: E402

# Import all model modules so that SQLAlchemy Table objects are registered
# on Base.metadata. This ensures alembic autogenerate can detect the
# models. We skip helper modules like base and alembic_env.
models_dir = os.path.join(os.path.dirname(__file__), "..", "app", "models")
try:
    for fname in os.listdir(os.path.abspath(models_dir)):
        if not fname.endswith(".py"):
            continue
        mod_name = fname[:-3]
        if mod_name in ("__init__", "base", "alembic_env"):
            continue
        # import the module (e.g. app.models.user)
        __import__(f"app.models.{mod_name}")
except Exception:
    # best-effort import; if it fails, autogenerate may produce empty migrations
    pass

# Alembic Config object, which provides access to the values within the
# alembic.ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import your model's MetaData object here for 'autogenerate' support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL and not an Engine,
    though an Engine is acceptable here as well. Calls to
    context.execute() here emit the given string to the script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Run migrations in 'online' mode using an AsyncEngine.

    The AsyncEngine is created from the URL in alembic.ini (or override)
    and the migration functions are executed synchronously via
    connection.run_sync().
    """
    connectable = create_async_engine(
        config.get_main_option("sqlalchemy.url"),
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
