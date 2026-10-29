---
id: environment-variables
title: Environment variables
sidebar_label: Environment variables
sidebar_position: 5
doc_type: reference
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-29
tags: [install, configuration]
---

The CMDX backend reads these environment variables at start-up. The API, the Celery worker and Celery beat read the same set. Settings that administrators change at run time are config keys, covered in [Configuration](../../developers/architecture/config-service.md).

## How CMDX reads variables

- **Sources.** A variable set in the process environment wins. Otherwise CMDX reads `backend/.env`, then the repository root `.env`, relative to the working directory. With Docker Compose, values in a service's `environment:` block override the file named in `env_file:`.
- **Names** are case-sensitive. An unknown name is ignored without a warning, so check the spelling.
- **Restart** the API, the worker and beat after a change. Values are read once per process.
- **Booleans** take `true` or `false`.
- **Lists** take a JSON array, even for one value: `CORS_ORIGINS=["https://lms.example.com"]`. A comma-separated value stops start-up. `AI_BLOCKED_PROVIDER_TYPES` is the only list that also accepts commas.
- **Ranges.** A value outside the range in its description stops start-up.
- **Run-time overrides.** Some values are fallbacks for settings saved in Site Admin or developer settings; their descriptions say so. Of the logging variables, only `LOG_LEVEL` can be overridden in developer settings. See [Logging](../../developers/architecture/logging.md).

## Production checks

Set `ENVIRONMENT` to `production`, in lowercase, on every deployment that others can reach. With that value:

- `SECRET_KEY` must not be the shipped placeholder.
- `FRONTEND_BASE_URL` must be set and must not point at `localhost`.
- `EMAIL_DELIVERY_MODE` must be `real`.
- In SCORM isolated mode, both origins must use HTTPS.
- `DEBUG` is forced to `false`.

If a check fails, the process stops at start-up and logs the variable at fault.

## Environment and app

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `ENVIRONMENT` | string | `development` | Deployment mode. Any value other than `production` exposes the API docs and the development testing routes. |
| `DEBUG` | boolean | `true` | Return raw exception text in HTTP 500 responses. Forced to `false` in production. |
| `LOG_LEVEL` | string | `INFO` | Lowest log level written: `DEBUG`, `INFO`, `WARNING`, `ERROR` or `CRITICAL`. Any other value stops start-up. |
| `LOG_JSON` | boolean | `true` | Write logs to standard output as JSON lines. `false` uses `LOG_FORMAT`. |
| `LOG_FORMAT` | string | `%(asctime)s %(levelname)s %(name)s %(message)s` | Python logging format for plain-text logs. Used only when `LOG_JSON` is `false`. |
| `APP_NAME` | string | `LMS Framework` | Product name in the API docs title, the MFA issuer in authenticator apps, and notifications when branding sets no site name. The installation wizard writes it. |
| `APP_VERSION` | string | `1.0.0` | Version reported by `/health` and checked against plugin version constraints. Each release image sets it; leave it unset. |
| `API_V1_PREFIX` | string | `/api/v1` | URL prefix of every API route. Keep the default; the web app calls `/api/v1`. |

## Server

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `HOST` | string | `0.0.0.0` | Bind address when you start the API with `python main.py`. The container image always binds `0.0.0.0`. |
| `PORT` | integer | `8000` | Listen port when you start the API with `python main.py`. The container image always listens on 8000. |
| `WORKERS` | integer | `2` | API worker processes. Each opens its own database pools, so keep `WORKERS × (DATABASE_POOL_SIZE + DATABASE_MAX_OVERFLOW)` well under the database connection limit. |
| `RELOAD` | boolean | `true` | Restart on code changes when you run `python main.py`, with one worker. Set `false` outside development. |

## Database

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | string | local development URL | Primary database URL. Schemes: `postgresql`, `postgres`, `mysql`, `mariadb`, `sqlite`, `mssql`, `oracle`, `mongodb`. Any other scheme stops start-up. |
| `DATABASE_POOL_SIZE` | integer | `20` | Connections each process keeps open per pool. Greater than 0. SQLite ignores it. |
| `DATABASE_MAX_OVERFLOW` | integer | `10` | Extra connections a pool may open under load. 0 or more. |
| `DATABASE_POOL_RECYCLE` | integer | `3600` | Seconds after which a pooled connection is replaced. Greater than 0. |
| `DATABASE_POOL_PRE_PING` | boolean | `true` | Test each pooled connection before use and replace dead ones. |
| `DATABASE_ECHO` | boolean | `false` | Log every SQL statement. Logs can hold learner data; use it for local debugging only. |
| `DATABASE_READ_REPLICA_URLS` | list | `[]` | Read-replica URLs. CMDX connects to them, but no request reads from them yet. |
| `MANAGED_DATABASE_URLS` | string | empty | Comma-separated URLs of extra databases to keep migrated. Not a JSON array. The container start-up migrates them and seeds default roles and an administrator. |
| `AUTO_SYNC_DATABASES` | boolean | `true` | Migrate and seed the `MANAGED_DATABASE_URLS` databases again when each API worker starts. |
| `DATABASE_ISOLATION_LEVEL` | string or empty | not set | Transaction isolation level, such as `READ COMMITTED` or `SERIALIZABLE`. Not set uses the database default. |

## Start-up

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `INSTALL_MODE` | boolean | `false` | Start for the installation wizard: create only the installer's tables, with no migrations or seed. Set `false` when installation completes. |
| `RUN_MIGRATIONS` | boolean | `true` | Run database migrations when the container starts. The start-up script accepts only `true` or `True`. |
| `RUN_SEED` | boolean | `true` | Seed default roles when the container starts, and a default administrator if the wizard hasn't run. The start-up script accepts only `true` or `True`. |
| `MIGRATE_ADOPT_EXISTING_SCHEMA` | boolean | `false` | Let migrations adopt a schema that was built without them, skipping data migrations in between. Use on empty or disposable databases only. |

## Redis, Celery and cache

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `REDIS_URL` | string | `redis://localhost:6379/0` | Redis for caching, rate limits and notification deduplication. If Redis is unreachable at start-up, the API runs without caching. |
| `REDIS_MAX_CONNECTIONS` | integer | `50` | Most connections in each process's Redis pool. |
| `CELERY_BROKER_URL` | string | local development URL | Message broker for background tasks, used by the API, the worker and beat. |
| `CELERY_RESULT_BACKEND` | string | `redis://localhost:6379/0` | Where Celery stores task states and results. |
| `CELERY_TASK_ALWAYS_EAGER` | boolean | `false` | Run background tasks inside the calling process instead of the broker. For development and tests only. |
| `CACHE_ENABLED` | boolean | `true` | `false` stops notification throttling and deduplication from using Redis. The main API cache ignores it. |

