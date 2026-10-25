---
id: quick-start
title: Run CMDX locally
sidebar_label: Quick start
sidebar_position: 1
doc_type: tutorial
audience: all
source_prd: none
ai_drafted: true
last_verified: 2026-10-25
tags: [getting-started, install]
---

## What you will build

A CMDX installation on your own machine, with one tenant and a Super Administrator account you sign in with. The backend runs in Docker and the web app runs from source. The first image build takes several minutes.

## Before you start

- **Access to the source.** The code is in the private GitHub repository `CMDxAI/cmdx-LMS`. Ask your CMDX contact for read access.
- **Docker** with Docker Compose v2 or later.
- **Node.js** 18 or later, for the web app.
- **Git.**
- **Free ports.** The stack listens on 5432 (PostgreSQL), 6379 (Redis), 5672 and 15672 (RabbitMQ), 8000 (API), 8081 (web app), 1025 and 8025 (Mailpit), and 16686, 4317 and 4318 (Jaeger). Stop anything else that uses them.

This tutorial was tested on 2026-10-25 with Docker 29.6.2, Docker Compose 5.3.1 and Node.js 26 on macOS.

## Step 1: Get the code

```bash
git clone https://github.com/CMDxAI/cmdx-LMS.git
cd cmdx-LMS
```

Run every command in this tutorial from the `cmdx-LMS` folder unless a step says otherwise.

## Step 2: Create the environment file

Copy the example file:

```bash
cp .env.example .env
```

Open `.env` and change these keys. Add `INSTALL_MODE`, which is not in the example file.

| Key | Value | Why |
| --- | --- | --- |
| `SECRET_KEY` | the output of `python3 -c "import secrets; print(secrets.token_urlsafe(48))"` | Signs tokens and session cookies. |
| `INSTALL_MODE` | `true` | Starts the backend with only the install wizard available. |
| `RUN_MIGRATIONS` | `false` | Leaves the database empty so the wizard can create the schema. |
| `RUN_SEED` | `false` | Stops the start-up script from creating a default administrator. The wizard creates yours. |
| `WORKERS` | `1` | Runs one API process while the wizard runs. Two processes fail when they create the installer tables at the same time. |
| `CORS_ORIGINS` | `["http://localhost:8081"]` | Lets the web app on port 8081 call the API. |

Keep the values of `POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DB`. You need them in step 5.

## Step 3: Start the backend

Build the images and start the services:

```bash
BUILDX_BAKE_ENTITLEMENTS_FS=0 docker compose -f docker-compose-build.yml up -d --build
```

`BUILDX_BAKE_ENTITLEMENTS_FS=0` lets the build read the backend Dockerfile, which is outside the build folder. Without it, Docker Compose 5 stops with `additional privileges requested`.

The command returns when the API is healthy. The first run takes several minutes. Check that the API answers:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8000/health
```

The output is `200`. Then check that the backend started in install mode:

```bash
docker compose -f docker-compose-build.yml logs backend | grep "installer table"
```

The output contains `INSTALL_MODE is on: created 3 installer table(s) only`.

## Step 4: Start the web app

In a second terminal, from the `cmdx-LMS` folder:

```bash
cd frontend
npm install
npm run web
```

Wait until the terminal shows `Waiting on http://localhost:8081`. The first page load also builds the app, which takes about 20 seconds.

## Step 5: Run the install wizard

Open `http://localhost:8081/install`. Use `localhost`, not `127.0.0.1`: the API accepts browser requests only from the address in `CORS_ORIGINS`.

The wizard has six steps. Each one shows its status in the left-hand list.

1. **Before you begin** lists what an install needs. Nothing is written here. Select **Run prechecks**.
2. **Requirements** checks the host. One warning is expected: **Node toolchain**, `node not found on PATH`, because the backend container has no Node.js. Select **Continue**.
3. **Database**: enter these values, then select **Test connection**.

   | Field | Value |
   | --- | --- |
   | **Host** | `postgres` |
   | **Port** | `5432` |
   | **Database** | the value of `POSTGRES_DB` in `.env` |
   | **User** | the value of `POSTGRES_USER` |
   | **Password** | the value of `POSTGRES_PASSWORD` |

   The result shows **Connected** and **schema empty**. Select **Continue**.
4. **Services**: under **File storage**, keep **Local disk** and set **Path** to `/app/storage_uploads`. Select **Test storage**; the result is **Storage is writable**. Leave **Cache, queue & workers** and **Email** as they are, and select **Continue**.
5. **Site & administrator**: enter a site name, a tenant name and a slug for the first tenant, and an email and password for the Super Administrator. The password needs at least 12 characters. Keep the default **Base URL**. Select **Continue**.

   The slug appears in URLs and exports, and you cannot change it after the install.
6. **Install** shows a summary of your answers. Check it, then select **Start installation**.

:::warning
**Start installation** runs once and cannot be undone from the wizard. When it finishes, the wizard seals itself with the file `backend/install/.lock`. To install again, delete the data and both files the wizard wrote, then start from step 3:

```bash
docker compose -f docker-compose-build.yml down -v
rm backend/install/.lock backend/.env
```

Set `INSTALL_MODE=true` and `RUN_MIGRATIONS=false` in `.env` again before step 3.
:::

The tasks run in order and take under a minute. The result is **Installed successfully**. One warning is expected on **Create administrator**: CMDX cannot require multi-factor authentication yet, so the account signs in with a password only.

## Step 6: Turn install mode off

Open `.env` again and change two keys:

| Key | Value |
| --- | --- |
| `INSTALL_MODE` | `false` |
| `RUN_MIGRATIONS` | `true` |

Recreate the containers so they read the new values:

```bash
docker compose -f docker-compose-build.yml up -d
```

Use `up -d`, not `restart`. `restart` keeps the old environment, so the backend would stay in install mode.

Check the setting inside the container:

```bash
docker compose -f docker-compose-build.yml exec backend printenv INSTALL_MODE
```

The output is `false`.

## Step 7: Sign in

Open `http://localhost:8081/login` and sign in with the Super Administrator email and password from step 5. CMDX opens **Home**, with your tenant's name at the top right.

:::note
The Super Administrator account created by the install wizard opens the learner **Home**, not the administrator pages, so you cannot create a course from it yet. This is a known issue. This tutorial will add the course steps when it is fixed. Until then, see [Create a course](/users/instructors/create-a-course).
:::

## What you built

A local CMDX with:

- the backend, database, cache, message broker and workers running in Docker
- the web app running from source on `http://localhost:8081`
- one tenant and one Super Administrator account

To stop CMDX and keep your data, run `docker compose -f docker-compose-build.yml down`. To delete everything and install again, follow the warning in step 5.

## Next

- [Glossary](./glossary.md): the terms CMDX uses, such as tenant and learning item
- [Create a course](/users/instructors/create-a-course)
