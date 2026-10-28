---
id: gamification
title: Gamification plugin
sidebar_label: Gamification
sidebar_position: 5
doc_type: explanation
audience: developers
source_prd: none
ai_drafted: true
last_verified: 2026-10-28
tags: [examples, plugins]
---

The gamification plugin ships with CMDX in `backend/plugins/gamification/`. When a learner completes a course, it gives them a badge and points. It shows a whole plugin working together: a manifest, tables, a hook handler, routes, settings, capabilities and background tasks.

## How it works

1. An administrator installs the plugin and enables it for a tenant. It isn't installed by default.
2. When a learner completes a course in that tenant, CMDX fires the `course.completed` hook.
3. The plugin's handler makes sure the `course_complete` badge exists, gives it to the learner, and adds 100 points to their ledger. The handler runs after the response is sent, so it opens its own database session.
4. Learners read their badges and points through the plugin's routes.

Badges and points belong to the tenant they were earned in. A learner earns the `course_complete` badge once per tenant. Points are added for every completion.

The plugin is `per_tenant`, so its routes return `404` and its handler doesn't run in a tenant that hasn't enabled it.

### What to copy, and what not to

Copy its structure: the manifest, the table definitions and personal data declarations, the hook registration with a `failure_mode`, and the routes guarded by a capability.

Don't copy its imports. The plugin ships with CMDX and imports some internal modules, such as `core.auth`, `core.hooks` and `core.tenancy`, that a third-party plugin can't rely on. Import from `core.plugin_api` as shown in [Build your first plugin](../build-a-plugin.md) and the [Plugin system](../../architecture/plugin-system.md) page.

## Manifest

| Field | Value |
| --- | --- |
| `name` | `gamification` |
| `type` | `local` |
| `version` | `1.1.1` |
| `db_version` | `2026102700` |
| `multitenant` | `per_tenant` |
| `settings_namespace` | `gamification` |
| `capabilities` | `gamification.view`, `gamification.award` |
| `dependencies` | `core.auth >=1.0`; `module:courses >=1.0`, optional |
| `personal_data` | `plg_gamification_user_badges`, `plg_gamification_points_ledger` |

## Tables

| Table | One row per | Columns |
| --- | --- | --- |
| `plg_gamification_badges` | Badge | `code` (unique), `name`, `description`, `icon`, `points` |
| `plg_gamification_user_badges` | Badge a learner earned in a tenant | `user_id`, `badge_id`, `tenant_id`. `tenant_id`, `user_id` and `badge_id` are unique together. |
| `plg_gamification_points_ledger` | Points change | `user_id`, `delta`, `reason`, `course_id`, `tenant_id` |

Each table also has `id`, `created_at` and `updated_at`. A learner's points total is the sum of their `delta` values in the tenant.

## Hook

| Hook point | Priority | `failure_mode` | Does |
| --- | --- | --- | --- |
| `course.completed` | 50 | `continue` | Gives the `course_complete` badge ("Course Champion") and 100 points. Reads `user_id` and `course_id` from the event. |

With `failure_mode` set to `continue`, an error in the handler is logged and doesn't affect the course completion.

## Routes

All routes are under `/api/v1/plugins/gamification` and need a signed-in user.

| Method and path | Returns | Also needs |
| --- | --- | --- |
| `GET /badges` | Every badge, ordered by `code` | |
| `GET /users/me/badges` | Your badges in the current tenant | |
| `GET /users/me/points` | Your points total in the current tenant | |
| `GET /users/{user_id}/badges` | Another user's badges in the current tenant | `gamification.view` in the tenant. Returns `404` if the user isn't a member of the tenant. |

## Settings

| Key | Type | Default | Scopes | Status |
| --- | --- | --- | --- | --- |
| `gamification.points_per_completion` | integer | `100` | global, tenant | Not read yet. The hook always awards 100. |
| `gamification.badge_icon_url` | string | `""` | global, tenant | Not read yet. |

## Capabilities

| Capability | Status |
| --- | --- |
| `gamification.view` | Needed to read another user's badges. |
| `gamification.award` | Declared; no route checks it yet. |

## Background tasks

| Task | Schedule | Does |
| --- | --- | --- |
| `plugins.gamification.recompute_leaderboard` | Every hour | A stub: logs a line and returns. |
| `plugins.gamification.echo` | None | Returns its message. Used to test that the worker finds plugin tasks. |
| `plugins.gamification.simulate_long_job` | None | Sleeps for up to 60 seconds. Used to test long-running tasks. |

## Frontend

The web app has no gamification screens yet. Administrators install and enable the plugin from the plugin settings screens, which work for any plugin.

## Related

- [Build your first plugin](../build-a-plugin.md)
- [Plugin system](../../architecture/plugin-system.md)
- [Hooks and events](../../architecture/hooks-and-events.md)
