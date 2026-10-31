---
id: environment-variables
title: Environment variables
sidebar_label: Environment variables
sidebar_position: 5
doc_type: reference
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [configuration]
---

Settings CMDX reads from the environment at start-up. With Docker Compose they live in `.env`, next to `docker-compose.yml`. Settings you can change in the running app are on the other [configuration](./feature-flags.md) pages.

This page lists the keys an administrator is likely to set. The full list is in `backend/core/config/settings.py`.

## Apply a change

Changes need new containers:

```bash
docker compose up -d
```

`docker compose restart` doesn't read `.env` again, so a changed value appears to have no effect. For a safe procedure, see [apply a change to a running host](../install/production.md#apply-a-change-to-a-running-host).

## Values Compose sets for you

`docker-compose.yml` sets these for the app containers. They win over `.env`, so changing them in `.env` has no effect. To change one, use an override file, as in [turn on production mode](../install/production.md#step-3-turn-on-production-mode).

| Key | Value in Compose |
| --- | --- |
| `ENVIRONMENT` | `development` |
| `DATABASE_URL` | Built from `POSTGRES_*`, with the host `postgres` |
| `REDIS_URL` | `redis://redis:6379/0` |
| `CELERY_BROKER_URL` | `amqp://guest:guest@rabbitmq:5672//` |
| `CELERY_RESULT_BACKEND` | `redis://redis:6379/0` |
| `EMAIL_PROVIDER` | `smtp` |
| `UPLOAD_DIR` | `/app/storage_uploads` |
| `OTEL_ENABLED` | `true` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://jaeger:4317` |
| `OTEL_LOGS_EXPORT` | `false` |

## Images and deployment

| Key | Default | Description |
| --- | --- | --- |
| `CMDX_IMAGE_REPO` | `ghcr.io/cmdxai/cmdx-lms` | Where images come from |
| `CMDX_IMAGE_TAG` | `main` | Which build to run. See [choose an image tag](../install/upgrade.md#choose-an-image-tag). |
| `GHCR_USERNAME`, `GHCR_TOKEN` | Empty | Registry credentials for automatic updates |
| `COMPOSE_PROFILES` | Empty | Optional services: `edge` for Caddy, `antivirus` for ClamAV |
| `CADDY_DOMAIN` | `localhost` | The public host name |
| `CADDY_MAX_BODY` | `20MB` | Largest request Caddy accepts |
| `BACKEND_PUBLISH` | `8000` | Host bind for the API |
| `FRONTEND_PUBLISH` | `127.0.0.1:8080` | Host bind for the web app |
| `POSTGRES_PUBLISH` | `127.0.0.1:5432` | Host bind for PostgreSQL. Always include an address. |
| `TZ` | `UTC` | Time zone for the update service's logs |

## Application

| Key | Default | Description |
| --- | --- | --- |
| `FRONTEND_BASE_URL` | `http://localhost:5173` | Public address of the app. Used in email links and after provider sign-in. Required in production. |
| `DEBUG` | `true` | Forced off in production |
| `LOG_LEVEL` | `INFO` | See [developer settings](./developer-settings.md#set-the-log-level) |
| `INSTALL_MODE` | `false` | Leaves the database to the install wizard |
| `RUN_MIGRATIONS` | `true` | Runs migrations when the backend starts |
| `RUN_SEED` | `true` | Seeds roles when the backend starts |
| `WORKERS` | `2` | API worker processes. See [size the connection budget](../install/production.md#step-1-size-the-connection-budget). |
| `WORKER_HEALTHCHECK_TIMEOUT` | `60` | Seconds before a stalled API worker is replaced |
| `CELERY_CONCURRENCY` | `4` | Celery worker processes |

## Database

| Key | Default | Description |
| --- | --- | --- |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | `cmdx` in the example file | Credentials for the PostgreSQL container |
| `POSTGRES_MAX_CONNECTIONS` | `200` | Connection limit for the PostgreSQL container |
| `DATABASE_POOL_SIZE` | `20` | Connections for each API worker |
| `DATABASE_MAX_OVERFLOW` | `10` | Extra connections for each API worker |
| `DATABASE_POOL_RECYCLE` | `3600` | Seconds before a connection is replaced |
| `DATABASE_READ_REPLICA_URLS` | Empty | Read replicas, separated by commas |

## Security

| Key | Default | Description |
| --- | --- | --- |
| `SECRET_KEY` | `change-this-secret-key` | Signs tokens. Use at least 32 random bytes. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Access token lifetime, unless **Settings** > **Security** sets one |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token lifetime, unless **Settings** > **Security** sets one |
| `CORS_ORIGINS` | Local development addresses | Browser origins allowed to call the API. Needed only when the app and the API are on different addresses. |
| `LOGIN_MAX_ATTEMPTS` | `5` | Failed sign-ins before a lockout |
| `LOGIN_LOCKOUT_SECONDS` | `900` | Length of the lockout |
| `RATE_LIMIT_ENABLED` | `true` | Turns API rate limits on |
| `RATE_LIMIT_PER_MINUTE`, `RATE_LIMIT_PER_HOUR` | `60`, `1000` | Default limits |
| `IP_ALLOWLIST`, `IP_BLOCKLIST` | Empty | Addresses to allow or block |
| `TRUSTED_HOSTS` | Empty | Trusted reverse proxies |
| `MAINTENANCE_MODE` | `false` | Puts the app in maintenance mode. You can also do this under **Settings** > **Maintenance**. |
| `MAINTENANCE_BYPASS_IPS` | Empty | Addresses that skip maintenance mode |

### Secrets at rest

These protect the secrets you save in **Settings**, such as the SMTP password. CMDX uses the first option that is set:

| Option | Keys |
| --- | --- |
| AWS KMS | `SITE_ADMIN_KMS_KEY_ID`, `SITE_ADMIN_DEK_CIPHERTEXT` |
| HashiCorp Vault | `SITE_ADMIN_VAULT_ADDR`, `SITE_ADMIN_VAULT_TOKEN`, `SITE_ADMIN_VAULT_DEK_PATH` |
| A key in `.env` | `SITE_ADMIN_DEK`, the base64 of 32 random bytes |
| Fallback | Derived from `SECRET_KEY`. Avoid this in production. |

To change the key, keep the old one in `SITE_ADMIN_DEK_PREVIOUS`, so CMDX can still read existing secrets. Then set `SITE_ADMIN_KEY_ROTATION_ENABLED=true`, run the `site_admin.key_rotation` task, as in [run a task now](../operations/scheduled-tasks.md#run-a-task-now), and clear the old key when it finishes.

## Email

See [configure email](./email.md). Values saved in **Settings** win over `SMTP_*`.

| Key | Default | Description |
| --- | --- | --- |
| `EMAIL_DELIVERY_MODE` | `real` | `real`, `mailpit` or `dual`. The example file sets `dual`. |
| `SMTP_HOST`, `SMTP_PORT` | Mailpit in development | The server |
| `SMTP_USER`, `SMTP_PASSWORD` | Empty | Credentials |
| `SMTP_USE_TLS` | `true` | SSL/TLS from the start of the connection |
| `SMTP_START_TLS` | `false` | Upgrades the connection with STARTTLS |
| `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME` | `noreply@example.com`, `LMS Framework` | The sender |
| `SENDGRID_API_KEY` | Empty | For `EMAIL_PROVIDER=sendgrid` |

## Storage and uploads

See [configure file storage](./storage.md).

| Key | Default | Description |
| --- | --- | --- |
| `STORAGE_BACKEND` | `local` | Used by report and user exports. Keep this as `local`. |
| `MAX_UPLOAD_SIZE` | `10485760` | Largest upload in bytes, unless **Settings** > **Storage** sets one |
| `BULK_CSV_MAX_UPLOAD_SIZE` | `52428800` | Largest CSV for bulk imports, in bytes |
| `CLAMAV_ENABLED` | `false` | Turns on virus scanning. The example file sets `true`. |
| `CLAMAV_HOST`, `CLAMAV_PORT` | `clamav`, `3310` | The ClamAV service |
| `CLAMAV_MAX_SCAN_SIZE` | `104857600` | Files larger than this, in bytes, aren't scanned |

## SCORM

| Key | Default | Description |
| --- | --- | --- |
| `SCORM_CONTENT_MODE` | `same-origin` | `same-origin` serves packages from the app's own address. `isolated` serves them from a separate host, which is stricter. |
| `SCORM_LMS_ORIGIN`, `SCORM_CONTENT_ORIGIN` | Empty | Both required for `isolated`, as two different hosts on the same parent domain |
| `SCORM_ALLOW_REMOTE_FONTS` | `false` | Lets packages load Google Fonts. Each request sends the learner's IP address to Google. |
| `SCORM_ALLOW_REMOTE_MEDIA` | `true` | Lets packages load images, media and framed pages from other hosts |

## Monitoring

See [monitor CMDX](../operations/monitoring.md).

| Key | Default | Description |
| --- | --- | --- |
| `ENABLE_PROMETHEUS` | `false` | Turns on `/metrics` |
| `METRICS_TOKEN` | Empty | Bearer token for `/metrics`. Empty means no check. |
| `SENTRY_DSN` | Empty | Sends errors to Sentry |
| `SENTRY_ENVIRONMENT` | `development` | Environment name in Sentry |
| `OTEL_SERVICE_NAME` | `lms-framework` | Service name in traces |
| `OTEL_TRACE_SAMPLE_RATE` | `1.0` | Share of requests traced |
| `JAEGER_MAX_TRACES`, `JAEGER_MEM_LIMIT`, `JAEGER_GOMEMLIMIT` | `1000`, `1g`, `800MiB` | Jaeger's memory limits. Size them together. |

## Privacy

| Key | Default | Description |
| --- | --- | --- |
| `RETENTION_SWEEP_ENABLED` | `false` | Deletes rows older than the `RETENTION_*` windows |
| `RETENTION_SWEEP_INTERVAL_HOURS` | `24` | How often the sweep runs |
| `ACCOUNT_DELETION_AUTO_EXECUTE` | `false` | Carries out deletion requests after the grace period |
| `ACCOUNT_DELETION_GRACE_DAYS` | `30` | The grace period, at most 30 days |
| `TERMS_URL`, `PRIVACY_POLICY_URL` | Empty | Links shown at sign-up and sign-in |
| `TERMS_VERSION`, `PRIVACY_POLICY_VERSION` | `2026-10` | Stored with each consent |
| `AI_BLOCKED_PROVIDER_TYPES` | `["deepseek"]` | AI providers that can't be configured |

## Keys in the example file that do nothing

`.env.example` lists these, but the code doesn't read them. Leave them out, and use the listed page instead.

| Keys | Use instead |
| --- | --- |
| `SAML_*` | [SAML](../identity/sso-saml.md) |
| `LDAP_*` | [LDAP](../identity/ldap.md) |
| `MICROSOFT_*`, `GOOGLE_REDIRECT_URI`, `GITHUB_REDIRECT_URI` | [OIDC](../identity/sso-oidc.md) |
| `FEATURE_*` | [Feature flags](./feature-flags.md) |
| `AZURE_STORAGE_*`, `GCS_*` | [File storage](./storage.md) |

Don't set `APP_VERSION`. It ships in the image, and a value in `.env` pins `/health` and the plugin version checks across upgrades.

## Related

- [Install for production](../install/production.md)
- [Configuration for developers](../../developers/architecture/config-service.md)