## DynamoDB

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `DYNAMODB_ENDPOINT_URL` | string or empty | not set | Turn DynamoDB on: the API connects and creates its tables at start-up. On AWS, set the regional endpoint URL. |
| `DYNAMODB_REGION` | string | `us-east-1` | AWS region of the DynamoDB client. |
| `DYNAMODB_ACCESS_KEY_ID` | string or empty | not set | DynamoDB access key. Not set uses the default AWS credential chain, such as an instance role. |
| `DYNAMODB_SECRET_ACCESS_KEY` | string or empty | not set | Secret. Key paired with `DYNAMODB_ACCESS_KEY_ID`. |
| `DYNAMODB_TABLE_PREFIX` | string | empty | Prefix added to every DynamoDB table name, such as `cmdx_`. |
| `DYNAMODB_MAX_POOL_CONNECTIONS` | integer | `50` | Most HTTP connections the DynamoDB client keeps open. Greater than 0. |
| `DYNAMODB_CONNECT_TIMEOUT` | float | `5.0` | Seconds to wait for a connection. Greater than 0. |
| `DYNAMODB_READ_TIMEOUT` | float | `10.0` | Seconds to wait for a response. Greater than 0. |

## Secrets and tokens

Several lifetimes here are fallbacks. When Site Admin has a security policy, its session timeout, Remember Me days and lockout settings apply instead.

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `SECRET_KEY` | string | Placeholder; production refuses to start with it | Secret. Signs tokens, session cookies, outbound webhook payloads and signed file URLs, and derives keys for stored credentials. Changing it signs everyone out and makes those stored credentials unreadable. |
| `VC_CONFIG_ENCRYPTION_KEY` | string or empty | not set | Secret. Encrypts stored video-conferencing integration settings. When not set, `SECRET_KEY` is used. Changing the key in use makes saved integrations unreadable. |
| `ALGORITHM` | string | `HS256` | Token signing algorithm. Keep an HMAC algorithm (`HS256`, `HS384` or `HS512`), because `SECRET_KEY` is a shared secret. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | integer | `30` | Access-token lifetime in minutes, used only when no Site Admin security policy loads. |
| `REFRESH_TOKEN_EXPIRE_DAYS` | integer | `7` | Refresh-token and session lifetime in days, used only when no Site Admin security policy loads. |
| `REMEMBER_ME_REFRESH_TOKEN_EXPIRE_DAYS` | integer | `30` | Session lifetime in days for a Remember Me sign-in, when Site Admin sets none. Clamped to 1–365. |
| `PASSWORD_RESET_TOKEN_EXPIRE_HOURS` | integer | `1` | How long a forgot-password link stays valid, in hours. |
| `ADMIN_INITIAL_PASSWORD_SET_TOKEN_EXPIRE_HOURS` | integer | `72` | How long the set-password link stays valid after an administrator creates an account, in hours. |
| `EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS` | integer | `24` | How long a verification link requested after sign-up stays valid, in hours. Links sent at sign-up use `EMAIL_VERIFICATION_TOKEN_TTL_HOURS`. |
| `INVITATION_TOKEN_EXPIRE_DAYS` | integer | `7` | How long an invitation link stays valid, in days. |
| `IMPERSONATION_TOKEN_EXPIRE_MINUTES` | integer | `30` | Access-token lifetime while an administrator impersonates a user, in minutes. |

## Site Admin encryption key

Secrets saved in Site Admin are encrypted with a 32-byte AES-256-GCM key. CMDX takes the key from the first source that is configured:

1. AWS KMS, when `SITE_ADMIN_KMS_KEY_ID` and `SITE_ADMIN_DEK_CIPHERTEXT` are both set.
2. HashiCorp Vault, when `SITE_ADMIN_VAULT_ADDR` and `SITE_ADMIN_VAULT_DEK_PATH` are both set.
3. `SITE_ADMIN_DEK`.
4. A key derived from `SECRET_KEY`, with a warning in the log.

A KMS or Vault error fails the operation; CMDX doesn't try the next source. The key is read on first use and kept until the process restarts.

:::warning
Production starts without any of the first three sources. CMDX then uses the key derived from `SECRET_KEY`, and changing `SECRET_KEY` makes every saved Site Admin secret unreadable. Set a dedicated key before you save secrets.
:::

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `SITE_ADMIN_DEK` | string or empty | not set | Secret. Base64 of the 32-byte key. Used when neither KMS nor Vault is configured. |
| `SITE_ADMIN_DEK_PREVIOUS` | string or empty | not set | Secret. Base64 of the previous key, tried after the current key when decrypting during a rotation. An invalid value is logged and ignored. |
| `SITE_ADMIN_KMS_KEY_ID` | string or empty | not set | AWS KMS key ID or ARN that decrypts `SITE_ADMIN_DEK_CIPHERTEXT`. KMS uses the default AWS credential chain and region. |
| `SITE_ADMIN_DEK_CIPHERTEXT` | string or empty | not set | Base64 KMS ciphertext of the 32-byte key. |
| `SITE_ADMIN_VAULT_ADDR` | string or empty | not set | Base URL of the HashiCorp Vault server that holds the key. |
| `SITE_ADMIN_VAULT_TOKEN` | string or empty | not set | Secret. Vault token sent with the key request. |
| `SITE_ADMIN_VAULT_DEK_PATH` | string or empty | not set | Vault path read with `GET /v1/<path>`. The response needs a `dek`, `value` or `plaintext` field holding the 32 bytes, raw or base64. |
| `SITE_ADMIN_KEY_ROTATION_ENABLED` | boolean | `false` | Lets the key rotation task re-encrypt stored secrets under the current key. Nothing schedules the task. <!-- TODO: verify how administrators start the rotation task --> |
| `SITE_ADMIN_AUDIT_RETENTION_ENABLED` | boolean | `true` | Schedule a job that deletes Site Admin audit entries older than the Site Admin retention period, 365 days unless changed. On by default. |
| `SITE_ADMIN_AUDIT_RETENTION_BEAT_INTERVAL_HOURS` | integer | `24` | How often that job runs, in hours, from 1 to 168. |

## URLs, tenancy and sign-in

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `FRONTEND_BASE_URL` | string | `http://localhost:5173` | Public origin of the web app, used in emailed links, export links and the redirect after social sign-in. Production refuses an empty or localhost value. |
| `ENABLE_MULTI_TENANCY` | boolean | `true` | Resolve the tenant of each request from the `X-Tenant-ID` header or the host's subdomain. |
| `DEFAULT_TENANT_DOMAIN` | string | `localhost` | Parent domain of tenant subdomains. A request to `acme.<domain>` selects the tenant whose slug is `acme`. |
| `OAUTH_MOBILE_CALLBACK_URL` | string | `expoapp://oauth/callback` | Deep link the mobile app receives after Google or GitHub sign-in. Start-up fails if it is empty. |
| `OAUTH_STATE_TTL_SECONDS` | integer | `300` | How long a Google or GitHub sign-in can take before its state expires, in seconds, from 1 to 600. |
| `OAUTH_EXCHANGE_CODE_TTL_SECONDS` | integer | `60` | How long the app has to exchange the one-time sign-in code for tokens, in seconds, from 1 to 120. |
| `GOOGLE_CLIENT_ID` | string | empty | Google OAuth client ID. Used only when the Google provider is on in Site Admin and its client ID is blank there. |
| `GOOGLE_CLIENT_SECRET` | string | empty | Secret. Google OAuth client secret, under the same rule. |
| `GITHUB_CLIENT_ID` | string | empty | GitHub OAuth client ID. Used only when the GitHub provider is on in Site Admin and its client ID is blank there. |
| `GITHUB_CLIENT_SECRET` | string | empty | Secret. GitHub OAuth client secret, under the same rule. |

Register these redirect URIs with the providers, using the public host of the API:

