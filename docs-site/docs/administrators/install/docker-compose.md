---
id: docker-compose
title: Install with Docker Compose
sidebar_label: Docker Compose
sidebar_position: 2
doc_type: how-to
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [install]
---

Run CMDX on one host with Docker Compose, from the published images. You copy three files to the host, create `.env`, start the stack and finish with the install wizard. To build from source on a laptop instead, follow the [quick start](/getting-started/quick-start).

## Before you start

- A host that meets the [requirements](./requirements.md).
- Shell access to the host, as a user who can run Docker.
- Read access to the `CMDxAI/cmdx-LMS` repository, and a GitHub token with `read:packages`.

## Step 1: Copy the files to the host

Don't run the stack from a clone of the repository. A clone contains `docker-compose.override.yml`, a file for local development that Compose loads automatically. It mounts the source code over the image and turns migrations off. Copy only what the host needs:

```bash
git clone https://github.com/CMDxAI/cmdx-LMS.git
sudo mkdir -p /opt/cmdx/deployment/caddy /opt/cmdx/docker/local-ca
sudo chown -R "$USER" /opt/cmdx
cp cmdx-LMS/docker-compose.yml cmdx-LMS/.env.example /opt/cmdx/
cp cmdx-LMS/deployment/caddy/Caddyfile /opt/cmdx/deployment/caddy/
cd /opt/cmdx
```

Run every later command from `/opt/cmdx`.

`docker/local-ca` is optional. It holds extra root certificates, for example for a proxy that inspects TLS. Leave it empty if you have none.

## Step 2: Log in to the registry

The images are private. Log in once on each host:

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u <github-user> --password-stdin
```

## Step 3: Create `.env`

```bash
cp .env.example .env
```

Open `.env` and set these keys. `INSTALL_MODE` isn't in the example file, so add it.

| Key | Value | Why |
| --- | --- | --- |
| `SECRET_KEY` | The output of `python3 -c "import secrets; print(secrets.token_urlsafe(48))"` | Signs tokens, and by default encrypts the secrets you save in the app. |
| `POSTGRES_PASSWORD` | A new random value of letters and digits | Compose puts it in a database URL, so avoid `@`, `/` and `:`. |
| `INSTALL_MODE` | `true` | Leaves the database empty for the install wizard. |
| `RUN_SEED` | `false` | Stops the backend from creating the default administrator. |
| `BACKEND_PUBLISH` | `127.0.0.1:8000` | Keeps the API off the network. The wizard has no sign-in until it finishes. |
| `CLAMAV_ENABLED` | `false` | The example file turns this on, but ClamAV isn't running yet. See the warning below. |
| `EMAIL_DELIVERY_MODE` | `real` | The example file also sends every email to Mailpit. |
| `FRONTEND_BASE_URL` | The address people will use, such as `https://lms.example.com` | Used in email links and after sign-in with a provider. |
| `GHCR_USERNAME`, `GHCR_TOKEN` | Your GitHub user and token | Automatic updates can't see your `docker login`. |

:::warning
With `CLAMAV_ENABLED=true` and no ClamAV running, every upload stays in the `PENDING` scan state and can't be downloaded. Turn it on once ClamAV is running. See [file storage](../configuration/storage.md#scan-uploads-for-viruses).
:::

## Step 4: Start the stack

```bash
docker compose up -d
```

The command pulls the images and starts the services. The backend can take several minutes on a cold database. When the command returns, check that the API answers:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/health
```

The output is `200`. Then check that the backend started in install mode:

```bash
docker compose logs backend | grep "installer table"
```

The output contains `INSTALL_MODE is on: created 3 installer table(s) only`.

## Step 5: Run the install wizard

The web app listens on `127.0.0.1:8080`. From your own machine, open an SSH tunnel to the host:

```bash
ssh -L 8080:127.0.0.1:8080 <user>@<host>
```

Open `http://localhost:8080/install` in your browser. Keep the tunnel open until the wizard finishes.

:::warning
The wizard has no sign-in. Whoever reaches it first can complete it. Keep ports 8000 and 8080 off the network until it finishes.
:::

The wizard has six steps:

1. **Before you begin** lists what an install needs. Nothing is written here.
2. **Requirements** checks the host. Fix every blocking item. The **Node toolchain** warning is expected, because the containers have no Node.js.
3. **Database**: enter these values, then select **Test connection**.

   | Field | Value |
   | --- | --- |
   | **Host** | `postgres` |
   | **Port** | `5432` |
   | **Database** | `POSTGRES_DB` from `.env` |
   | **User** | `POSTGRES_USER` from `.env` |
   | **Password** | `POSTGRES_PASSWORD` from `.env` |

4. **Services**: under **File storage**, keep **Local disk** and set **Path** to `/app/storage_uploads`. Leave the other sections as they are.
5. **Site & administrator**: enter the site name, the first tenant's name and slug, and the Super Administrator's email and password. You can't change the slug later. Keep the default **Base URL** if you opened the wizard through the tunnel.
6. **Install** shows a summary. Select **Start installation**.

The tasks run in order. The result is **Installed successfully**, with two expected warnings:

- **Create administrator**: the wizard doesn't turn on multi-factor authentication for the account. Turn it on under **Settings** > **Security** afterwards.
- **Verify install**: the wizard can't turn install mode off, because Compose sets it. You do that next.

The wizard writes its answers inside the backend container, and that copy is lost when the container is recreated. Anything you want to keep, such as SMTP settings, goes in `.env` or in **Settings**.

## Step 6: Turn install mode off

Open `.env` and set `INSTALL_MODE=false`. Keep `RUN_SEED=false`. Then recreate the containers:

```bash
docker compose up -d
```

Use `up -d`, not `docker compose restart`. `restart` keeps the old environment, so the backend would stay in install mode.

## Step 7: Check the install

Check that every container is up and the database is healthy:

```bash
docker compose ps
curl -s http://127.0.0.1:8000/health
```

The second command returns JSON with `"status":"healthy"`. Sign in at `http://localhost:8080/login` through the tunnel, as the Super Administrator.

To reach the app without the tunnel, set up TLS. See [install for production](./production.md#step-5-turn-on-tls).

## Stop or remove the stack

To stop the stack and keep your data:

```bash
docker compose down
```

To delete everything, including the database and uploads:

```bash
docker compose down -v
```

:::danger
`down -v` deletes the database and every uploaded file. Take a [backup](./upgrade.md#step-2-back-up) first if you need them.
:::

## Install without the wizard

If `INSTALL_MODE` is off and `RUN_SEED` is on, the backend runs the migrations on first start and creates a default administrator, `admin@example.com` with the password `adminchangeme`. Use this only on a throwaway install, and change the password straight away. Set `RBAC_ADMIN_EMAIL` and `RBAC_ADMIN_PASSWORD` in `.env` to use different values.

## Next

- [Install for production](./production.md)
- [Configure email](../configuration/email.md)
- [Environment variables](../configuration/environment-variables.md)
