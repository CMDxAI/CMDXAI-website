---
id: feature-flags
title: Turn feature flags on or off
sidebar_label: Feature flags
sidebar_position: 1
doc_type: how-to
audience: administrators
source_prd: "216694785"
ai_drafted: true
last_verified: 2026-10-31
tags: [configuration]
---

Turn CMDX features on or off. Most of CMDX isn't behind a flag yet, so check [which flags do something](#which-flags-do-something) before you rely on one.

## Which flags do something

`calendar.calendar_enabled` is the only flag that turns a feature on or off. See [the calendar](#the-calendar).

### Preview flags

These flags are in development. Setting one stores a value for upcoming modules, but doesn't gate any feature in v1.

| Flag | Described as |
| --- | --- |
| `features.new_course_editor` | Next-generation course editor |
| `features.ai_assistant_v2` | AI tutor V2 |
| `features.enhanced_analytics` | Advanced reporting dashboards |
| `features.maintenance_mode_banner` | Maintenance mode warning banner |
| `features.siem_audit_export` | Real-time SIEM export. When it's on, CMDX sends settings changes to the webhook set under **Logs** > **Settings**. |

The `FEATURE_*` keys in `.env.example`, such as `FEATURE_GAMIFICATION`, aren't read by the code.

## Prerequisites

You need the Super Administrator role.

## Steps

### Change a flag

1. Go to **Settings** > **Features**.
2. Find the flag. You can search by key and filter by status.
3. Use the switch on its row.

The change is written to the audit log, and takes effect within about a minute.

To add a flag of your own, select **New flag**. A new flag does nothing until code reads it, so this is mainly for plugin authors. The screen has no delete action. To remove a flag, call the API:

```bash
curl -X DELETE https://lms.example.com/api/v1/admin/feature-flags/<flag-key> \
  -H "Authorization: Bearer $TOKEN"
```

### The calendar

The calendar flag is a config key, so it isn't on the **Features** screen. Set it through the API as an administrator. To turn the calendar off for the whole install:

```bash
curl -X POST https://lms.example.com/api/v1/config \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"key": "calendar.calendar_enabled", "namespace": "calendar", "value": "false", "scope": "global"}'
```

To turn it off for one tenant, set `"scope": "tenant"` and `"scope_id"` to the tenant's ID. If an entry already exists, use `PUT /api/v1/config/calendar.calendar_enabled`.

When the calendar is off, calendar requests return HTTP 403. Platform super administrators can still use it.

You can also set `CALENDAR_ENABLED=false` in `.env`. A stored entry wins over the environment variable.

## Verify

Read the flags back:

```bash
curl https://lms.example.com/api/v1/admin/feature-flags \
  -H "Authorization: Bearer $TOKEN"
```

To check the calendar, open it as a learner. With the flag off, the request returns HTTP 403.

## Related

- [Tenant settings](../tenants/tenant-settings.md)
- [Feature flags for developers](../../developers/architecture/feature-flags.md)