- Google: `https://<api-host>/api/v1/auth/google/callback`
- GitHub: `https://<api-host>/api/v1/auth/github/callback`

CMDX builds the redirect URI from the incoming request, so the scheme and host it sees must match the registered URI. <!-- TODO: verify behind a TLS-terminating proxy -->

## SCORM

In `same-origin` mode, the default, the LMS origin serves package files under the API with a strict Content Security Policy. In `isolated` mode, a separate host serves them, so package content can't reach the LMS APIs. For isolated mode, the two origins must use the same scheme, be different hosts sharing their last two domain labels (for example `lms.example.com` and `scorm.example.com`), and use HTTPS in production. Start-up fails when these rules aren't met.

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `SCORM_CONTENT_MODE` | string | `same-origin` | Where package files are served from: `same-origin` or `isolated`. Any other value stops start-up. |
| `SCORM_LMS_ORIGIN` | string | empty | Browser origin of the LMS play page, as `scheme://host`. Required in isolated mode. |
| `SCORM_CONTENT_ORIGIN` | string | empty | Origin that serves package files in isolated mode, as `scheme://host`. Required in isolated mode. |
| `SCORM_LAUNCH_TOKEN_EXPIRE_MINUTES` | integer | `5` | Lifetime of the launch token in the play-page URL, in minutes, from 1 to 15. |
| `SCORM_RUNTIME_TOKEN_EXPIRE_MINUTES` | integer | `120` | Lifetime of the player's runtime token for tracking calls, in minutes, from 1 to 180. |
| `SCORM_ASSET_SESSION_MINUTES` | integer | `120` | Lifetime of a learner's package-file session cookie, in minutes, from 1 to 120. |
| `SCORM_ALLOW_REMOTE_FONTS` | boolean | `false` | Let packages load Google Fonts. Off by default, because each font request sends the learner's IP address to Google. |
| `SCORM_ALLOW_REMOTE_MEDIA` | boolean | `true` | Let packages show images, audio, video and framed pages from any HTTPS host; those hosts see the learner's IP address. Set `false` to keep packages to their own files. |

## HTTP security

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `CORS_ORIGINS` | list | three localhost origins | Browser origins allowed to call the API, matched exactly on scheme, host and port. A CORS list saved in Site Admin replaces it. Default: `["http://localhost:5173", "http://localhost:3000", "http://localhost:8081"]`. |
| `CORS_ALLOW_CREDENTIALS` | boolean | `true` | Let browsers send cookies on cross-origin calls from allowed origins. |
| `TRUSTED_HOSTS` | list | `[]` | Host names the API accepts; wildcards such as `*.example.com` work. Any other `Host` header gets HTTP 400, health checks included, so list the host your health check uses. |
| `IP_ALLOWLIST` | list | `[]` | IP addresses or CIDR ranges allowed to reach the API. Others get HTTP 403, except on `/health`. Invalid entries are logged and skipped. |
| `IP_BLOCKLIST` | list | `[]` | IP addresses or CIDR ranges refused with HTTP 403. Invalid entries are logged and skipped. |
| `LOGIN_MAX_ATTEMPTS` | integer | `5` | Failed sign-ins allowed per client IP and email before lockout, when Site Admin sets none. |
| `LOGIN_LOCKOUT_SECONDS` | integer | `900` | Lockout length after too many failed sign-ins, in seconds, when Site Admin sets none. |
| `PHONE_DEFAULT_REGION` | string | `US` | Two-letter region used for phone numbers entered without a country code. Numbers are stored in E.164 format. |
| `PASSWORD_MIN_LENGTH` | integer | `8` | Minimum password length when no Site Admin password policy applies; at least 6. Account forms always require at least 8. |
| `PASSWORD_REQUIRE_UPPERCASE` | boolean | `true` | Require an uppercase letter when no Site Admin password policy applies. |
| `PASSWORD_REQUIRE_LOWERCASE` | boolean | `true` | Require a lowercase letter. Always applies; Site Admin has no matching setting. |
| `PASSWORD_REQUIRE_DIGIT` | boolean | `true` | Require a digit when the Site Admin password policy doesn't set this rule. |
| `PASSWORD_REQUIRE_SPECIAL` | boolean | `true` | Require a special character when no Site Admin password policy applies. |

## Rate limits

CMDX has no global request limit. Specific endpoints have limits fixed in code, such as sign-in, token refresh and password reset. The variables below set the counting method and the limits of two enrollment endpoint groups. A caller over a limit gets HTTP 429 with a `Retry-After` header.

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `RATE_LIMIT_ENABLED` | boolean | `true` | Endpoint rate limits, counted in Redis. |
| `RATE_LIMIT_STRATEGY` | string | `fixed_window` | Counting method: `fixed_window`, `sliding_window` or `token_bucket`. An unknown value falls back to `fixed_window` with a warning. |
| `RATE_LIMIT_EXCLUDE_PATHS` | list | five paths | Exact paths never counted against a limit. Only `token_bucket` reads it. Default: `["/health", "/", "/docs", "/redoc", "/openapi.json"]`. |
| `MULTI_ENROLLMENT_RATE_LIMIT` | string | `5/minute` | Limit on multi-enroll, bulk expiry update, remind and bulk revoke calls, per user, as `<count>/<period>`. |
| `BULK_ENROLLMENT_RATE_LIMIT` | string | `1/30second` | Limit on starting bulk enrollment jobs, per user. With `token_bucket`, use a period without a number, such as `2/minute`, or start-up fails. |
| `MAX_REPORT_SCHEDULES_PER_USER` | integer | `20` | Most report schedules one user can own in a tenant; at least 1. |

## Maintenance and diagnostics

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `MAINTENANCE_MODE` | boolean | `false` | Answer HTTP 503 to every request except health, docs, metrics and the maintenance endpoint. Super-administrators and bypass IPs still get through. |
| `MAINTENANCE_MESSAGE` | string | `The service is temporarily unavailable for maintenance. Please try again later.` | Message in the 503 response. A message saved in Site Admin takes precedence. |
| `MAINTENANCE_RETRY_AFTER` | integer | `3600` | Seconds sent in the `Retry-After` header of maintenance responses. A value saved in Site Admin takes precedence. |
| `MAINTENANCE_BYPASS_IPS` | list | `[]` | IP addresses or CIDR ranges that skip maintenance mode. Invalid entries are logged and skipped. |
| `BODY_LOGGING_ENABLED` | boolean | `false` | Log redacted JSON request and response bodies at `DEBUG` level. Bodies can hold personal data; turn it on only while debugging. |
| `BODY_LOGGING_MAX_BYTES` | integer | `8192` | Largest body logged, in bytes. Larger bodies are skipped and only their size is logged. |
| `METRICS_TOKEN` | string | empty | Secret. Bearer token required on `/metrics` when `ENABLE_PROMETHEUS` is `true`. While empty, anyone who can reach the API can read `/metrics`. |

## Storage, uploads and media

