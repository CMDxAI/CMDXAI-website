---
id: production
title: Install for production
sidebar_label: Production
sidebar_position: 3
doc_type: how-to
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [install]
---

Deploy CMDX for production use. This page starts from a working [Docker Compose install](./docker-compose.md) and hardens it: sizing, production mode, secrets, TLS, ports, antivirus, automatic updates and backups.

Change `.env` on the host, then recreate the containers. A plain `docker compose restart` doesn't read `.env` again. To apply a change safely, follow [apply a change to a running host](#apply-a-change-to-a-running-host).

## Steps

### Size the connection budget

Every uvicorn worker and every Celery child process opens its own database pool. Together they must fit inside PostgreSQL's connection limit:

```text
  WORKERS            × (DATABASE_POOL_SIZE + DATABASE_MAX_OVERFLOW)
+ CELERY_CONCURRENCY × (5 + 5)
+ 1 for Celery beat  × (5 + 5)
≤ POSTGRES_MAX_CONNECTIONS, less about 3 reserved for the superuser
```

The Compose file fixes the Celery pool at `5 + 5`. For a host with 4 vCPU and 7 GB of RAM, these values use 170 of 200 connections:

| Key | Value | Why |
| --- | --- | --- |
| `WORKERS` | `4` | One for each vCPU |
| `DATABASE_POOL_SIZE` | `20` | Per API worker |
| `DATABASE_MAX_OVERFLOW` | `10` | Per API worker, so 120 in total |
| `CELERY_CONCURRENCY` | `4` | Set this explicitly. Otherwise Celery uses the CPU count, so resizing the host changes the demand on the database. |
| `POSTGRES_MAX_CONNECTIONS` | `200` | The total every pool shares |

Don't raise `WORKERS` without doing this sum. When the pools run out, requests hang for 30 seconds and then fail with `QueuePool limit ... reached`.

### Pin the image version

