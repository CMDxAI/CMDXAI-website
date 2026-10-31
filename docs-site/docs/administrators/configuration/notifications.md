---
id: notifications
title: Configure notifications
sidebar_label: Notifications
sidebar_position: 5
doc_type: how-to
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [configuration]
---

Choose how CMDX notifies people, edit the messages, and send announcements. CMDX can deliver by email, in-app inbox, push, SMS, WhatsApp and webhook. The Celery worker does the delivery, so it must be running.

## Prerequisites

- A working mail server for email. See [Configure email](./email.md).
- Capabilities from the `notification:*` group, such as `notification:tenant_defaults_manage` for the defaults. See [Permissions](../identity/permissions.md).

## Channels

Turn a channel on in `.env`, then recreate the backend and Celery containers. A channel also needs its provider's credentials.

| Channel | Key | Default | Also needs |
| --- | --- | --- | --- |
| Email | `NOTIFICATION_EMAIL_ENABLED` | On | SMTP settings |
| Push | `NOTIFICATION_PUSH_ENABLED` | Off | `FIREBASE_CREDENTIALS_PATH`, or the `APNS_*` keys |
| SMS | `NOTIFICATION_SMS_ENABLED` | Off | The `TWILIO_*` keys |
| WhatsApp | `NOTIFICATION_WHATSAPP_ENABLED` | Off | `WHATSAPP_PROVIDER`, and the Twilio or Meta keys |
| Webhook | `NOTIFICATION_WEBHOOK_ENABLED` | Off | None |

The in-app inbox is always available.

The webhook channel blocks internal addresses. To post to an internal host on purpose, list it in `NOTIFICATION_WEBHOOK_ALLOWED_HOSTS`.

## Steps

### Set the defaults for a tenant

Defaults apply to people who haven't set their own preferences.

1. Go to **Settings** > **Notifications**.
2. Under **Default channels**, choose the external channels people may receive. Choosing none means all of them.
3. Under **Default frequency**, choose how often people hear from CMDX.
4. Save the form.

Quiet hours, time zone and locale appear on this screen read-only. Only each person's own preferences set them today.

You must belong to exactly one organization to use this screen. With several active memberships, the request returns HTTP 409.

### Edit a template

Templates use Jinja syntax, such as `{{ variable_name }}`. There is one template for each event, audience, channel and locale.

1. Go to **Notifications** > **Templates**.
2. Open a template.
3. Edit the **Subject line** and the **Body**.
4. To check it, enter a **Test-send recipient**, which must be an existing user, or leave it blank to send to yourself. Then send the test.
5. Save the template.

### Send an announcement

1. Go to **Notifications** > **Send**.
2. Choose the audience, such as a **Group or batch**.
3. Enter a **Title** and **Body**, or choose a **Template**, which is rendered for each recipient.
4. Choose the **Channels** and the **Priority**.
5. Send it now, or schedule it. A scheduled send runs at 00:00 in the tenant's time zone on the **Send on** date, and can repeat until an end date.

### See what was delivered

**Notifications** > **Delivery log** lists every outbound delivery, with filters for channel, status and date. **Notifications** > **Overview** shows recent deliveries and the notification rules, which set which events notify whom.

## Automatic limits

| Limit | Default | Key |
| --- | --- | --- |
| Failed deliveries retry 5 times, after 30 seconds, 5 minutes, 30 minutes, 2 hours and 12 hours | | |
| Stops duplicates of the same notification | Within 300 seconds | `NOTIFICATION_DEDUP_ENABLED`, `NOTIFICATION_DEDUP_WINDOW_SEC` |
| Limits notifications for one event to one person | 50 an hour | `NOTIFICATION_THROTTLE_ENABLED`, `NOTIFICATION_THROTTLE_MAX_COUNT`, `NOTIFICATION_THROTTLE_WINDOW_SEC` |
| Groups low-priority notifications into digests | On | `NOTIFICATION_DIGEST_ENABLED`, `NOTIFICATION_DIGEST_PRIORITY_MAX` |

Delivery status webhooks from providers are off by default. Each has a `WEBHOOK_*_ENABLED` key.

## Verify

- Send a test from a template, and check that it arrives.
- The message appears in **Notifications** > **Delivery log**.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Nothing is delivered | The Celery worker is down. | Check `celery_worker`. See [Monitor CMDX](../operations/monitoring.md). |
| A channel is missing | Its key is off, or the containers weren't recreated. | Set the key, then recreate the backend and Celery containers. |
| Unsubscribe links point to `localhost` | `FRONTEND_BASE_URL` isn't set. | Set it to the public address of the app. |
| A person misses some messages | Their preferences, quiet hours or a digest changed the delivery. | Check their preferences, then the delivery log. |
| **Settings** > **Notifications** returns 409 | You belong to several organizations. | Use the API route for one tenant. |

## Related

- [Configure email](./email.md)
- [Manage scheduled tasks](../operations/scheduled-tasks.md)
