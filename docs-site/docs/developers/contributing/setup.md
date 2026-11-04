---
id: setup
title: Set up a development environment
sidebar_label: Setup
sidebar_position: 1
doc_type: how-to
audience: developers
source_prd: none
ai_drafted: true
last_verified: 2026-10-28
tags: [contributing]
---

Run the CMDX backend and frontend from source on your machine, so that code changes take effect as you save them.

You need access to the `CMDxAI/cmdx-LMS` repository on GitHub. To run CMDX without changing its code, follow the [quick-start](/getting-started/quick-start) instead.

## Prerequisites

- Git, and access to `CMDxAI/cmdx-LMS`.
- Python 3.11 or later. CI and the backend image use 3.12.
- Node.js 22, the version CI uses, with npm.
- Docker, to run PostgreSQL and Redis. You can use your own PostgreSQL 14 or later and Redis 7 or later instead.
- The OpenLDAP and SASL development headers, which the `python-ldap` package needs to build. On Debian or Ubuntu: `sudo apt-get install libldap2-dev libsasl2-dev`. <!-- TODO: verify the macOS equivalent -->

## Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/CMDxAI/cmdx-LMS.git
   cd cmdx-LMS
   ```

2. Start PostgreSQL and Redis:

   ```bash
   docker run -d --name cmdx-dev-postgres -p 5432:5432 \
     -e POSTGRES_USER=lms_user -e POSTGRES_PASSWORD='<db-password>' -e POSTGRES_DB=lms_db \
     postgres:15-alpine
   docker run -d --name cmdx-dev-redis -p 6379:6379 redis:7-alpine
   ```

   Choose your own `<db-password>`. If another CMDX stack already uses ports 5432 or 6379, stop it first or map other ports and change the URLs in step 3.

3. Set up the backend:

   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env
   ```

   In `.env`, set the database URL to the container from step 2, and change `SECRET_KEY` to a long random value:

   ```bash
   DATABASE_URL=postgresql://lms_user:<db-password>@localhost:5432/lms_db
   ```

   `.env` already sets `ENVIRONMENT=development` and `REDIS_URL=redis://localhost:6379/0`.

4. Create the tables, the standard roles and an administrator:

   ```bash
   python -m scripts.migrate
   python -m scripts.seed_standard_roles
   python -m scripts.seed_rbac_admin --email <your-email> --password '<a-password>'
   ```

   Use `python -m scripts.migrate`, not `alembic upgrade head`: the script also handles a database that already has tables.

5. Start the backend:

   ```bash
   uvicorn main:app --reload
   ```

   The API listens on `http://127.0.0.1:8000` and restarts when you save a Python file.

6. In a second terminal, start the frontend:

   ```bash
   cd cmdx-LMS/frontend
   npm install
   npm run web
   ```

   The web app opens at `http://localhost:8081`. In development it calls the API at `http://127.0.0.1:8000` unless `EXPO_PUBLIC_API_BASE_URL` is set.

7. Sign in at `http://localhost:8081` with the administrator from step 4.

## Verify

Check the backend is up and connected to the database:

```bash
curl -s http://127.0.0.1:8000/health
```

The response includes:

```json
{"status": "healthy", "environment": "development", "database": {"status": "healthy", "backend": "postgresql"}}
```

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `pip install` fails while building `python-ldap` | The OpenLDAP or SASL headers are missing. | Install them, as in the prerequisites, and run `pip install` again. |
| `docker run` fails with `port is already allocated` | Another PostgreSQL or Redis, often another CMDX stack, uses the port. | Stop it, or map another host port and change `DATABASE_URL` or `REDIS_URL` in `backend/.env`. |
| `/health` shows the database as unhealthy | The backend can't reach PostgreSQL. | Check the PostgreSQL container is running and that `DATABASE_URL` matches its user, password, port and database. |

## Next

- [Follow the coding standards](./coding-standards.md)
- [Build your first plugin](../plugins/build-a-plugin.md)