The storage provider for learning item files is set in Site Admin storage settings, not here. See [Storage](../configuration/storage.md).

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `STORAGE_BACKEND` | string | `local` | Keep `local`. Other values make report and personal-data exports fail. `s3` also sends audit exports and archives to `AWS_S3_BUCKET`. |
| `UPLOAD_DIR` | string | `/app/storage_uploads` | Directory for locally stored files, exports and audit archives. Mount a persistent volume here. |
| `MAX_UPLOAD_SIZE` | integer | `10485760` | Largest upload in bytes (10 MiB). Caps assignment file limits, and applies to file uploads when the tenant storage settings set no limit. |
| `BULK_CSV_MAX_UPLOAD_SIZE` | integer | `52428800` | Largest bulk enrollment CSV in bytes (50 MiB). |
| `AWS_ACCESS_KEY_ID` | string or empty | not set | AWS access key for S3 audit exports and the `ses` email provider. Not set uses the default AWS credential chain. |
| `AWS_SECRET_ACCESS_KEY` | string or empty | not set | Secret. Key paired with `AWS_ACCESS_KEY_ID`. |
| `AWS_S3_BUCKET` | string or empty | not set | Bucket for audit exports and archives. Required when `STORAGE_BACKEND` is `s3`. |
| `AWS_S3_REGION` | string | `us-east-1` | AWS region of the bucket and of SES email delivery. |
| `MEDIA_PLAYBACK_SESSION_TTL_SECONDS` | integer | `600` | Lifetime of a media playback session, in seconds. |
| `MEDIA_CHUNK_SIZE_BYTES` | integer | `5242880` | Chunk size for resumable media uploads, in bytes (5 MiB). |
| `MEDIA_MAX_PARALLEL_CHUNKS` | integer | `4` | Most chunks a client uploads at once in one media upload. At least 1. |
| `MEDIA_ALLOWED_EXTERNAL_DOMAINS` | list | 10 media hosts | Hosts allowed as external sources for media learning items; subdomains match. An empty list restores the default: `youtube.com`, `youtu.be`, `vimeo.com`, `mux.com`, `stream.mux.com`, `hls.com`, `soundcloud.com`, `w.soundcloud.com`, `spotify.com`, `open.spotify.com`. |
| `CLAMAV_ENABLED` | boolean | `false` | Scan uploaded files with ClamAV. When `false`, files are marked as not scanned and SCORM packages are refused. |
| `CLAMAV_HOST` | string | `clamav` | Host of the `clamd` service. |
| `CLAMAV_PORT` | integer | `3310` | TCP port of the `clamd` service. |
| `CLAMAV_MAX_SCAN_SIZE` | integer | `104857600` | Largest file sent for scanning, in bytes (100 MiB). Larger files aren't scanned, and larger SCORM packages are refused. |
| `ALLOWED_MIME_TYPES` | list | 11 types | MIME types allowed for assignment attachments and submissions, detected from file content. An assignment can narrow the list, not widen it. Default: JPEG, PNG, GIF, WebP, PDF, Word, Excel, plain text and CSV. |
| `MAX_IMAGE_WIDTH` | integer | `8192` | Widest image accepted for avatars, logos, branding and assignment images, in pixels. |
| `MAX_IMAGE_HEIGHT` | integer | `8192` | Tallest image accepted for the same uses, in pixels. |

## Plugins and hooks

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `ENABLE_PLUGINS` | boolean | `true` | Load enabled plugins in the API and the worker. When `false`, no plugin routes or hooks load. |
| `PLUGINS_DIR` | string | `plugins` | Folder scanned for plugins. A relative path resolves from the backend directory. |
| `ENABLE_HOOKS` | boolean | `true` | Run hook handlers. When `false`, every handler is skipped, including the core notification, audit and enrollment handlers. Leave it on. |
| `HOOK_HANDLER_TIMEOUT_SECONDS` | float | `30.0` | Seconds a plugin hook handler may run before it counts as failed. `0` removes the limit. Core handlers aren't timed. |

## Languages

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `I18N_ENABLED` | boolean | `true` | Pick each request's locale from `?lang=`, then the user's locale, then `Accept-Language`. When `false`, every response uses `DEFAULT_LOCALE`. |
| `DEFAULT_LOCALE` | string | `en` | Locale used when a request names no supported locale, and for background jobs. Include it in `SUPPORTED_LOCALES`. |
| `FALLBACK_LOCALE` | string | `en` | Locale searched when a translation is missing. If both miss, the API returns the translation key. |
| `SUPPORTED_LOCALES` | list | `["en", "es", "fr", "de"]` | Locales the API accepts. Each needs a folder of JSON files under `TRANSLATIONS_DIR`. |
| `TRANSLATIONS_DIR` | string | `core/i18n/locales` | Folder with one subfolder of translation files per locale. A relative path resolves from the backend directory. |

## Email

Values saved in the Site Admin SMTP settings override the `SMTP_*` variables for the real target: host, port, username, password, TLS flags, sender address and sender name. The variables act as fallbacks. In `mailpit` mode every email goes to the local catch-all, whatever `EMAIL_PROVIDER` says.

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `EMAIL_PROVIDER` | string | `smtp` | Outbound email provider: `smtp`, `sendgrid` or `ses`. Any other value stops start-up. `ses` uses `AWS_S3_REGION` and the `AWS_*` keys, or the default AWS credential chain. |
| `SENDGRID_API_KEY` | string | empty | Secret. API key used when `EMAIL_PROVIDER` is `sendgrid`. Start-up doesn't check it; each send fails while it is empty. |
| `EMAIL_DELIVERY_MODE` | string | `real` | Delivery targets: `mailpit` (local catch-all only), `real` (configured provider only) or `dual` (both must accept). Production accepts only `real`. |
| `SMTP_HOST` | string | empty | Real outbound SMTP server. When empty, CMDX uses `mailpit` outside production and `smtp.gmail.com` in production, so set it in production. |
| `SMTP_PORT` | integer | `0` | SMTP port; `0` means unset. Unset uses `1025` for `mailpit`, `mailhog`, `localhost` or `127.0.0.1`, and `587` for any other host. |
| `SMTP_USER` | string or empty | not set | SMTP username for the real target. Never sent to the local catch-all. |
| `SMTP_PASSWORD` | string or empty | not set | Secret. SMTP password for the real target. |
| `SMTP_FROM_EMAIL` | string | `noreply@example.com` | Sender address for SMTP, SendGrid and SES, and the domain of generated `Message-ID` headers. |
| `SMTP_FROM_NAME` | string | `LMS Framework` | Sender display name for every provider, including the local catch-all. |
| `SMTP_USE_TLS` | boolean | `true` | Use implicit TLS from the start of the connection, usually port 465. On port 587, CMDX uses STARTTLS instead. |
| `SMTP_START_TLS` | boolean | `false` | Upgrade a plain connection with STARTTLS, usually port 587. If both TLS flags are `true`, port 587 uses STARTTLS and other ports use implicit TLS. |
| `SMTP_LOCAL_HOST` | string | `mailpit` | Local catch-all SMTP server for `mailpit` and `dual` modes. Separate from `SMTP_HOST`. |
| `SMTP_LOCAL_PORT` | integer | `1025` | Local catch-all port. Port 1025 on a local host always uses a plain connection. |
| `SMTP_LOCAL_USE_TLS` | boolean | `false` | Use implicit TLS for the local catch-all. |
| `SMTP_LOCAL_START_TLS` | boolean | `false` | Use STARTTLS for the local catch-all. |
| `SMTP_LOCAL_FROM_EMAIL` | string | `noreply@cmdx.local` | Sender address for email sent to the local catch-all. |
| `EMAIL_VERIFICATION_BASE_URL` | string | `http://localhost:3000/verify-email` | Page that sign-up verification links point to; the token is added as a `token` query parameter. Must be an absolute `http://` or `https://` URL. |
| `EMAIL_VERIFICATION_TOKEN_TTL_HOURS` | integer | `24` | Lifetime of a verification token issued at sign-up, in hours, from 1 to 168. |

