---
id: backup-and-restore
title: Back up and restore CMDX
sidebar_label: Backup and restore
sidebar_position: 7
doc_type: how-to
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [install, operations]
---

Back up a CMDX install on Docker Compose, and restore it. CMDX has no backup job of its own, so you schedule and keep these yourself. Run every command from the `cmdx-LMS` folder.

## What to back up

| What | Where | Why |
| --- | --- | --- |
| Database | The `postgres_data` volume | All users, courses, grades and settings |
| Uploads | The `cmdx_storage` volume | Uploaded files and extracted SCORM packages. Keep this even if you use S3. |
| Configuration | `.env`, and any Compose file you added | Without the keys in `.env`, stored secrets can't be read. |
| Certificates | The `caddy_data` volume, if you use Caddy | Avoids a new certificate request after a restore |

If you use S3, back up the bucket with your provider's tools. Redis, RabbitMQ and Jaeger hold no lasting data you need.

## Prerequisites

- Shell access to the host, and room for the backup files.
- The names of your volumes. They start with the Compose project name:

  ```bash
  docker volume ls | grep -E 'cmdx_storage|caddy_data'
  ```

The examples use a project called `cmdx-lms`, so the uploads volume is `cmdx-lms_cmdx_storage`. Replace it with yours. Replace `cmdx` in the database commands if you changed `POSTGRES_USER` or `POSTGRES_DB`.

## Steps

### Back up

1. Set a timestamp:

   ```bash
   TS=$(date +%Y%m%d-%H%M%S)
   ```

2. Dump the database:

   ```bash
   docker exec cmdx_postgres pg_dump -U cmdx -d cmdx --format=custom > "cmdx-db-$TS.dump"
   ```

3. Archive the uploads:

   ```bash
   docker run --rm -v cmdx-lms_cmdx_storage:/data:ro -v "$PWD":/backup alpine:3.22 \
     tar czf "/backup/cmdx-storage-$TS.tar.gz" -C /data .
   ```

4. Copy the configuration:

   ```bash
   cp .env ".env.bak.$TS"
   ```

5. Copy all of these off the host, and keep the `.env` copy somewhere safe. It holds passwords and keys.

Files uploaded while the backup runs may be missing from the archive. Take backups at a quiet time.

Schedule these steps with the host's scheduler, and remove old copies. Your retention of backups is your responsibility, and may need to appear in your data processing agreements.

### Restore

Restoring replaces the data in the install. Changes made after the backup are lost.

1. Install the same CMDX version the backup came from. Use the same `CMDX_IMAGE_TAG`, because the database schema must match the code.
2. Restore `.env`, then start only the database:

   ```bash
   docker compose -f docker-compose.yml up -d postgres
   ```

3. Stop the app if it is running:

   ```bash
   docker compose -f docker-compose.yml stop backend celery_worker celery_beat frontend
   ```

4. Restore the database:

   ```bash
   docker exec -i cmdx_postgres pg_restore -U cmdx -d cmdx --clean --if-exists < cmdx-db-<TS>.dump
   ```

5. Restore the uploads:

   ```bash
   docker run --rm -v cmdx-lms_cmdx_storage:/data -v "$PWD":/backup alpine:3.22 \
     tar xzf "/backup/cmdx-storage-<TS>.tar.gz" -C /data
   ```

6. Set `INSTALL_MODE=false` and `RUN_SEED=false` in `.env`, then start everything:

   ```bash
   docker compose -f docker-compose.yml up -d
   ```

## Verify

- `/health` reports `"status":"healthy"`.
- You can sign in, and open a course and one of its files.
- **Send test email** works under **Settings** > **Email**. This shows the stored secrets can be read with the restored keys.

Try a full restore on a spare host before you rely on your backups.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `pg_restore` reports errors about extensions or owners | The target database differs from the source. | Restore into an empty database. Check that `POSTGRES_USER` matches. |
| The backend keeps restarting after a restore | The code is a different version from the backup. | Set `CMDX_IMAGE_TAG` to the version of the backup. |
| Files are missing or show as not found | The uploads archive wasn't restored, or it is older than the database dump. | Restore the matching archive. |
| Saved SMTP or provider secrets fail | `.env` has different keys from the backup. | Restore the original `SECRET_KEY` and `SITE_ADMIN_DEK`. |

## Related

- [Upgrade CMDX](./upgrade.md)
- [Install for production](./production.md)
