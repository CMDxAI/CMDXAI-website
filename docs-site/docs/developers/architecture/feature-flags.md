---
id: feature-flags
title: Feature flags
sidebar_label: Feature flags
sidebar_position: 6
doc_type: reference
audience: developers
source_prd: "216694785"
ai_drafted: true
last_verified: 2026-10-26
tags: [architecture, configuration]
---

A feature flag turns part of CMDX on or off without a new deploy. This page lists the flags the backend enforces today. Each flag is a boolean config key, so it follows the scope rules on the [configuration](./config-service.md) page.

:::note
Which other flags CMDX enforces is still being decided. Until then, this page lists only the flags the backend enforces today. Code reads a flag with `resolve_setting` from `core.config.resolve`.
:::

## Summary

| Key | Type | Default | Scopes | Turns on or off |
| --- | --- | --- | --- | --- |
| `calendar.calendar_enabled` | boolean | `true` | `global`, `tenant` | The calendar |

## Details

### `calendar.calendar_enabled`

Turns the calendar on or off for the whole installation or for one tenant.

- **Resolution:** the first match wins, in this order: the tenant's stored entry, the global stored entry, the `CALENDAR_ENABLED` environment variable, then the default. The default is on. At each scope, an entry stored under the older key `calendar_enabled` also counts.
- **Values:** `true`, `1`, `yes` and `on` mean on, in any case. Any other stored value means off. In `CALENDAR_ENABLED`, `false`, `0`, `no` and `off` mean off, and any other value is ignored.
- **When off:** calendar requests return HTTP 403 with the error code `CALENDAR_PERMISSION_DENIED`. Revoking a calendar feed token with `DELETE /api/v1/calendar/feed/token/<token-id>` still works when the flag is off.
- **Exception:** platform super administrators can use the calendar even when the flag is off.

## Related

- [Configuration](./config-service.md): keys, scopes and stored entries
- [Feature flags for administrators](../../administrators/configuration/feature-flags.md)