## Notification channels

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `NOTIFICATION_EMAIL_ENABLED` | boolean | `true` | Email channel for preference-based notifications. Security and invitation emails are sent either way. |
| `NOTIFICATION_PUSH_ENABLED` | boolean | `false` | Push channel. When `true`, API start-up fails unless `FIREBASE_CREDENTIALS_PATH` or all of `APNS_KEY_ID`, `APNS_TEAM_ID` and `APNS_KEY_PATH` are set. |
| `NOTIFICATION_SMS_ENABLED` | boolean | `false` | SMS channel. When `true`, API start-up fails unless the Twilio account SID, auth token and a sender number are set. |
| `NOTIFICATION_WHATSAPP_ENABLED` | boolean | `false` | WhatsApp channel. When `true`, API start-up fails unless the credentials for `WHATSAPP_PROVIDER` are set. |
| `NOTIFICATION_WEBHOOK_ENABLED` | boolean | `false` | Outbound webhook channel, which posts signed JSON payloads to recipient URLs. |
| `NOTIFICATION_WEBHOOK_ALLOWED_HOSTS` | list | `[]` | Hostnames the outbound webhook channel may reach even when they resolve to private addresses. Empty blocks every non-public destination. |
| `NOTIFICATION_TEMPLATES_DIR` | string | `modules/notifications/templates/defaults` | Directory of the default notification templates. A relative path resolves from the backend application root. |
| `NOTIFICATION_SSE_POLL_SECONDS` | integer | `5` | How often the API checks the unread count for each open real-time stream, in seconds, from 1 to 300. |
| `NOTIFICATION_UNSUBSCRIBE_BASE_URL` | string | empty | Absolute URL of the public unsubscribe page used in emails. Empty uses `FRONTEND_BASE_URL` followed by `/unsubscribe`. |

## Digests, quiet hours and throttling

Celery beat reads the `*_ENABLED` and `*_INTERVAL_*` values when it builds its schedule. Restart beat after changing them.

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `NOTIFICATION_DIGEST_ENABLED` | boolean | `true` | Schedule the digest flush job. When `false`, notifications routed to a digest stay queued and are never sent. |
| `NOTIFICATION_DIGEST_BEAT_INTERVAL_MINUTES` | integer | `5` | How often the digest flush runs, in minutes, from 1 to 1440. |
| `NOTIFICATION_DIGEST_PRIORITY_MAX` | string | `low` | Highest priority that can go into a digest: `low`, `normal` or `high`. Urgent notifications never do. |
| `NOTIFICATION_DIGEST_FLUSH_BATCH_SIZE` | integer | `50` | Most digest buckets one flush run processes, from 1 to 1000. The next run takes the rest. |
| `NOTIFICATION_DIGEST_WEEK_START_DAY` | integer | `0` | First day of a weekly digest, from `0` (Monday) to `6` (Sunday), at midnight in the recipient's timezone. |
| `NOTIFICATION_QUIET_HOURS_RELEASE_ENABLED` | boolean | `true` | Schedule the job that sends notifications held back during a recipient's quiet hours. When `false`, held notifications stay held. |
| `NOTIFICATION_QUIET_HOURS_BEAT_INTERVAL_MINUTES` | integer | `1` | How often the quiet-hours release runs, in minutes, from 1 to 60. |
| `NOTIFICATION_DEDUP_ENABLED` | boolean | `true` | Skip a notification when the recipient already got the same content on the same channel within the window. Needs Redis; skipped when Redis is down. |
| `NOTIFICATION_DEDUP_WINDOW_SEC` | integer | `300` | Deduplication window, in seconds, from 1 to 86400. |
| `NOTIFICATION_THROTTLE_ENABLED` | boolean | `true` | Drop notifications once a recipient reaches the limit for one event within the window. Needs Redis; skipped when Redis is down. |
| `NOTIFICATION_THROTTLE_WINDOW_SEC` | integer | `3600` | Default throttle window, in seconds, from 1 to 86400. A trigger's own throttle settings override it. |
| `NOTIFICATION_THROTTLE_MAX_COUNT` | integer | `50` | Default number of notifications for one event a recipient can get per window, from 1 to 100000. A trigger's own settings override it. |
| `NOTIFICATION_BROADCAST_BEAT_ENABLED` | boolean | `true` | Schedule the job that sends broadcasts when their scheduled time arrives. |
| `NOTIFICATION_BROADCAST_BEAT_INTERVAL_MINUTES` | integer | `1` | How often beat checks for due broadcasts, in minutes, from 1 to 1440. |
| `NOTIFICATION_BACKUP_ENABLED` | boolean | `true` | Schedule a job that exports the notification tables to a JSON file. |
| `NOTIFICATION_BACKUP_BEAT_INTERVAL_HOURS` | integer | `24` | How often the notification backup runs, in hours, from 1 to 168. |
| `NOTIFICATION_BACKUP_DIR` | string | `data/notification-backups` | Directory the Celery worker writes backups to, created if missing. A relative path resolves from the worker's working directory. The files hold personal data; use protected, persistent storage. |
| `STUCK_DELIVERY_SWEEP_ENABLED` | boolean | `true` | Schedule the hourly sweep that retries or fails stuck deliveries. The hourly interval is fixed. |
| `STUCK_DELIVERY_PENDING_MINUTES` | integer | `10` | How long a delivery can stay pending before the sweep queues it again, in minutes, from 1 to 1440. |
| `STUCK_DELIVERY_PROCESSING_MINUTES` | integer | `30` | How long a delivery or digest can stay processing before the sweep acts, in minutes, from 1 to 1440. |
| `STUCK_DELIVERY_SWEEP_BATCH_SIZE` | integer | `1000` | Most rows the stuck-delivery sweep and the quiet-hours release each load per run, from 1 to 100000. |

## SMS and WhatsApp

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `TWILIO_ACCOUNT_SID` | string | empty | Twilio account SID for SMS and Twilio WhatsApp. |
| `TWILIO_AUTH_TOKEN` | string | empty | Secret. Twilio auth token, used to send and to check Twilio status webhook signatures. |
| `TWILIO_FROM_NUMBER` | string | empty | SMS sender number. Takes precedence over `TWILIO_PHONE_NUMBER`. |
| `TWILIO_PHONE_NUMBER` | string | empty | Other name for the SMS sender, used when `TWILIO_FROM_NUMBER` is empty. |
| `TWILIO_WHATSAPP_FROM_NUMBER` | string | empty | Twilio WhatsApp sender, for example `whatsapp:+14155550100`. Fallback order: this, `TWILIO_WHATSAPP_NUMBER`, `TWILIO_FROM_NUMBER`, `TWILIO_PHONE_NUMBER`. |
| `TWILIO_WHATSAPP_NUMBER` | string | empty | Other name for the Twilio WhatsApp sender, used when `TWILIO_WHATSAPP_FROM_NUMBER` is empty. |
| `WHATSAPP_PROVIDER` | string | `twilio` | WhatsApp provider: `twilio` or `meta`. Any other value stops start-up. |
| `META_WHATSAPP_TOKEN` | string | empty | Secret. Meta WhatsApp Cloud API access token. Required when `WHATSAPP_PROVIDER` is `meta` and WhatsApp is on. |
| `META_WHATSAPP_PHONE_ID` | string | empty | Meta WhatsApp phone number ID that messages are sent from. Required with `meta`. |
| `META_VERIFY_TOKEN` | string | empty | Secret. Token Meta echoes back when it verifies the webhook subscription. Required when `WEBHOOK_META_WHATSAPP_ENABLED` is `true`. |
| `META_APP_SECRET` | string | empty | Secret. Meta app secret that checks status webhook signatures. While empty, every status update is rejected. |

