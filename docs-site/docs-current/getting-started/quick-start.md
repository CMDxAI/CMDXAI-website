---
id: quick-start
title: Install CMDX and create a course
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

A CMDX installation on your own machine, with one tenant, a Super Administrator account and a first course. The backend runs in Docker and the web app runs from source. The first image build takes several minutes.

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
| `INSTALL_MODE` | `true` | Starts the backend with only the install wizard available. The wizard creates the schema and your administrator. |
| `RUN_SEED` | `false` | Stops the backend from creating a default administrator account when it starts after the install. |

Keep the values of `POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DB`. You need them in step 5.

## Step 3: Start the backend

Build the images and start the services:

```bash
docker compose -f docker-compose-build.yml up -d --build
```

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

Open `http://localhost:8081/install`. Use `localhost`, not `127.0.0.1`: the API accepts browser requests only from the addresses listed in `CORS_ORIGINS` in `.env`.

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

Set `INSTALL_MODE=true` in `.env` again before step 3.
:::

The tasks run in order and take under a minute. The result is **Installed successfully**, with two expected warnings:

- **Create administrator**: CMDX cannot require multi-factor authentication yet, so the account signs in with a password only.
- **Verify install**: the wizard cannot turn install mode off, because Docker Compose sets it. You do that in step 6.

## Step 6: Turn install mode off

Open `.env` again and set `INSTALL_MODE` to `false`. Keep `RUN_SEED=false`.

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

Open `http://localhost:8081/login` and sign in with the Super Administrator email and password from step 5. CMDX opens the administrator **Dashboard**, with your tenant's name at the top right.

## Step 8: Create a category

Every course belongs to a category, and a new installation has none.

1. In the sidebar, select **Categories**, then **New category**.
2. Enter a **Name**, for example `General`. CMDX fills in the **Slug** from the name.
3. Select **Create category**.

CMDX opens the category page, which shows `Nothing is mapped to General yet`.

## Step 9: Create a course

1. In the sidebar, select **Course Management**, then **New course**.
2. Enter a **Course name**, for example `Getting started with CMDX`. CMDX fills in the **Short name**.
3. In **Category**, select the category from step 8. Keep the **Language**.
4. Select **Create course**.

**Course Management** lists your course with the status **Draft**. A new course starts as a draft with no learners enrolled.

## What you built

A local CMDX with:

- the backend, database, cache, message broker and workers running in Docker
- the web app running from source on `http://localhost:8081`
- one tenant and one Super Administrator account
- one category and one draft course

To stop CMDX and keep your data, run `docker compose -f docker-compose-build.yml down`. To delete everything and install again, follow the warning in step 5.

## Next

- [Glossary](./glossary.md): the terms CMDX uses, such as tenant and learning item
- [Create a course](/users/instructors/create-a-course): add content to a course and publish it