By default, `CMDX_IMAGE_TAG` is `main`, which follows every merge. Pin production to a release when one exists. See [choose an image tag](./upgrade.md#choose-an-image-tag).

### Turn on production mode

`docker-compose.yml` sets `ENVIRONMENT: development` for the app containers, and that wins over `.env`. Setting `ENVIRONMENT=production` in `.env` has no effect.

To change it, add a second Compose file. Create `docker-compose.production.yml` in the `cmdx-LMS` folder:

```yaml title="docker-compose.production.yml"
services:
  backend:
    environment:
      ENVIRONMENT: production
  celery_worker:
    environment:
      ENVIRONMENT: production
  celery_beat:
    environment:
      ENVIRONMENT: production
```

From now on, name both files in every Compose command on this host:

```bash
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d
```

The commands in this guide show only the first file. If you leave out the second, `up -d` recreates the containers in development mode.

<!-- TODO: verify: run this file on a staging host. Nothing on this page was run live. -->

In production mode, CMDX refuses to start with:

- the literal `SECRET_KEY` value `change-this-secret-key`
- a missing `FRONTEND_BASE_URL`, or one that points at `localhost`
- an `EMAIL_DELIVERY_MODE` other than `real`

It also changes how it runs:

| Area | In production mode |
| --- | --- |
| Debug output | `DEBUG` is forced off, so errors don't show raw exception text. |
| API docs | `/docs`, `/redoc` and `/openapi.json` are switched off. |
| Sign-in cookie | The refresh cookie is marked `Secure`, so it needs HTTPS. |
| Test routes | The testing API routes aren't mounted. |
| SMTP | With no `SMTP_HOST`, CMDX falls back to `smtp.gmail.com`. Set a real host. |
| Install wizard | The Base URL must not be `localhost`. |

Before you switch, set `EMAIL_DELIVERY_MODE=real` and a public `FRONTEND_BASE_URL`, or the containers won't start.

### Set your secrets

| Key | What to do |
| --- | --- |
| `SECRET_KEY` | Use a random value of at least 32 bytes. Don't reuse the value from `.env.example`: the check above catches only one literal value. |
| `SITE_ADMIN_DEK` | Set this before you save any secret in the app. It encrypts SMTP passwords, storage keys and provider secrets. See [manage secrets and encryption keys](./secrets-and-encryption-keys.md). |
| `POSTGRES_PASSWORD` | Don't keep the default `cmdx`. |
| `GHCR_TOKEN` | Use a token with `read:packages` only. |

Generate `SITE_ADMIN_DEK` with:

```bash
python3 -c "import base64,secrets;print(base64.b64encode(secrets.token_bytes(32)).decode())"
```

Without `SITE_ADMIN_DEK`, CMDX derives the encryption key from `SECRET_KEY`, and logs a warning. Changing `SECRET_KEY` then makes every stored secret unreadable. AWS KMS and HashiCorp Vault are also supported. See [keep your keys](#keep-your-keys).

### Keep your keys

Keep `.env` out of version control, and readable only by the operator. Keep a copy of your keys apart from your backups: without them, a restored database can't read its stored secrets.

### Turn on TLS

Use one of these. Both end with the web app and the API on one address, so you don't need CORS settings.

### With Caddy

Caddy comes with the Compose file. It gets and renews a certificate by itself.

1. Point a DNS `A` record at the host. Do this first: Let's Encrypt allows five failed attempts per hostname per hour, and a name that doesn't resolve uses one up.
2. Check that the name resolves from several public resolvers:

   ```bash
   dig +short lms.example.com @8.8.8.8
   dig +short lms.example.com @1.1.1.1
   ```

3. Add these lines to `.env`:

   ```bash
   COMPOSE_PROFILES=edge
   CADDY_DOMAIN=lms.example.com
   ```

4. Start Caddy:

   ```bash
   docker compose -f docker-compose.yml up -d caddy
   ```

5. Watch it get the certificate:

   ```bash
   docker compose -f docker-compose.yml logs -f caddy
   ```

Certificates live on the `caddy_data` volume. Keep that volume, or the next start has to request a new certificate.

### With a proxy you already run

Point your proxy at the published web app port:

```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host              $host;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 20M;
}
```

Don't add `Access-Control-*` headers. The API sets its own, and duplicates make browsers reject the request.

### Close the ports

Set these in `.env`, so that only the proxy is public:

```bash
BACKEND_PUBLISH=127.0.0.1:8000
FRONTEND_PUBLISH=127.0.0.1:8080
```

If another host must reach PostgreSQL, give it a private address, such as `POSTGRES_PUBLISH=10.122.0.2:5432`. Never use a bare port: `5432` alone binds every interface.

To reach a loopback service from your laptop, use an SSH tunnel:

```bash
ssh -L 5432:127.0.0.1:5432 <user>@<host>
```

RabbitMQ uses the default `guest` account and Mailpit accepts any mail, so keep both on loopback. Don't use Mailpit in production. [Configure a real SMTP server](../configuration/email.md).

### Turn on antivirus

ClamAV is off by default. SCORM packages can't be published without it, because CMDX won't extract an unscanned package.

Set these in `.env`, keeping any profile you already use, then run `docker compose up -d`:

```bash
CLAMAV_ENABLED=true
COMPOSE_PROFILES=edge,antivirus
```

The first start downloads the full signature set, and ClamAV uses about 1 GB of memory. See [file storage](../configuration/storage.md#scan-uploads-for-viruses).

### Set the security policy

Sign in as the Super Administrator and open **Settings** > **Security**:

- Turn on **Require MFA for admins**. Enroll your own account first, or you may lock yourself out.
- Set the password rules, the session lifetime and the lockout rules your organization needs.
- Under **IP allowlist**, list your addresses if you want to limit where people sign in from.

### Decide on automatic updates

The `watchtower` service checks the registry every 3 hours and replaces the app containers when their tag moves. It needs the Docker socket, which gives it root-level access to the host. If that isn't acceptable, turn it off:

```bash
docker compose -f docker-compose.yml up -d --scale watchtower=0
```

If you keep it, set `GHCR_USERNAME` and `GHCR_TOKEN` in `.env`, and pin a tag. See [upgrade CMDX](./upgrade.md#automatic-updates).

### Set up backups

CMDX doesn't back up itself. You need copies of three things:

| What | Where |
| --- | --- |
| Database | The `postgres_data` volume. Use `pg_dump`. |
| Uploads | The `cmdx_storage` volume |
| Configuration | `.env` and `docker-compose.production.yml` |

The commands are in [back up and restore CMDX](./backup-and-restore.md). Schedule them on the host, and copy the results off the host. Try a restore before you rely on them.

### Review data retention

Two jobs delete personal data, and both are off until you turn them on. Review the retention windows first, because the first run deletes every row past its window.

| Key | What it does |
| --- | --- |
| `RETENTION_SWEEP_ENABLED` | Deletes old rows, using the `RETENTION_*` windows |
| `ACCOUNT_DELETION_AUTO_EXECUTE` | Carries out account deletion requests after `ACCOUNT_DELETION_GRACE_DAYS` |

Set `TERMS_URL` and `PRIVACY_POLICY_URL` so the sign-up pages can link to your legal documents.

## Verify

```bash
docker inspect cmdx_backend --format 'restarts={{.RestartCount}} health={{.State.Health.Status}}'
docker exec cmdx_postgres psql -U cmdx -d cmdx -tAc 'show max_connections'
curl -s https://lms.example.com/health
docker logs cmdx_backend --since 24h 2>&1 | grep -c 'QueuePool limit'
```

Replace `cmdx` in the second command if you changed `POSTGRES_USER` or `POSTGRES_DB`. `/health` reports `"environment":"production"`. The last command should print `0`, and should keep doing so.

## Values Compose sets for you

`docker-compose.yml` sets these for the app containers. They win over `.env`, so changing them there has no effect. To change one, add it to `docker-compose.production.yml`.

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

## Run on a FIPS host

CMDX supports FIPS deployments on `linux/amd64` and `linux/arm64`. The backend image uses the system OpenSSL, whose FIPS provider is the validated module. The host supplies FIPS mode, with the kernel option `fips=1`.

To check an image, force FIPS on its OpenSSL and run the probe. `OPENSSL_FORCE_FIPS_MODE` is for this probe only, so don't set it on running services:

```bash
docker compose -f docker-compose.yml run --rm --no-deps -T -e OPENSSL_FORCE_FIPS_MODE=1 \
  --entrypoint python backend -m scripts.fips_check --with-services
```

The output must end with `0 failed`.

Two settings outside CMDX matter too:

- Use SCRAM-SHA-256 for PostgreSQL passwords, not `md5`.
- Don't use NTLM for LDAP binds.

CMDX sends traces to Jaeger without TLS. If you send traces across a network, consider what that means for your FIPS boundary.

## Apply a change to a running host

1. Back up `.env` and `docker-compose.yml`.
2. Edit `.env` before you touch the Compose file. Host-specific values live in `.env`, so a bind can silently revert if the value isn't set first.
3. Validate the result. This command resolves every variable and catches mistakes before any container changes:

   ```bash
   docker compose -f docker-compose.yml config > /tmp/resolved.yml && echo OK
   ```

4. Recreate the services you changed. Include `postgres` only if `POSTGRES_MAX_CONNECTIONS` changed, which causes a short outage:

   ```bash
   docker compose -f docker-compose.yml up -d --force-recreate backend celery_worker celery_beat
   ```

:::warning
The app services use `pull_policy: always`, so a recreate also pulls the newest image for your tag. On a moving tag such as `main`, a change of configuration can also update the app, and migrations then run on start. Pin the tag first if you want the two to move separately.
:::

## Related

- [Upgrade CMDX](./upgrade.md)
- [Back up and restore CMDX](./backup-and-restore.md)
- [Monitor CMDX](../operations/monitoring.md)
- [Troubleshoot an install](../operations/troubleshooting.md)
