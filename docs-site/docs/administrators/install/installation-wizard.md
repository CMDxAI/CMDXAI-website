---
id: installation-wizard
title: Run the installation wizard
sidebar_label: Installation wizard
sidebar_position: 6
doc_type: how-to
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [install]
---

Set up a new CMDX install from the browser. The wizard checks the host, creates the schema, runs the migrations, and creates the first tenant and the Super Administrator. This page covers what each step does, and what to do when a step fails.

## Prerequisites

- A running backend in install mode. See [Install with Docker Compose](./docker-compose.md).
- An empty database. It must hold no CMDX tables.
- The wizard must not be reachable from the network. It has no sign-in until it finishes, and whoever reaches it first completes it.

## How install mode starts

| How the backend starts | What happens |
| --- | --- |
| `INSTALL_MODE=true`, with a `DATABASE_URL` | The backend creates only the three installer tables. The wizard installs into this database. |
| `INSTALL_MODE=true`, no `DATABASE_URL` | Setup mode. The wizard installs into the database you enter in its Database step. |
| No `.env` and nothing in the environment, running from source | The backend writes a `.env` with `INSTALL_MODE=true` and a generated `SECRET_KEY`, then starts in setup mode. |
| `INSTALL_MODE` off, on an empty database | The backend creates tables itself, and the wizard seals. Don't start a new install this way. |

Run one API worker during a setup-mode install. Each worker would write its own `.env`, and only the one that starts the install is bound to the database.

## Steps

1. Open `/install` on the web app. With Compose, use `http://localhost:8080/install`, through an SSH tunnel from another machine.
2. **Before you begin** lists what the install needs. Nothing is read or written here.
3. **Requirements** checks the host. Fix each blocking item, then run the checks again. See [prechecks](#prechecks).
4. **Database**: enter the connection details and select **Test connection**. Keep these the same as the database the backend started with. The result shows the server version, and whether the schema is empty.
5. **Services**: set file storage, which is required. Cache, queue and email are optional. Each section has its own test.
6. **Site & administrator**: enter these details:

   | Field | Rules |
   | --- | --- |
   | **Base URL** | Must be `https://`. Plain `http://` is accepted only for `localhost`. |
   | Tenant slug | 2 to 63 characters. You can't change it later. |
   | Administrator password | At least 12 characters |

   Choose the modules to install here. Core modules can't be turned off.

7. **Install** shows a summary of your answers. Select **Start installation**. The tasks run in order, with a live log. See [install tasks](#install-tasks).
8. Read any warnings on the result screen.
9. If the backend runs from an environment you control, set `INSTALL_MODE=false` yourself and recreate the containers. With Compose, the wizard can't do this for you:

   ```bash
   docker compose -f docker-compose.yml up -d
   ```

   When the backend reads a `.env` it can write to, the wizard turns install mode off in that file. Restart the backend anyway, so its normal start-up runs against the new database.

## Prechecks

Blocking checks must pass before you can continue. A warning lets you continue.

| Check | Requires | If it fails |
| --- | --- | --- |
| **Python interpreter** | 3.11 or later | Blocking |
| **FastAPI · Uvicorn** | Application server present | Blocking |
| **Writable paths** | Storage and log folders are writable | Blocking |
| **Async driver** | A driver for the database type | Blocking |
| **Server version** | PostgreSQL 13, MySQL 8.0 or SQLite 3.35 or later | Blocking |
| **Privileges** | `CREATE`, `CREATE EXTENSION` and `ALTER` on the schema | Blocking |
| **Encoding & collation** | UTF8, with a deterministic collation | Blocking |
| **Existing schema** | No CMDX tables in the database | Blocking |
| **SECRET_KEY** | A random key of at least 32 bytes | Blocking |
| **Base URL over HTTPS** | An absolute `https://` address | Blocking |
| **Install lock** | `install/.lock` is absent | Blocking |
| **Node toolchain** | Node.js 20 or later | Warning. Expected in a container. |
| **Redis** | 7.0 or later, reachable | Warning |
| **Broker namespace** | The cache and the task broker don't share a Redis database | Warning |
| **Object storage** | A writable bucket, or at least 500 MB free on local disk | Warning |
| **SMTP relay** | A reachable mail server | Warning |

## Install tasks

Tasks run in this order. Each one can run again safely, so a failed install can resume.

| Task | Does |
| --- | --- |
| **Write configuration** | Saves your answers to `.env` |
| **Create schema and extensions** | Prepares the database |
| **Run core migrations** | Applies the migrations |
| **Seed roles and permission registry** | Creates the standard roles |
| **Install modules** | Installs the modules you selected |
| **Create first tenant** | Creates the tenant |
| **Create administrator** | Creates the Super Administrator, with `platform_superadmin` and `admin`, and makes them `org_admin` of the tenant |
| **Register workers and schedules** | Registers scheduled tasks. Warns if the broker is unreachable. |
| **Compile static assets** | Builds static assets, where the host can |
| **Verify install** | Checks the result and writes the lock file |

Some answers aren't honored. The wizard doesn't turn on multi-factor authentication for the account, so **Create administrator** always warns. Turn it on under **Settings** > **Security**. Schema-per-tenant isn't supported, and asking for it fails the install.

## Verify

- `/install` shows an **Already installed** screen with a link to sign in.
- You can sign in as the Super Administrator.
- `/health` reports `"status":"healthy"`.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `/install` says **Already installed** on a new host | The backend started once without install mode and created tables, or `install/.lock` is left over. | Start again on an empty database with `INSTALL_MODE=true`. With Compose, `down -v` deletes all data. |
| A task failed | See the log on screen. Select the option to retry, which resumes from the failed task. | Fix the cause first. Retrying is safe, but there is no rollback. |
| You finished a failed install by hand | A leftover failed run could be retried with its stored answers. | Delete it: `DELETE FROM install_run WHERE phase = 'failed'`. |
| The wizard refuses a different database after a failed attempt | The process stays bound to the first database. | Remove `DATABASE_URL` from `backend/.env` and restart the backend. |
| `CORS` errors when running from source | The browser address isn't in `CORS_ORIGINS`. | Use `localhost`, not `127.0.0.1`. |

The wizard writes its answers inside the backend container, and a container that isn't mounted from the host loses them when it is recreated. Keep any value you need, such as SMTP settings, in `.env` or under **Settings**.

## Related

- [Install with Docker Compose](./docker-compose.md)
- [Install for production](./production.md)
- [Requirements](./requirements.md)
