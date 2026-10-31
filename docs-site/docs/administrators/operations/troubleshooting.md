---
id: troubleshooting
title: Troubleshoot an install
sidebar_label: Troubleshooting
sidebar_position: 3
doc_type: how-to
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [operations]
---

Fix common problems with a CMDX install. Run the commands from the folder that holds `docker-compose.yml`.

Start with these three commands, which point to the cause of most problems:

```bash
docker compose -f docker-compose.yml ps
curl -s http://127.0.0.1:8000/health
docker compose -f docker-compose.yml logs --tail=100 backend
```

## A change to `.env` has no effect

**Cause:** `docker compose restart` keeps the environment the container already has.

**Fix:** run `docker compose -f docker-compose.yml up -d`. If the key is one that [Compose sets for you](../install/production.md#values-compose-sets-for-you), such as `ENVIRONMENT` or `OTEL_ENABLED`, `.env` can't change it. Add it to your production Compose file.

To see what the containers will receive:

```bash
docker compose -f docker-compose.yml config
```

## The backend keeps restarting

Read the error first:

```bash
docker compose -f docker-compose.yml logs --tail=200 backend
```

### Settings errors

The app stops at start-up if its settings are invalid. The log names the key. With `ENVIRONMENT=production`, check `SECRET_KEY`, `FRONTEND_BASE_URL` and `EMAIL_DELIVERY_MODE`. See [turn on production mode](../install/production.md#turn-on-production-mode).

A SCORM error at start-up means `SCORM_CONTENT_MODE=isolated` is missing `SCORM_LMS_ORIGIN` or `SCORM_CONTENT_ORIGIN`.

### Migration errors

`DuplicateTable`, `UndefinedTable` or `relation already exists` means the database doesn't match its recorded revision. Restarting won't fix it. Run the diagnosis, which is read-only:

```bash
docker exec cmdx_backend python -m scripts.diagnose_migrations
```

If the container doesn't stay up long enough, run it in a one-off container:

```bash
docker compose -f docker-compose.yml run --rm --no-deps -T --entrypoint python backend -m scripts.diagnose_migrations
```

Compare the `verified` revision with `alembic_version`:

| Result | Means | What to do |
| --- | --- | --- |
| Equal | The database is consistent. | Nothing. The next start applies the rest. |
| `verified` is lower | A previous run recorded more than it applied. | Nothing. CMDX corrects this on the next start. |
| `verified` is higher | The schema has more than the record admits. | Back up, then set `MIGRATE_ADOPT_EXISTING_SCHEMA=true` for one start. This skips data migrations in that range, so read the output first. Remove the key afterwards. |
| Revision not in the chain | The database came from another branch. | CMDX falls back to `verified`. |

Back up before you change anything. See [back up and restore CMDX](../install/backup-and-restore.md).

## A new install has no tables

Check that every Compose command names `-f docker-compose.yml`. Without it, Compose also loads `docker-compose.override.yml` from the repository, a file for local development that turns migrations off. It also mounts the source read-only, so the install wizard can't save its results.

## The install wizard says it's already installed

The wizard seals itself when an install finishes, or when it finds CMDX tables in the database. On a host that started once without `INSTALL_MODE=true`, the first boot created tables. To start again on an empty install:

```bash
docker compose -f docker-compose.yml down -v
```

This deletes all data. Set `INSTALL_MODE=true` in `.env`, then start again.

## The app shows 502

The web container is up but the backend isn't. Check the backend, as above. The app recovers without help once the backend is healthy.

## The app is slow or hangs

The usual cause is running out of database connections. Requests wait 30 seconds, then fail.

```bash
docker logs cmdx_backend --since 1h 2>&1 | grep -c 'QueuePool limit'
```

If that isn't `0`, see [size the connection budget](../install/production.md#size-the-connection-budget), and [who holds connections](./monitoring.md#check-database-connections).

Also check the host's memory. Jaeger can use up to its limit, and stalled API workers are replaced after `WORKER_HEALTHCHECK_TIMEOUT` seconds, which drops their requests.

## Emails don't arrive

1. Send a test from **Settings** > **Email**. If that fails, the error shows why. Check the host, the port and **Transport security**.
2. If the test works but real emails don't arrive, check the worker. It does the sending:

   ```bash
   docker compose -f docker-compose.yml ps celery_worker
   docker compose -f docker-compose.yml logs --tail=100 celery_worker | grep -i -E 'mail|smtp'
   ```

3. Check that `EMAIL_DELIVERY_MODE` is `real`. In `dual` or `mailpit` mode, mail goes to Mailpit.
4. Check that `SMTP_HOST` isn't `mailpit`, if nothing is saved in **Settings** > **Email**.
5. If links in emails point to `localhost`, set `FRONTEND_BASE_URL`.

Failed deliveries are retried after 30 seconds, 5 minutes, 30 minutes, 2 hours and 12 hours.

## Files stay at "still being scanned"

**Cause:** `CLAMAV_ENABLED` is on, but ClamAV can't be reached. `.env.example` turns it on. The worker logs show `clamav_unavailable`.

**Fix:** start ClamAV, or turn scanning off. See [scan uploads for viruses](../configuration/storage.md#scan-uploads-for-viruses). ClamAV's first start takes a while, because it downloads its signatures. Files that are waiting are picked up by the next scan.

## SCORM packages won't publish or play

| Symptom | Cause |
| --- | --- |
| Publishing is refused | `CLAMAV_ENABLED` is off, or the zip is larger than `CLAMAV_MAX_SCAN_SIZE`. CMDX won't extract an unscanned package. |
| Playback returns 503 | With `SCORM_CONTENT_MODE=isolated`, the content host isn't set up. |
| A font or image is missing | See `SCORM_ALLOW_REMOTE_FONTS` and `SCORM_ALLOW_REMOTE_MEDIA`. |

## Uploads fail with 413

The file is over a limit. See [set upload limits](../configuration/storage.md#set-upload-limits). There are limits in CMDX, in the web container and in Caddy.

## Long exports time out

The web container waits 30 minutes for the backend. Caddy waits 5 minutes for the first response, so long requests through Caddy can fail with a 502 or 504 first. Run large exports as scheduled exports where you can.

## Sign-in problems

| Symptom | Cause | Fix |
| --- | --- | --- |
| Everyone was signed out at once | `SECRET_KEY` changed, so existing tokens are no longer valid. | Sign in again. |
| Saved SMTP or provider secrets stop working | `SECRET_KEY` or `SITE_ADMIN_DEK` changed, so stored secrets can't be read. | Restore the old value. See [manage secrets and encryption keys](../install/secrets-and-encryption-keys.md). |
| A session drops after a few minutes | With `ENVIRONMENT=production` over plain HTTP, the browser won't send the `Secure` refresh cookie. | Use HTTPS. |
| One person is locked out | Too many failed sign-ins. | Wait for the lockout to end, or adjust it under **Settings** > **Security**. |
| Someone lost their authenticator | | See [recover an account](../identity/users-and-roles.md#recover-an-account-that-lost-its-authenticator). |
| Everyone outside your network is blocked | **IP allowlist** is too strict. | A platform administrator can still reach the security settings from outside the list to correct it. |
| The app shows a maintenance message | Maintenance mode is on. | Turn it off under **Settings** > **Maintenance**. See [use maintenance mode](./maintenance-mode.md). |

## Sign-in with a provider fails

| Message | Cause |
| --- | --- |
| Cancelled or not available | The provider is off, or the person cancelled. Check **Settings** > **Authentication providers**. |
| An account with that email already signs in another way | The email is on an account not linked to this provider. See [what happens at sign-in](../identity/sso-oidc.md#what-happens-at-sign-in). |
| Email isn't verified | The person must verify it at the provider. |
| Sign-in isn't set up correctly | `FRONTEND_BASE_URL` is missing, or points at `localhost` in production. |
| The provider reports a redirect mismatch | The callback address doesn't match. See [find the callback address](../identity/sso-oidc.md#find-the-callback-address). |

## A certificate won't issue

Check the Caddy logs:

```bash
docker compose -f docker-compose.yml logs caddy
```

The usual cause is DNS. Let's Encrypt allows five failed attempts per hostname per hour, so fix DNS before you try again. A negative answer can stay cached for a while after you add the record. Check several public resolvers, as in [with Caddy](../install/production.md#with-caddy), then wait for the limit to clear.

## Automatic updates don't run

```bash
docker compose -f docker-compose.yml logs --tail=100 watchtower
```

Check that `GHCR_USERNAME` and `GHCR_TOKEN` are set, and that the token has `read:packages`. A host `docker login` isn't visible to the service. Pinned tags, such as `X.Y.Z`, never update.

## The Docker image pull fails

`denied` or `unauthorized` means the host isn't logged in to `ghcr.io`. See [sign in to the registry](../install/docker-compose.md#sign-in-to-the-registry).

## Get more detail

To turn on `DEBUG` logging for a short time, use a [diagnostic override](../configuration/developer-settings.md#diagnostic-overrides). To follow one request, find its `trace_id` in the logs and open it in [Jaeger](./monitoring.md#view-traces).

## Related

- [Monitor CMDX](./monitoring.md)
- [Upgrade CMDX](../install/upgrade.md)