## Push

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `FIREBASE_CREDENTIALS_PATH` | string | empty | Path to the Firebase service account JSON file for Android and web push. Loaded on the first push. |
| `FCM_WEBHOOK_SECRET` | string | empty | Secret. Shared HMAC-SHA256 secret that signs FCM delivery receipts. Required when `WEBHOOK_FCM_ENABLED` is `true`. |
| `APNS_KEY_ID` | string | empty | Key ID of the Apple Push Notification service signing key. |
| `APNS_TEAM_ID` | string | empty | Apple developer team ID. |
| `APNS_BUNDLE_ID` | string | empty | iOS app bundle ID that pushes are addressed to. Start-up doesn't check it; iOS pushes fail while it is empty. |
| `APNS_KEY_PATH` | string | empty | Path to the APNs `.p8` private key file. |
| `APNS_USE_SANDBOX` | boolean | `false` | Send iOS push through the APNs sandbox servers instead of production. |
| `APNS_WEBHOOK_SECRET` | string | empty | Secret. Shared HMAC-SHA256 secret that signs APNs delivery receipts. Required when `WEBHOOK_APNS_ENABLED` is `true`. |

## Delivery status webhooks

A turned-off webhook still answers with HTTP 200 and an `ignored` response, so providers don't retry, and changes no delivery status.

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `WEBHOOK_SES_SNS_ENABLED` | boolean | `false` | Accept Amazon SNS notifications for SES deliveries, bounces and complaints. CMDX checks SNS signatures and confirms subscriptions. |
| `WEBHOOK_SNS_ALLOWED_TOPIC_ARNS` | string | empty | Comma-separated SNS topic ARNs to accept. Not a JSON array. While empty, every SNS notification is rejected. |
| `WEBHOOK_TWILIO_STATUS_ENABLED` | boolean | `false` | Accept Twilio SMS and WhatsApp status callbacks, checked with `TWILIO_AUTH_TOKEN`. Start-up requires the token when this is `true`. |
| `WEBHOOK_META_WHATSAPP_ENABLED` | boolean | `false` | Accept Meta WhatsApp status updates, checked with `META_APP_SECRET`. |
| `WEBHOOK_SENDGRID_EVENTS_ENABLED` | boolean | `false` | Accept SendGrid Event Webhook delivery events. While the verification key is empty, requests get HTTP 503. |
| `SENDGRID_EVENT_WEBHOOK_VERIFICATION_KEY` | string | empty | SendGrid Event Webhook verification public key, as full PEM or its base64 body. |
| `SENDGRID_WEBHOOK_TIMESTAMP_MAX_SKEW_SECONDS` | integer | `600` | Reject SendGrid events signed more than this many seconds from server time, from 0 to 86400. `0` turns the check off. |
| `WEBHOOK_FCM_ENABLED` | boolean | `false` | Accept FCM delivery receipts, checked with `FCM_WEBHOOK_SECRET`. |
| `WEBHOOK_APNS_ENABLED` | boolean | `false` | Accept APNs delivery receipts, checked with `APNS_WEBHOOK_SECRET`. |
| `WEBHOOK_TIMESTAMP_MAX_SKEW_SECONDS` | integer | `300` | Reject signed FCM and APNs receipts more than this many seconds from server time, from 0 to 86400. `0` turns the check off. Applies only when the receipt carries a timestamp. |

## Enrollment jobs

These jobs run on the Celery worker on a Celery beat schedule. A `*_ENABLED` value of `false` leaves the job out of the schedule. Beat reads these values when it starts; restart beat after changing them.

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `GROUP_SYNC_RECONCILIATION_ENABLED` | boolean | `true` | Schedule group-sync reconciliation, which compares external provider membership with group membership and applies the differences. |
| `GROUP_SYNC_RECONCILIATION_BEAT_INTERVAL_MINUTES` | integer | `60` | How often reconciliation runs, in minutes, from 1 to 1440. |
| `GROUP_SYNC_RECONCILIATION_MAX_RETRIES` | integer | `3` | Retries after a failed reconciliation run, from 0 to 20. |
| `GROUP_SYNC_RECONCILIATION_RETRY_DELAY_SECONDS` | integer | `60` | Wait before each retry, in seconds, from 1 to 3600. |
| `ENROLLMENT_RULE_BACKFILL_ENABLED` | boolean | `true` | Schedule the rule backfill, which applies enabled enrollment rules to existing users. |
| `ENROLLMENT_RULE_BACKFILL_BEAT_INTERVAL_HOURS` | integer | `24` | How often the backfill runs, in hours, from 1 to 168. |
| `ENROLLMENT_RULE_BACKFILL_MAX_RETRIES` | integer | `3` | Retries after a failed backfill, scheduled or for a single rule, from 0 to 20. |
| `ENROLLMENT_RULE_BACKFILL_RETRY_DELAY_SECONDS` | integer | `60` | Wait before each backfill retry, in seconds, from 1 to 3600. |
| `ENROLLMENT_KEY_BATCH_MAX_COUNT` | integer | `1000` | Most enrollment keys one batch request can create, from 1 to 100000. Larger requests fail validation. |
| `ENROLLMENT_KEY_CLEANUP_ENABLED` | boolean | `true` | Schedule key cleanup, which expires keys past their end date and removes stale batch exports and old redemption attempts. |
| `ENROLLMENT_KEY_CLEANUP_BEAT_INTERVAL_HOURS` | integer | `24` | How often key cleanup runs, in hours, from 1 to 168. |
| `ENROLLMENT_KEY_CLEANUP_MAX_RETRIES` | integer | `3` | Retries after a failed cleanup, from 0 to 20. |
| `ENROLLMENT_KEY_CLEANUP_RETRY_DELAY_SECONDS` | integer | `60` | Wait before each cleanup retry, in seconds, from 1 to 3600. |
| `ENROLLMENT_EXPIRY_ENABLED` | boolean | `true` | Schedule enrollment expiry, which marks active and pending enrollments past their expiry date as expired, in every tenant. |
| `ENROLLMENT_EXPIRY_BEAT_INTERVAL_HOURS` | integer | `1` | How often expiry runs, in hours, from 1 to 168. |
| `ENROLLMENT_EXPIRY_MAX_RETRIES` | integer | `3` | Retries after a failed expiry run, from 0 to 20. |
| `ENROLLMENT_EXPIRY_RETRY_DELAY_SECONDS` | integer | `60` | Wait before each expiry retry, in seconds, from 1 to 3600. |
| `BULK_ENROLLMENT_STALE_RECOVERY_ENABLED` | boolean | `true` | Schedule recovery of bulk enrollment jobs stuck pending or running for more than 30 minutes; they are marked failed. |
| `BULK_ENROLLMENT_STALE_RECOVERY_BEAT_INTERVAL_MINUTES` | integer | `15` | How often recovery runs, in minutes, from 1 to 1440. Keep it under 30. |
| `BULK_ENROLLMENT_STALE_RECOVERY_MAX_RETRIES` | integer | `3` | Retries after a failed recovery run, from 0 to 20. |
| `BULK_ENROLLMENT_STALE_RECOVERY_RETRY_DELAY_SECONDS` | integer | `60` | Wait before each recovery retry, in seconds, from 1 to 3600. |
| `EXPIRE_COURSE_ENROLLMENTS_ENABLED` | boolean | `false` | Older form of the expiry job: the same pass, hourly, with no retries. Leave it off. Beat refuses to start if this and `ENROLLMENT_EXPIRY_ENABLED` are both `true`. |

