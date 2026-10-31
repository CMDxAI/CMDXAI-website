---
id: maintenance-mode
title: Use maintenance mode
sidebar_label: Maintenance mode
sidebar_position: 5
doc_type: how-to
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [operations]
---

Stop people using CMDX while you do planned work, and tell them why. You can block everything, allow reading only, or schedule a window in advance.

## What each mode does

| Mode | Effect |
| --- | --- |
| Live | Normal service |
| Read-only | `GET`, `HEAD` and `OPTIONS` requests work. Everything else returns HTTP 503. |
| Full maintenance | Every request returns HTTP 503, with your message and a `Retry-After` value. |
| Scheduled window | Acts as full maintenance between the start and end times. |

Super Administrators and addresses in `MAINTENANCE_BYPASS_IPS` aren't blocked, so you can still check your work. Tenant administrators are blocked.

Some paths stay open: `/health`, `/metrics` and the maintenance setting itself.

## Prerequisites

- You need the Super Administrator role.

## Steps

### Turn it on now

1. Go to **Settings** > **Maintenance**.
2. Choose the mode.
3. Enter a **Maintenance message**, which everyone who is blocked sees. Leave it blank to use the default.
4. Save the form.

The change takes effect within about a minute, on every API worker.

### Schedule a window

1. Go to **Settings** > **Maintenance**.
2. Under the scheduled section, set **Window start**, **Start time**, **Window end** and **End time**. Enter them in your own time zone. The end must be after the start.
3. To warn people, turn on **Notify all users 1 hour before**. A task checks for this every 5 minutes, so the notice can arrive a few minutes late.
4. Save the form.

Use **Clear** to remove a window.

### Turn it off

Choose **Live** and save, or clear the window.

### From the host

If you can't reach the app, set these in `.env` and recreate the backend:

```bash
MAINTENANCE_MODE=true
MAINTENANCE_MESSAGE=Back at 18:00 UTC.
MAINTENANCE_BYPASS_IPS=["203.0.113.10"]
```

```bash
docker compose -f docker-compose.yml up -d --force-recreate backend
```

`MAINTENANCE_RETRY_AFTER` sets the `Retry-After` value in seconds, 3600 by default. `MAINTENANCE_MODE` works without the database or Redis. Set it back to `false` when you finish.

Behind a proxy, `MAINTENANCE_BYPASS_IPS` needs `TRUSTED_HOSTS` set, so that CMDX reads the visitor's address from `X-Forwarded-For`. Otherwise it sees the proxy's address.

## Verify

Check from an address that isn't exempt, without signing in:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://lms.example.com/api/v1/organizations/current
```

The output is `503`. `/health` still returns `200`. After you turn it off, the first command no longer returns `503`.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| The change doesn't apply straight away | The state is cached for up to 60 seconds. | Wait a minute. |
| You are locked out | Your account isn't a Super Administrator. | Set `MAINTENANCE_MODE=false` and recreate the backend, or sign in as a Super Administrator. |
| It stays on after you clear it in the app | `MAINTENANCE_MODE=true` is in `.env`. | Set it to `false` and recreate the backend. |
| Nobody got the advance notice | **Notify all users 1 hour before** is off, the worker is down, or the window was saved inside the hour. | Check the setting and `celery_worker`. |

## Related

- [Upgrade CMDX](../install/upgrade.md)
- [Manage scheduled tasks](./scheduled-tasks.md)
