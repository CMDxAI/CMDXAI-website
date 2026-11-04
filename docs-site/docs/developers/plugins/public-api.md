---
id: public-api
title: Public plugin API
sidebar_label: Public API
sidebar_position: 5
doc_type: reference
audience: developers
source_prd: none
ai_drafted: true
last_verified: 2026-10-29
tags: [plugins, api]
---

Everything a plugin may import from the backend, from the `core.plugin_api` package.

Plugin code imports only from `core.plugin_api`. Everything else in the backend (`core.database`, `core.auth`, `modules.*` and so on) is internal and can change in any release. If you need something the package doesn't offer, ask for the public API to grow instead of importing around it.

## Stability promise

| Names | Promise |
| --- | --- |
| [Stable names](#stable-names) | Compatible across minor CMDX releases. A breaking change waits for a major release and comes with a migration note. |
| [Other names in the submodules](#other-names-in-the-submodules) | Importable, but not covered by the promise. |
| Anything outside `core.plugin_api` | No guarantee. |

## Stable names

Import these from `core.plugin_api`, except `User` and `t`, which come from the submodules shown.

### Manifest

| Name | Kind | Purpose |
| --- | --- | --- |
| `PluginManifest` | class | The plugin's manifest. See [The manifest](../architecture/plugin-system.md#the-manifest). |
| `PluginType` | enum | The plugin's category. |
| `PluginDependency` | class | Another plugin this plugin needs. |
| `PersonalDataTable` | class | Declares a plugin table that holds personal data. |

### Database

| Name | Kind | Purpose |
| --- | --- | --- |
| `DB` | class | Data access facade: read and write rows by table name. |
| `get_dml` | FastAPI dependency | Yields a `DB` bound to the request's database session. |
| `DBManager` | class | Creates and changes your tables, in the plugin's `db/upgrade.py`. |
| `TableDefinition`, `FieldDefinition`, `IndexDefinition`, `ForeignKeyDefinition` | classes | Describe a table for `DBManager`. |
| `ColumnType` | enum | Column types for `FieldDefinition`. |
| `standard_id_field`, `standard_timestamp_fields` | functions | The standard UUID `id` primary key, and the `created_at` and `updated_at` columns. |

### Configuration

| Name | Kind | Purpose |
| --- | --- | --- |
| `ConfigSchemaDefinition` | class | Declares one setting. See [Key definition fields](../architecture/config-service.md#key-definition-fields). |
| `ConfigValueType` | enum | `string`, `integer`, `float`, `boolean`, `json`, `secret`, `enum`. |
| `ConfigScope` | enum | `global`, `tenant`, `component`. |
| [`get_config_registry`](#get_config_registry) | function | Returns the settings registry you register your namespace with. |

### Authentication and permissions

| Name | Kind | Purpose |
| --- | --- | --- |
| [`require_capability`](#require_capability) | function | Route dependency that requires one capability. |
| `RoleChecker` | class | Route dependency that requires one of the given global roles: `Depends(RoleChecker("admin"))`. |
| `get_current_user`, `get_current_active_user` | FastAPI dependencies | The signed-in user. |
| `User` | class | The user model. Import it from `core.plugin_api.auth`. |

### Hooks

| Name | Kind | Purpose |
| --- | --- | --- |
| [`hook`](#hook) | decorator | Marks a function as a hook handler. |
| `HookManager` | class | Passed to your `register_hooks(hooks)` function; `hooks.register(point, handler)` subscribes a handler. |
| `HookContext` | class | What a handler receives: the hook point, its data and the tenant. |

Hook points and when handlers run: [Hooks and events](../architecture/hooks-and-events.md).

### HTTP

`APIRouter`, `Depends`, `HTTPException` and `status` are FastAPI's own. Define `router = APIRouter(...)` in your plugin's `api.py`; CMDX mounts it at `/api/v1/plugins/<plugin-name>`.

### Background tasks

| Name | Kind | Purpose |
| --- | --- | --- |
| [`register_task`](#register_task) | decorator | Registers a Celery task. |
| `celery_app` | object | The platform's Celery app, loaded on first use. |

### Group membership providers

`GroupMembershipProvider`, `GroupMembershipProviderContext` and `GroupMembershipProviderRegistry` let a plugin feed group membership from an outside directory. They're described with the other provider contracts.

### Translations

| Name | Kind | Purpose |
| --- | --- | --- |
| `t` | function | Translates a key. Import it from `core.plugin_api.i18n`. Your plugin's `lang/<locale>.json` keys are available as `plugin_<plugin-name>.<key>`. |

## Other names in the submodules

These are importable but not covered by the stability promise.

| Module | Names |
| --- | --- |
| `core.plugin_api.auth` | `require_roles`, `has_role`, `has_permission` |
| `core.plugin_api.config` | `ConfigSource`, `ConfigSchemaRegistry`, `reset_config_registry` (tests only) |
| `core.plugin_api.hooks` | [`register_decorated_hooks`](#register_decorated_hooks) |
| `core.plugin_api.i18n` | `TranslationManager`, `get_translation_manager` |
| `core.plugin_api.testing` | The pytest fixtures in [Testing fixtures](#testing-fixtures) |

## Details

### `hook`

```python
hook(point: str, *, priority: int = 50, failure_mode: str = "continue")
```

Tags the function with registration details and returns it unchanged. It doesn't subscribe anything on its own: pass the decorated functions to `register_decorated_hooks` from your `register_hooks(hooks)` function.

`failure_mode` is `continue` or `abort`. See [When handlers run](../architecture/hooks-and-events.md#when-handlers-run) for what each does.

### `register_decorated_hooks`

```python
register_decorated_hooks(hooks: HookManager, *handlers) -> int
```

Subscribes every function that carries `@hook` details and returns how many subscriptions it made. A function decorated more than once is subscribed once per decorator.

```python
from core.plugin_api import hook
from core.plugin_api.hooks import register_decorated_hooks


@hook("course.completed")
async def award_badge(ctx):
    ...


def register_hooks(hooks):
    register_decorated_hooks(hooks, award_badge)
```

### `require_capability`

```python
require_capability(capability_key: str, **options)
```

Returns a FastAPI dependency that signs the user in and refuses the request unless they hold the capability. List the key in your manifest's `capabilities`; while the plugin is installed or enabled, administrators can grant it to roles. See [Register a plugin's capabilities](../architecture/capability-catalog.md#register-a-plugins-capabilities).

| Option | Default | Effect |
| --- | --- | --- |
| `admin_bypass` | `False` | Administrators pass without the capability, so the route works before any role has it. |
| `tenant_context` | `False` | Kept for older callers; a request in a tenant is checked against that tenant either way. |
| `context_param` | `None` | Path or query parameter that names the permission context. |
| `context_id` | `None` | A fixed permission context. |
| `context_resolver` | `None` | `async def resolver(request, *, dml, tenant_id, service) -> UUID \| None` for a context you have to look up. |
| `mandatory_tenant` | `True` with a `context_resolver`, otherwise `False` | Refuses requests that have no tenant. |
| `denied_status_code` | `403` | Pass `404` to hide that the resource exists. |
| `denied_detail` | `None` | Replaces the default denial message. |

A route guarded only by `get_current_active_user` is open to every signed-in user in every tenant.

```python
from typing import Annotated

from core.plugin_api import APIRouter, Depends, require_capability
from core.plugin_api.auth import User

router = APIRouter()


@router.post("/items")
async def create_item(
    user: Annotated[User, Depends(require_capability("awesome.manage", admin_bypass=True))],
):
    ...
```

### `get_config_registry`

```python
get_config_registry() -> ConfigSchemaRegistry
```

Returns the one settings registry the process shares with the settings resolver and the administrator settings screens. Register your plugin's namespace on it from `settings_schema.py`; [Declare settings in a plugin](../architecture/config-service.md#declare-settings-in-a-plugin) has an example.

### `register_task`

```python
register_task(*args, **kwargs)
```

Same arguments as Celery's `@app.task(...)`. Name tasks `plugins.<plugin-name>.<task>`.

```python
# tasks.py
from core.plugin_api import register_task


@register_task(name="plugins.awesome.send_digest")
def send_digest(user_id: str) -> None:
    ...


beat_schedule = {
    "awesome-nightly": {"task": "plugins.awesome.send_digest", "schedule": 3600.0, "args": []},
}
```

Enqueue it with `send_digest.delay(...)` from a hook handler or a route.

- The worker imports `tasks.py` from every plugin it discovers: in-tree, in `EXTERNAL_PLUGINS_DIRS`, or installed as a package.
- A `beat_schedule` runs whether or not the plugin is installed or enabled, for the platform or for a tenant. A scheduled task must check that itself.

### Testing fixtures

`core.plugin_api.testing` provides pytest fixtures. Each one returns an async function:

| Fixture | Returned function | Does |
| --- | --- | --- |
| `plugin_test_app` | `(plugin_path) -> app` | Builds a FastAPI app with only that plugin loaded. |
| `install_plugin` | `(app, name) -> None` | Runs the install pipeline and commits to the database `DATABASE_URL` names. Use a throwaway database that already has the core tables. |
| `enable_plugin_for_tenant` | `(app, name, tenant_id=None) -> UUID` | Enables the plugin for a tenant, creating the tenant if needed, and returns its ID. |
| `fake_event` | `(app, point, tenant_id=None, **payload) -> None` | Fires a hook. A per-tenant plugin's handlers run only when you pass a tenant that has it enabled. |

`fake_admin_token` yields a placeholder token; override it in your `conftest.py` if you need a real one. [Package and test a plugin](./packaging-and-testing.md) shows the fixtures in use.

## Related

- [Plugin system](../architecture/plugin-system.md): how plugins are loaded and kept apart
- [Build your first plugin](./build-a-plugin.md)
- [Hooks and events](../architecture/hooks-and-events.md)
