# Alembic Migrations

- Alembic environment is set up in `alembic_env.py`.
- To create a migration, run:

```
docker-compose exec backend alembic revision --autogenerate -m "init"
docker-compose exec backend alembic upgrade head
```

- Migrations run automatically on backend container startup (see Dockerfile/entrypoint).
- Edit models in this directory and generate new migrations as needed.

# TODO
- Add initial migration after first DB schema is finalized.