## Audit log

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `AUDIT_BUFFER_SIZE` | integer | `1000` | Audit records the API holds in memory before writers wait for space. Greater than 0. |
| `AUDIT_FLUSH_INTERVAL_SEC` | float | `2.0` | How long the buffer waits for a new record before sending a partial batch to the Celery worker, in seconds. Greater than 0. |
| `AUDIT_BATCH_SIZE` | integer | `100` | Audit records sent to the Celery worker in one write task. Greater than 0. |
| `AUDIT_EXPORT_MAX_RECORDS` | integer | `100000` | Most records one audit export can hold. A larger export fails. |
| `AUDIT_RETENTION_SWEEP_ENABLED` | boolean | `true` | Schedule the audit retention sweep, which deletes audit, activity, event and error log rows older than each enabled retention policy allows. |
| `AUDIT_RETENTION_SWEEP_INTERVAL_MINUTES` | integer | `60` | How often the sweep runs, in minutes. Greater than 0. |
| `AUDIT_RETENTION_BATCH_SIZE` | integer | `500` | Rows the sweep fetches and deletes per batch. Greater than 0. |
| `AUDIT_RETENTION_MAX_ROWS_PER_RUN` | integer | `50000` | Most rows one run deletes for each policy. `0` removes the cap. |
| `AUDIT_RETENTION_ARCHIVE_ENABLED` | boolean | `false` | Archive rows to the configured storage before deleting them, for every policy. A policy or the audit settings can also turn archiving on. |
| `AUDIT_RETENTION_DEFAULT_DAYS` | integer | `365` | Retention window used by the default pass, in days. Greater than 0. |
| `AUDIT_RETENTION_DEFAULT_PASS_ENABLED` | boolean | `false` | Apply `AUDIT_RETENTION_DEFAULT_DAYS` to every tenant and log stream with no enabled retention policy. This deletes rows across all tenants. |
| `AUDIT_ERROR_SPIKE_ENABLED` | boolean | `true` | Schedule the error-spike check, which alerts when error log rows across all tenants reach the threshold. |
| `AUDIT_ERROR_SPIKE_THRESHOLD` | integer | `50` | Error log rows within the window that trigger an alert. A threshold saved in the audit settings overrides it. |
| `AUDIT_ERROR_SPIKE_WINDOW_MINUTES` | integer | `5` | Window the check counts errors over, in minutes. A window saved in the audit settings overrides it. |
| `AUDIT_ERROR_SPIKE_INTERVAL_MINUTES` | integer | `5` | How often the check runs, in minutes. |
| `AUDIT_ERROR_SPIKE_COOLDOWN_MINUTES` | integer | `15` | No new alert is sent within this many minutes of the last one. |
| `AUDIT_ERROR_SPIKE_LEVELS` | list | `["error", "critical"]` | Log levels that count toward a spike. An empty list counts every level. |
| `AUDIT_ERROR_SPIKE_RECIPIENT_IDS` | list | `[]` | User IDs that receive spike alerts. When empty, every active user with the admin or auditor role receives them. |

## Personal-data retention and legal

The retention sweep and automatic account deletion are off by default. The first run of each acts on everything already past its window: the sweep deletes every expired row, one statement per table, and automatic deletion runs every overdue pending request. The default windows are starting values, not a recommendation; set them from your own retention policy before you turn the sweep on.

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `RETENTION_SWEEP_ENABLED` | boolean | `false` | Schedule the personal-data retention sweep. |
| `RETENTION_SWEEP_INTERVAL_HOURS` | integer | `24` | How often the sweep and automatic account deletion run, in hours, from 1 to 168. |
| `RETENTION_REFRESH_TOKEN_DAYS` | integer | `30` | Delete refresh tokens this many days after they expire. `0` keeps them. |
| `RETENTION_USER_AUDIT_EVENT_DAYS` | integer | `365` | Delete user account audit events older than this many days. `0` keeps them. |
| `RETENTION_ADMIN_AUDIT_LOG_DAYS` | integer | `365` | Delete administrator audit log entries older than this many days. `0` keeps them. |
| `RETENTION_NOTIFICATION_AUDIT_DAYS` | integer | `365` | Delete notification audit log entries older than this many days. `0` keeps them. |
| `RETENTION_NOTIFICATION_DAYS` | integer | `365` | Delete notifications older than this many days. `0` keeps them. |
| `RETENTION_NOTIFICATION_DELIVERY_DAYS` | integer | `90` | Delete notification delivery records older than this many days. `0` keeps them. |
| `RETENTION_AI_REQUEST_LOG_DAYS` | integer | `90` | Delete AI request logs older than this many days. `0` keeps them. |
| `RETENTION_AI_TUTOR_DAYS` | integer | `180` | Delete AI tutor messages older than this many days, and conversations not updated in that time. `0` keeps them. |
| `RETENTION_URL_VISIT_DAYS` | integer | `90` | Delete visit records of URL learning items older than this many days. `0` keeps them. |
| `RETENTION_DELETE_REQUEST_DAYS` | integer | `365` | Delete processed account-deletion requests this many days after processing. Pending requests are never deleted. `0` keeps them. |
| `ACCOUNT_DELETION_AUTO_EXECUTE` | boolean | `false` | Schedule a job that approves and runs every pending account-deletion request older than the grace period. Scheduled whether or not the sweep is on. |
| `ACCOUNT_DELETION_GRACE_DAYS` | integer | `30` | Review window for account-deletion requests, in days, from 0 to 30. `0` makes requests due at once. |
| `TERMS_URL` | string or empty | not set | Terms of service link shown at sign-up. When this or `PRIVACY_POLICY_URL` is set, self-registration requires accepting the terms. |
| `PRIVACY_POLICY_URL` | string or empty | not set | Privacy policy link shown at sign-up. When both URLs are empty, no consent is recorded. |
| `TERMS_VERSION` | string | `2026-10` | Terms version recorded on each consent event. |
| `PRIVACY_POLICY_VERSION` | string | `2026-10` | Privacy policy version recorded on each consent event. |

