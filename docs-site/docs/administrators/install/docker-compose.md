---
id: docker-compose
title: Install with Docker Compose
sidebar_label: Docker Compose
sidebar_position: 2
doc_type: how-to
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-30
tags: [install]
---

Run CMDX on one host from the pre-built container images, using Docker Compose. You install it once with the installation wizard, then run it as a service.

This page covers one host. For TLS, a separate SCORM content host and hardening, see [Production](production.md).

## Prerequisites

- **Access to the source and images.** The repository `CMDxAI/cmdx-LMS` and its container images on GitHub Container Registry (`ghcr.io`) are private. Ask your CMDX contact for read access, and create a GitHub personal access token with the `read:packages` scope.
- **Docker Engine** with Docker Compose v2 or later. See [Requirements](requirements.md).
- **Git**, to get the Compose file and the example environment file.
- **The image tag to install.** Each published build has a tag `sha-<commit>`, for example `sha-c603aeb`. Ask your CMDX contact which one to use.

This page was tested on 2026-10-30 with Docker 29.5.2, Docker Compose 5.3.1 and the images tagged `sha-c603aeb`.

## Steps

### Get the files

```bash
git clone https://github.com/CMDxAI/cmdx-LMS.git
cd cmdx-LMS
```

Run every command on this page from the `cmdx-LMS` folder. Every `docker compose` command names the file with `-f docker-compose.yml`. Keep that option: the folder holds other Compose files that are not part of this install.

### Sign in to the registry

```bash
echo "<token>" | docker login ghcr.io -u <github-user> --password-stdin
```

The output ends with `Login Succeeded`.

### Create the environment file

```bash
cp .env.example .env
chmod 600 .env
```

`.env` holds passwords and keys, so only its owner can read it. Open it and set these keys. Add `INSTALL_MODE` and `COMPOSE_PROFILES`, which are not in the example file.

| Key | Value | Why |
| --- | --- | --- |
| `SECRET_KEY` | the output of `python3 -c "import secrets; print(secrets.token_urlsafe(48))"` | Signs tokens and session cookies. |
| `POSTGRES_PASSWORD` | a new random password | The database password. Compose builds the connection string from it. |
| `CMDX_IMAGE_TAG` | the `sha-<commit>` tag you were given | Pins every CMDX container to one build. The example value, `main`, moves with every change. |
| `INSTALL_MODE` | `true` | Starts the backend with only the installation wizard available. |
| `RUN_SEED` | `false` | The wizard creates the roles and your administrator. |
| `BACKEND_PUBLISH` | `127.0.0.1:8000` | Keeps the API on the host only. The web app reaches it through its own `/api` proxy. |
| `COMPOSE_PROFILES` | `antivirus` | Starts ClamAV, which scans uploaded files. The example file turns scanning on with `CLAMAV_ENABLED=true`. |

Set the values that describe your site in `.env` too: `APP_NAME` for the site name, `FRONTEND_BASE_URL` for the address people use to reach CMDX, and the `SMTP_` keys for your mail server. Enter the same values in the wizard. The environment variables reference lists every key.

To run without antivirus scanning, leave out `COMPOSE_PROFILES` and set `CLAMAV_ENABLED=false`. CMDX then refuses SCORM packages, because it does not publish a package it has not scanned.

### Start the stack

```bash
docker compose -f docker-compose.yml up -d --wait
```

Compose pulls the images and starts the services. The command returns when every service is running and healthy. The first start takes several minutes while the images download.

Check that the backend started in install mode:

```bash
docker compose -f docker-compose.yml logs backend | grep "installer table"
```

The output contains `INSTALL_MODE is on: created 3 installer table(s) only`.

### Run the installation wizard

The web app listens on `127.0.0.1:8080`. From the host itself, open `http://localhost:8080/install`. From another machine, forward the port over SSH first, then open the same address there:

```bash
ssh -L 8080:127.0.0.1:8080 <user>@<host>
```

