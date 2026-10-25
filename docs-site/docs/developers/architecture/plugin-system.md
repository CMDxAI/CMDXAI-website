---
id: plugin-system
title: Plugin system
sidebar_label: Plugin system
sidebar_position: 3
doc_type: explanation
audience: developers
source_prd: none
ai_drafted: true
last_verified: 2026-10-25
tags: [architecture, plugins]
---

A plugin adds features to CMDX without changing the code in `core/` or `modules/`. It is built from the same parts as a module: routes, tables, settings, capabilities and hook handlers. It is packaged so that an administrator can install, enable, upgrade and remove it on a running deployment. This page explains where plugins come from, the states a plugin moves through, what it can add, and how it is kept apart from the rest of CMDX.

## Plugins and modules

| | Module | Plugin |
| --- | --- | --- |
| Lives in | `backend/modules/` | `backend/plugins/`, an external folder, or a Python package |
| Installed | Always, as part of CMDX | By an administrator, one plugin at a time |
| Can be switched off | No | Yes, for the whole installation or per tenant |
| Imports from | Anything in `core/` | `core.plugin_api` only |

The built-in learning item types, such as quiz and SCORM, are modules, not plugins. The repository includes two plugins, announcements and gamification, and example code under `backend/plugins/examples/`.

## Where plugins come from

When the backend starts, it looks for plugins in three places:

1. The `backend/plugins/` folder in the repository.
2. Each absolute path in the `EXTERNAL_PLUGINS_DIRS` environment variable, separated by colons.
3. Installed Python packages that declare an entry point in the `cmdx.plugins` group.

The code has to be there before the process starts: baked into the image, mounted as a volume, or installed with pip. Every plugin found is recorded in the plugin registry, a table in the database.

## The manifest

Each plugin has a `manifest.py` that says what it is:

- **name**: matches the plugin's folder name
- **type**: a category such as `auth`, `report`, `integration` or `local`
- **version** and **db_version**: the code version, and the schema version its upgrade steps reach
- **dependencies**: other parts it needs, written as `core.<name>`, `module:<name>` or `plugin:<name>`, each with a version range
- **capabilities**: the permissions it adds, named `<plugin-name>.<action>`
- **settings namespace**: where its settings live
- **scope**: `global` (on or off for the whole installation) or `per_tenant` (on or off for each tenant). The default is `per_tenant`.

## Lifecycle

A plugin moves through four states, which the registry records:

| State | What it means | How it gets there |
| --- | --- | --- |
| Discovered | The code is present and the manifest is valid. | Found at start-up. |
| Installed | The plugin's tables exist. | An administrator installs it, which runs its install steps. Later upgrades run its upgrade steps up to `db_version`. |
| Enabled | The plugin is active. | An administrator enables it: once for a `global` plugin, or for each tenant for a `per_tenant` plugin. |
| Disabled | The plugin is inactive. | An administrator disables it. A plugin that another enabled plugin depends on cannot be disabled. |

Enabling changes the state in the database. The running backend loads the plugin the next time it starts, or straight away when an administrator calls the plugin's reload endpoint.

Managing plugins needs these capabilities:

| Capability | Allows |
| --- | --- |
| `plugin:read` | Listing plugins and reading their settings |
| `plugin:tenant_toggle` | Enabling and disabling a plugin for the caller's own tenant |
| `plugin:manage` | Installing, upgrading, uninstalling and reloading plugins, changing their settings, and enabling them for another tenant |

On a development machine, the `python -m scripts.plugin` command does the same from the backend folder: `list`, `validate`, `install`, `enable`, `disable`, `uninstall` and `reload`.

## What a plugin adds

When the backend loads an enabled plugin, it:

1. Registers the plugin's tables. A plugin describes them once as portable table definitions, named `plg_<plugin-name>_*`, and reads and writes them through the `DB` facade.
2. Registers its settings schema, so administrators can configure it.
3. Registers its hook handlers, so it can react to events in CMDX.
4. Mounts its API routes under `/api/v1/plugins/<plugin-name>/`.

Plugins load in dependency order, so a plugin loads after the plugins it depends on.

### Per-tenant plugins

A `per_tenant` plugin's routes answer only in tenants where the plugin is enabled. In any other tenant, the request is refused.

:::note
How per-tenant enablement applies to a plugin's hook handlers is being settled. Until this page is updated, don't rely on a disabled tenant being skipped by your hook handlers.
:::

## How plugins are kept apart

- **One public API.** Plugin code imports only from `core.plugin_api`. That package is kept compatible across minor CMDX releases; anything else in `core/` or `modules/` can change without notice. If a plugin needs something `core.plugin_api` doesn't offer, that is a request for the public API to grow.
- **Own tables.** A plugin's tables carry its name as a prefix and are created and upgraded by its own steps, so they never collide with CMDX tables or another plugin's.
- **Own capabilities.** A plugin's capabilities are named after the plugin, so they never collide with another plugin's.
- **Failures stay contained.** A plugin that fails to load is logged and skipped, and the backend and the other plugins keep running.
- **Checked before install.** `python -m scripts.plugin validate` checks that the folder name matches the manifest, that `db_version` matches the highest upgrade step, that capabilities and settings use the plugin's name, and that dependencies are well formed.

This keeps plugins apart by contract, not by sandbox. A plugin runs inside the backend process with the same database connection as CMDX, so install only plugins you trust.

## Next

- [Build a plugin](../plugins/build-a-plugin.md): write and install a plugin step by step
- [Hooks and events](./hooks-and-events.md): what a plugin can react to
- [Packaging and testing](../plugins/packaging-and-testing.md): ship a plugin outside the repository