## AI

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `ENABLE_AI` | boolean | `true` | AI features for every tenant. When `false`, AI endpoints return `503` and AI calls fail. |
| `AI_DEFAULT_TIMEOUT_SECONDS` | integer | `60` | Timeout for AI provider calls and connection tests, in seconds, when neither the feature nor the provider sets one. |
| `AI_MAX_OUTPUT_TOKENS` | integer | `1024` | Response token limit when neither the feature nor the provider sets one. Some features have higher built-in limits. |
| `AI_BLOCKED_PROVIDER_TYPES` | list | `["deepseek"]` | AI provider types that never receive data. Administrators can't save such providers, existing ones fail, and OpenAI-compatible providers pointing at their domains are rejected. |
| `FEATURE_AI_CHECK` | boolean | `false` | AI checks of assignment submissions. When `false`, each requested check is recorded as skipped. |
| `AI_CHECK_PROVIDER` | string | `internal` | Provider name recorded on an AI check result when the response doesn't supply one. Doesn't choose the provider. |
| `AI_CHECK_MODEL` | string | `internal-detector-v1` | Model name recorded on an AI check result when the response doesn't supply one. Doesn't choose the model. |

`AI_BLOCKED_PROVIDER_TYPES` is the one list that also accepts a comma-separated string. Values ignore case. The provider types are `openai_compatible`, `anthropic`, `gemini`, `azure_openai` and `deepseek`. An empty value blocks nothing.

## Monitoring

Sentry and OpenTelemetry start in the API process only; Celery workers don't report to them. For the logging variables, see [Logging](../../developers/architecture/logging.md).

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `SENTRY_DSN` | string or empty | not set | Secret. Sentry project DSN. Sentry is off while it is empty. |
| `SENTRY_ENVIRONMENT` | string | `development` | Environment name sent with Sentry events. |
| `SENTRY_SAMPLE_RATE` | float | `0.1` | Fraction of errors sent to Sentry, from 0.0 to 1.0. |
| `SENTRY_TRACES_SAMPLE_RATE` | float | `0.1` | Fraction of transactions sent to Sentry as traces, from 0.0 to 1.0. |
| `ENABLE_PROMETHEUS` | boolean | `false` | Serve request metrics at `/metrics` on the API. Set `METRICS_TOKEN` to require a bearer token. |
| `OTEL_ENABLED` | boolean | `false` | OpenTelemetry tracing. A value saved in the audit settings overrides it at start-up. |
| `OTEL_SERVICE_NAME` | string | `lms-framework` | Service name on every exported trace. |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | string | `http://localhost:4317` | OTLP collector address. A value saved in the audit settings overrides it at start-up. |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | string | `grpc` | `grpc` exports over gRPC without TLS. Any other value exports over HTTP and adds `/v1/traces` to the endpoint. |
| `OTEL_TRACE_SAMPLE_RATE` | float | `1.0` | Fraction of requests traced, clamped to 0.0–1.0. `0` counts as `1.0`; to trace nothing, set `OTEL_ENABLED` to `false`. |

## Variables read outside the settings loader

CMDX reads these from the process environment only. A value in a `.env` file doesn't reach them; set them in the container environment.

| Variable | Type | Default | Description |
| --- | --- | --- | --- |
| `EXTERNAL_PLUGINS_DIRS` | string | not set | Colon-separated absolute paths of more plugin folders, scanned after `PLUGINS_DIR`. Read by the API and the worker. |
| `URL_RESOURCE_ALLOW_PRIVATE_URLS` | boolean | `false` | Let URL learning items fetch link details from private IP addresses. Accepts `1`, `true` or `yes`. `localhost` and cloud metadata hosts stay blocked. |
| `CALENDAR_ENABLED` | boolean | not set | Deployment default of the calendar feature flag. A stored tenant or global value takes precedence. See [Feature flags](../../developers/architecture/feature-flags.md). |
| `OPENSSL_FORCE_FIPS_MODE` | string | not set | `1` makes the image's OpenSSL enforce FIPS mode without a FIPS kernel. For testing; production FIPS comes from the host kernel. |
| `CELERY_WORKER_PROCESS` | boolean | not set | Overrides detection of a Celery worker. Leave it unset. |

## Accepted but not used

Nothing in this release reads these variables. Setting them has no effect.

- **Settings fields:** `ALLOWED_DOCUMENT_EXTENSIONS`, `ALLOWED_IMAGE_EXTENSIONS`, `ANALYTICS_SNAPSHOT_ENABLED`, `AUTO_LOAD_PLUGINS`, `CACHE_TTL`, `CERTIFICATE_NUMBER_PREFIX`, `CERTIFICATE_PDF_ENABLED`, `DATABASE_CIRCUIT_BREAKER_THRESHOLD`, `DATABASE_CIRCUIT_BREAKER_TIMEOUT`, `DATABASE_RETRY_ATTEMPTS`, `DATABASE_RETRY_DELAY`, `ELASTICSEARCH_INDEX_PREFIX`, `ELASTICSEARCH_URL`, `EMAIL_CHECK_DELIVERABILITY`, `ENROLLMENT_KEY_BATCH_EXPORT_TTL_HOURS`, `ENROLLMENT_KEY_CODE_COLLISION_MAX_RETRIES`, `ENROLLMENT_KEY_MAX_FAILED_ATTEMPTS`, `MEDIA_TELEMETRY_RETENTION_DAYS`, `NOTIFICATION_DIGEST_HOURLY_WINDOW_MINUTES`, `NOTIFICATION_DIGEST_INTERVAL_MINUTES`, `OAUTH_REDIRECT_BASE_URL`, `OTEL_LOGS_EXPORT`, `RATE_LIMIT_PER_HOUR`, `RATE_LIMIT_PER_MINUTE`, `SITE_ADMIN_PRIMARY`, `SITE_SETTINGS_AUDIT_RETENTION_BEAT_INTERVAL_HOURS`, `SITE_SETTINGS_AUDIT_RETENTION_ENABLED`, `TEST_DATABASE_URL`, `WS_HEARTBEAT_INTERVAL`, `WS_MAX_CONNECTIONS`. CMDX still checks their type and range at start-up.
- **Names in the example `.env` files:** `AWS_S3_ENDPOINT_URL`, `AZURE_STORAGE_CONNECTION_STRING`, `AZURE_STORAGE_CONTAINER`, `CELERY_ACCEPT_CONTENT`, `CELERY_RESULT_SERIALIZER`, `CELERY_TASK_SERIALIZER`, `FEATURE_ANALYTICS`, `FEATURE_CERTIFICATES`, `FEATURE_FORUMS`, `FEATURE_GAMIFICATION`, `FEATURE_VIDEO_CONFERENCING`, `GCS_BUCKET_NAME`, `GCS_PROJECT_ID`, `GITHUB_REDIRECT_URI`, `GOOGLE_APPLICATION_CREDENTIALS`, `GOOGLE_REDIRECT_URI`, `LDAP_BIND_DN`, `LDAP_BIND_PASSWORD`, `LDAP_SERVER`, `LDAP_USER_BASE_DN`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_REDIRECT_URI`, `SAML_CERTIFICATE_FILE`, `SAML_IDP_ENTITY_ID`, `SAML_IDP_URL`, `SAML_PRIVATE_KEY_FILE`, `SAML_SP_ENTITY_ID`.

## Related

- [Configuration](../../developers/architecture/config-service.md): settings stored in the database and changed at run time
- [Logging](../../developers/architecture/logging.md): log format, redaction and the developer settings for logging
- [Feature flags](../../developers/architecture/feature-flags.md)
- [Install with Docker Compose](docker-compose.md)
- [Install for production](production.md)