Follow the wizard as in [step 5 of the quick start](/getting-started/quick-start#step-5-run-the-install-wizard). On the **Database** step, use host `postgres`, port `5432`, and the `POSTGRES_DB`, `POSTGRES_USER` and `POSTGRES_PASSWORD` values from `.env`. On the **Services** step, keep **Local disk** and set **Path** to `/app/storage_uploads`.

The install ends with **Installed successfully** and two expected warnings: the administrator signs in with a password only, and the wizard cannot turn install mode off. You do that next.

:::warning
**Start installation** runs once. To install again, you delete every volume, which deletes all data: `docker compose -f docker-compose.yml down -v`.
:::

### Turn install mode off

In `.env`, set `INSTALL_MODE` to `false`. Keep `RUN_SEED=false`. Then recreate the containers so they read the new value:

```bash
docker compose -f docker-compose.yml up -d --wait
```

Use `up`, not `restart`. `restart` keeps the old environment, so the backend would stay in install mode.

## Automatic updates

The stack includes watchtower. Every 3 hours it checks the registry and replaces the backend, worker, beat and web app containers when their tag points at a new image. It doesn't touch PostgreSQL, Redis, RabbitMQ, ClamAV, Jaeger or Mailpit.

- **With a pinned `sha-` tag**, the tag never moves, so watchtower doesn't update anything. Upgrade by changing `CMDX_IMAGE_TAG`; see [Upgrade](upgrade.md).
- **To track `main` instead**, set `CMDX_IMAGE_TAG=main`, and set `GHCR_USERNAME` and `GHCR_TOKEN` in `.env`. Watchtower can't use the host's `docker login`, so it needs its own token with `read:packages`.

Watchtower mounts the Docker socket, which gives it root-level control of the host. To run without it, add `--scale watchtower=0` to every `up` command:

```bash
docker compose -f docker-compose.yml up -d --wait --scale watchtower=0
```

## Services and ports

Every port except the API's is published on `127.0.0.1` only. Reach one from another machine over an SSH tunnel, as for the wizard.

| Service | Role | Host port | Override |
| --- | --- | --- | --- |
| `frontend` | Web app, and a proxy for `/api`, `/ws` and `/health` | `127.0.0.1:8080` | `FRONTEND_PUBLISH` |
| `backend` | API | `8000`, or `127.0.0.1:8000` as set above | `BACKEND_PUBLISH` |
| `celery_worker` | Background jobs: email and other notifications, audit log writes and exports | none | |
| `celery_beat` | Schedules recurring jobs | none | |
| `postgres` | Database | `127.0.0.1:5432` | `POSTGRES_PUBLISH` |
| `redis` | Cache and job results | `127.0.0.1:6379` | |
| `rabbitmq` | Job queue; management UI on 15672 | `127.0.0.1:5672`, `127.0.0.1:15672` | |
| `mailhog` | Mailpit, which captures outgoing email; UI on 8025 | `127.0.0.1:1025`, `127.0.0.1:8025` | |
| `jaeger` | Trace viewer; UI on 16686, trace intake on 4317 and 4318 | `127.0.0.1:16686`, `127.0.0.1:4317`, `127.0.0.1:4318` | |
| `clamav` | Antivirus, with the `antivirus` profile | `127.0.0.1:3310` | |
| `caddy` | TLS on ports 80 and 443, with the `edge` profile | `80`, `443` | |
| `watchtower` | Automatic updates | none | |
| `storage_init` | Sets the owner of the uploads volume, then exits | none | |

An override takes the whole host binding, such as `127.0.0.1:8081` or a private network address. Always include an address: a bare port such as `5432` publishes the service on every interface of the host.

These keys in `.env` size the stack:

| Key | Default | Description |
| --- | --- | --- |
| `WORKERS` | `2` | API worker processes. |
| `WORKER_HEALTHCHECK_TIMEOUT` | `60` | Seconds an API worker may stop responding before it is replaced. |
| `CELERY_CONCURRENCY` | `4` | Worker processes for background jobs. |
| `POSTGRES_MAX_CONNECTIONS` | `200` | PostgreSQL connection limit, shared by the API and the workers. Recreate `postgres` after you change it. |

## Data and volumes

Your data lives in named volumes, which survive `down`, `up` and image updates:

| Volume | Holds |
| --- | --- |
| `postgres_data` | The database |
| `cmdx_storage` | Uploaded files and audit log exports |
| `redis_data`, `rabbitmq_data` | Cache and queued jobs |
| `clamav_data` | Virus definitions |
| `caddy_data`, `caddy_config` | TLS certificates and Caddy settings |

Anything written inside a container outside these volumes is lost when the container is replaced. Keep configuration in `.env` on the host.

:::warning
`docker compose -f docker-compose.yml down -v` deletes every volume, and with it the database and all uploaded files. Leave out `-v` to stop CMDX and keep your data.
:::

## Build the images from source

To run code you changed, build the images on the host instead of pulling them. Use `docker-compose-build.yml` in place of `docker-compose.yml` in every command, and add `--build` to the first `up`. The [quick start](/getting-started/quick-start) uses this file.

## Verify

1. List the services:

   ```bash
   docker compose -f docker-compose.yml ps
   ```

   Every service shows `Up`, and those with a health check show `(healthy)`. `storage_init` is not listed, because it has finished.

2. Check the API through the web app's proxy:

   ```bash
   curl -s http://localhost:8080/health
   ```

   The output starts with `{"status":"healthy"` and shows the database as `healthy`.

3. Check that install mode is off:

   ```bash
   docker compose -f docker-compose.yml exec backend printenv INSTALL_MODE
   ```

   The output is `false`.

4. Open `http://localhost:8080/login` and sign in with the administrator email and password from the wizard.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `unauthorized` or `denied` when Compose pulls a `ghcr.io` image | The host isn't signed in to the registry, or the token lacks `read:packages`. | Sign in again with a token that has `read:packages`. |
| `not found` for a `ghcr.io` image | No image was published with that tag. | Check `CMDX_IMAGE_TAG` with your CMDX contact. |
| `address already in use` on start | Another program uses one of the ports. | Stop that program, or move the CMDX service with its `_PUBLISH` key. |
| `up --wait` takes many minutes on the first start | The backend creates the database schema before it reports healthy. It has up to 10 minutes. | Wait, and follow progress with `docker compose -f docker-compose.yml logs -f backend`. |
| Uploaded files stay "being scanned" | `CLAMAV_ENABLED=true` but ClamAV isn't running, or is still downloading its definitions on first start. | Set `COMPOSE_PROFILES=antivirus` and run `up` again, or set `CLAMAV_ENABLED=false`. |
| The backend is still in install mode after you changed `.env` | The containers were restarted, not recreated. | Run `docker compose -f docker-compose.yml up -d --wait`. |
