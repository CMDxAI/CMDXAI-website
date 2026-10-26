---
id: capability-catalog
title: Capability catalog
sidebar_label: Capability catalog
sidebar_position: 8
doc_type: reference
audience: developers
source_prd: none
ai_drafted: true
last_verified: 2026-10-26
tags: [architecture, permissions]
---

A capability is a named permission that a role can grant, such as `calendar:create`. Each module declares its capabilities in code. At start-up, CMDX copies them into the database, where roles can use them. This page lists the fields of a capability, how a module registers one, and how start-up keeps the database in step. The code is in `modules.capability_catalog`.

## Summary

| Part | Where | What it does |
| --- | --- | --- |
| `register_capability()` | `modules.capability_catalog.permissions` | Adds one capability to the in-memory registry. |
| `register_all_capabilities()` | `modules.capability_catalog.bootstrap` | Calls each module's registration function. |
| Reconciliation | `CapabilityReconciliationService` | Copies the registry into the `permissions` and `rbac_capabilities` tables at start-up and after a plugin changes state. |
| Catalog API | `GET /api/v1/capabilities` | Lists the capabilities in the database. |

## Capability fields

`register_capability()` takes these keyword arguments. All are required.

| Field | Type | Description |
| --- | --- | --- |
| `key` | `str` | Unique key, for example `calendar:create`. Roles and route guards refer to the capability by this key. |
| `display_name` | `str` | Short name shown to administrators. |
| `description` | `str` | One sentence on what the capability allows. |
| `risk_level` | `str` | `low`, `medium` or `high`. |
| `applicable_contexts` | `list[str]` | One or more of `global`, `organization` (a tenant) and `course`. Context-scoped role overrides are checked against this list. |
| `module` | `str` | Name of the module that owns the capability. |

`register_capability()` raises `ValueError` when a field is empty, `risk_level` isn't an allowed value, or a context isn't an allowed value. It raises `DuplicateCapabilityError` when the key is already registered.

## Key format

Write keys as `<resource>:<action>`, where both parts are lowercase letters, digits and underscores, starting with a letter. For example: `calendar:read`, `developer_settings:manage`.

For a key in this format, reconciliation also fills the `resource` and `action` columns of the `permissions` row. Other formats are stored, but those two columns stay empty.

## Register a module's capabilities

A module keeps its capabilities in `capabilities.py`: a list of field dictionaries and a function that registers each one. The function is then called from `register_all_capabilities()` in `modules/capability_catalog/bootstrap.py`. A module that isn't listed there isn't registered.

```python title="modules/calendar/capabilities.py"
from modules.calendar.permissions import CALENDAR_CREATE, CALENDAR_READ
from modules.capability_catalog.permissions import register_capability

CALENDAR_CAPABILITIES = [
    {
        "key": CALENDAR_READ,  # "calendar:read"
        "display_name": "View Calendar",
        "description": "View calendar events visible to the caller",
        "risk_level": "low",
        "applicable_contexts": ["global"],
        "module": "calendar",
    },
    {
        "key": CALENDAR_CREATE,  # "calendar:create"
        "display_name": "Create Calendar Events",
        "description": "Create calendar events",
        "risk_level": "medium",
        "applicable_contexts": ["global"],
        "module": "calendar",
    },
]


def register_calendar_capabilities() -> None:
    for capability in CALENDAR_CAPABILITIES:
        register_capability(**capability)
```

Plugins declare their capabilities in their manifest instead. See [plugin system](./plugin-system.md).

## Register a plugin's capabilities

`sync_plugin_capabilities()` in `modules.plugins.capability_sync` registers the manifest keys of every plugin that is installed or enabled. Each key gets these fields:

| Field | Value |
| --- | --- |
| `key` | The manifest key, for example `gamification.view`. |
| `display_name` | The key. |
| `description` | `Declared by the <plugin> plugin`. |
| `risk_level` | `medium`. |
| `applicable_contexts` | `global` and `organization`. |
| `module` | `plugin:<plugin>`, for example `plugin:gamification`. |

A key that doesn't start with `<plugin>.` is skipped with a warning. So is a key that another module already registered.

Installing, upgrading, enabling, disabling or uninstalling a plugin runs the sync again. Reconciliation then runs with `module_prefix="plugin:"`, so it touches only plugin rows. The capabilities of a disabled or uninstalled plugin are marked stale.

## Start-up reconciliation

When the backend starts, it registers every module's capabilities, then the capabilities of each installed or enabled plugin, and then reconciles the registry with the database. While `INSTALL_MODE` is on, start-up skips this step. The install wizard runs it instead, when it installs the roles module.

For each registered capability, reconciliation:

1. Finds the `permissions` row whose `name` is the key, or creates one. The row's description is set to the registered description.
2. Creates or updates the `rbac_capabilities` row that points to that permission, with the display name, risk level, contexts and module. The row is marked not stale.

Then, for each `rbac_capabilities` row whose key is no longer registered, it sets `is_stale` to `true`. Rows are never deleted.

A stale capability grants nothing. Permission checks skip it even when a role still lists it. The catalog API leaves it out unless you ask for it.

Reconciliation writes these log events, each with a `capability_key` field where it applies:

| Event | When |
| --- | --- |
| `capability_reconcile_started` | Reconciliation began. |
| `capability_created` | A new capability row was added. |
| `capability_updated` | An existing row was refreshed. |
| `capability_stale` | A row was marked stale. |
| `capability_reconcile_completed` | Reconciliation finished. Has `inserted`, `updated` and `stale` counts. |
| `capability_reconcile_failed` | Reconciliation raised an error. |

## Catalog API

Both endpoints need a signed-in user.

| Endpoint | Returns |
| --- | --- |
| `GET /api/v1/capabilities` | `capabilities`, a list, and `total`. Optional query parameters: `module`, `risk_level`, and `include_stale` (default `false`). |
| `GET /api/v1/capabilities/{key}` | One capability, or `404` if the key isn't in the catalog. |

Each capability in a response has `key`, `display_name`, `description`, `risk_level`, `applicable_contexts`, `is_stale` and `module`.

## Related

- [Plugin system](./plugin-system.md): plugin manifests and their capabilities
- [Logging](./logging.md): the log record format
