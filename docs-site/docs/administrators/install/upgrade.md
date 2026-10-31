---
id: upgrade
title: Upgrade CMDX
sidebar_label: Upgrade
sidebar_position: 4
doc_type: how-to
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [install]
---

Move an install to a newer CMDX build. You back up, change the image tag and recreate the containers. The backend runs any database migrations when it starts.

:::note
No CMDX version has been released yet, so no `X.Y.Z` image tags exist. Until the first release, hosts run `main` or a pinned `sha-<short>` tag.
:::

## Choose an image tag

`CMDX_IMAGE_TAG` in `.env` sets which build a host runs, and what it updates to:

| `CMDX_IMAGE_TAG` | Host runs | Updates automatically |
| --- | --- | --- |
| `main` (default) | The latest merge | On every merge, within 3 hours |
| `X.Y` | The latest patch of a release line | On patch releases only |
| `X.Y.Z` | Exactly that release | Never |
| `X.Y.Z-rc.N` | Exactly that release candidate | Never |
| `sha-<short>` | One commit | Never |

Production hosts should pin `X.Y.Z`, or `X.Y` to take patches automatically.

CMDX uses one version for the web app, mobile apps and backend, with semantic versioning:

| Change | Means |
| --- | --- |
| Major | The deployment needs manual action, such as a breaking `.env` or Compose change, or the public API changed. |
| Minor | New features, and migrations that run on start. |
| Patch | Fixes only. |

## Step 1: Read the changelog

Read `CHANGELOG.md` in the `cmdx-LMS` repository for every version between yours and the target. Manual steps are listed there.

Check that `.env` has no `APP_VERSION` line. Older example files set one, and it pins `/health` and the plugin version checks to that value across every upgrade. Delete it.

## Step 2: Back up

Take the backup every time, even for a small update. Rolling back the image doesn't undo migrations, so the backup is your only way back.

```bash
cd /opt/cmdx
TS=$(date +%Y%m%d-%H%M%S)
cp .env ".env.bak.$TS"
cp docker-compose.yml "docker-compose.yml.bak.$TS"
docker exec cmdx_postgres pg_dump -U cmdx -d cmdx --format=custom > "cmdx-db-$TS.dump"
docker run --rm -v cmdx_cmdx_storage:/data:ro -v "$PWD":/backup alpine:3.22 \
  tar czf "/backup/cmdx-storage-$TS.tar.gz" -C /data .
```

Replace `cmdx` in `pg_dump` if you changed `POSTGRES_USER` or `POSTGRES_DB`. The volume name starts with the Compose project name, which is the folder name by default. Run `docker volume ls | grep storage` to find yours.

## Step 3: Update the Compose file if needed

If the changelog mentions a Compose change, copy the new `docker-compose.yml` to the host. Edit `.env` first, then validate:

```bash
docker compose config > /tmp/resolved.yml && echo OK
```

## Step 4: Upgrade

Set the new tag in `.env`:

```bash
CMDX_IMAGE_TAG=1.2.0
```

Pull the images and recreate the containers:

```bash
docker compose pull
docker compose up -d
```

The backend runs its migrations before it answers requests. A migration lock stops two processes from running them at once. The Celery services and the web app wait until the backend is healthy, so they never run older code than the API. Large migrations can take a while: the health check allows up to about 15 minutes.

Follow the progress:

```bash
docker compose logs -f backend
```

## Step 5: Check the upgrade

```bash
curl -s http://127.0.0.1:8000/health
docker inspect cmdx_backend --format 'restarts={{.RestartCount}} health={{.State.Health.Status}}'
docker exec cmdx_postgres psql -U cmdx -d cmdx -tAc 'select version_num from alembic_version'
```

`/health` reports the new version, with `"status":"healthy"`. Sign in as an administrator, an instructor and a learner, and open each dashboard.

## Automatic updates

The `watchtower` service checks the registry every 3 hours. When your tag points to a new build, it pulls the image and recreates the four app containers. The worker, beat and frontend are recycled with the backend. Third-party services such as PostgreSQL are never touched.

- Automatic updates need `GHCR_USERNAME` and `GHCR_TOKEN` in `.env`. A `docker login` on the host isn't visible inside the container.
- Migrations run on every automatic update too. Take regular backups if you stay on a moving tag.
- Pinning `X.Y.Z` stops automatic updates, even with watchtower running.
- Turn it off with `docker compose up -d --scale watchtower=0`.

To see what it did:

```bash
docker compose logs -f watchtower
```

## Roll back

Rolling back the image doesn't undo migrations. If the release added any, the old code may not work with the new schema.

If the release added no migrations, set `CMDX_IMAGE_TAG` back to the previous value and run:

```bash
docker compose pull
docker compose up -d
```

If it did add migrations, restore the database backup as well. Stop the app, restore, then start the old version:

```bash
docker compose stop backend celery_worker celery_beat frontend
docker exec -i cmdx_postgres pg_restore -U cmdx -d cmdx --clean --if-exists < cmdx-db-<TS>.dump
docker compose up -d
```

Any changes people made after the backup are lost.

## If a migration fails

A backend that keeps restarting with `DuplicateTable`, `UndefinedTable` or `relation already exists` has a database that doesn't match its recorded revision. Don't keep restarting it. Diagnose it first. This command is read-only and safe on a failing host:

```bash
docker exec cmdx_backend python -m scripts.diagnose_migrations
```

It compares the latest revision, the revision in `alembic_version` and what the schema actually contains. See [troubleshooting](../operations/troubleshooting.md#the-backend-keeps-restarting).

## Related

- [Install for production](./production.md)
- [Troubleshoot an install](../operations/troubleshooting.md)
