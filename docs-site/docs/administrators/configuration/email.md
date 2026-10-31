---
id: email
title: Configure email
sidebar_label: Email
sidebar_position: 3
doc_type: how-to
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [configuration]
---

Connect CMDX to an SMTP server and send a test email. CMDX sends invitations, password resets and notifications through it. The Celery worker does the sending, so it must be running.

## Before you start

- You need the Super Administrator role.
- You need your mail server's host, port and credentials, and a sender address your server may send from.
- Set `EMAIL_DELIVERY_MODE=real` in `.env`. See [delivery modes](#delivery-modes).
- Set `FRONTEND_BASE_URL` to the public address of the app. Links in emails are built from it.

## Step 1: Enter the server details

Go to **Settings** > **Email** and fill in the **SMTP server** section:

| Field | Required | Description |
| --- | --- | --- |
| **Host** | Yes | Your server, such as `smtp.sendgrid.net` |
| **Port** | Yes | Usually `587` for STARTTLS or `465` for SSL/TLS |
| **Transport security** | | SSL/TLS, STARTTLS or none. Use what your server expects on that port. |
| **Username** | | The account to sign in with |
| **Password / API key** | | Encrypted when saved. Leave it blank to keep the stored value. |

Then fill in **Sender identity**:

| Field | Required | Description |
| --- | --- | --- |
| **From name** | | The name people see |
| **From address** | | The address mail comes from |
| **Reply-to** | | Where replies go, if different |
| **Throttle (per minute)** | Yes | The most emails CMDX sends in a minute |

Select **Save**.

## Step 2: Send a test email

Under **Send test email to**, enter an address. It defaults to the **From address**. Select **Send test email**.

The **Status** card shows the time and the result of the last test. A failed test shows the server's error. The test connects to the server directly, so it can succeed even if the Celery worker is down.

## Step 3: Send a real email

To check the whole path, use **Forgot password** on the sign-in page. If the test worked but this email doesn't arrive, see [troubleshooting](../operations/troubleshooting.md#emails-dont-arrive).

## Where the settings come from

CMDX builds its SMTP settings from these sources. A later row wins:

1. Built-in defaults
2. `SMTP_*` keys in `.env`
3. **Settings** > **Email**
4. A tenant's own override

Both the API and the workers read the saved settings, so you don't need to restart anything.

## Delivery modes

`EMAIL_DELIVERY_MODE` decides where email goes.

| Mode | Sends to | Use it for |
| --- | --- | --- |
| `real` | Your SMTP server | Production. It is the only mode allowed with `ENVIRONMENT=production`. |
| `mailpit` | The local Mailpit container only | Development |
| `dual` | Both | Local development |

`.env.example` sets `dual` and points `SMTP_HOST` at Mailpit, so change both on a real install.

To read captured mail in development, open Mailpit at `http://localhost:8025`.

## Send from a tenant's own server

A tenant administrator can give a tenant its own server on the same **Settings** > **Email** screen, which then edits that tenant's override. Fields left alone keep the global value. See [tenant settings](../tenants/tenant-settings.md#what-a-tenant-can-override).

## Use Amazon SES or SendGrid

The simplest way is SMTP, which needs no other setup. For the SES SMTP interface, use these values:

| Field | Value |
| --- | --- |
| **Host** | `email-smtp.us-east-1.amazonaws.com`, for your region |
| **Port** | `587` |
| **Transport security** | STARTTLS |
| **Username**, **Password / API key** | Your SES SMTP credentials |

CMDX can also call the SES and SendGrid APIs directly. `docker-compose.yml` fixes `EMAIL_PROVIDER` at `smtp`, and that wins over `.env`, so you need an override file, as in [turn on production mode](../install/production.md#step-3-turn-on-production-mode):

```yaml title="docker-compose.override.yml"
services:
  backend:
    environment:
      EMAIL_PROVIDER: sendgrid
  celery_worker:
    environment:
      EMAIL_PROVIDER: sendgrid
```

For SendGrid, set `SENDGRID_API_KEY`. The allowed values are `smtp`, `sendgrid` and `ses`. **Send test email** always uses SMTP, so it doesn't test these.

## Related

- [Troubleshoot an install](../operations/troubleshooting.md)
- [Change the branding](../tenants/branding.md#emails): the support address and footer
