---
id: plugin-package-reference
title: Plugin package reference
sidebar_label: Package reference
sidebar_position: 4
doc_type: reference
audience: developers
source_prd: none
ai_drafted: true
last_verified: 2026-10-28
tags: [plugins]
---

The files a plugin package contains, the manifest fields, and what the backend does with each one. For how the pieces fit together, see [Plugin system](../architecture/plugin-system.md).

## Package layout

A plugin is a Python package whose folder name equals `manifest.name`. The backend reads only the files below; everything else is yours to organize.

| File | Must define | Read when | If missing |
| --- | --- | --- | --- |
| `manifest.py` | `manifest`, a `PluginManifest` | At start-up, to discover the plugin | The folder is skipped |
| `db/install.py` | `install_tables`, a list of `TableDefinition` | When the plugin loads, so the `DB` facade knows its tables, and on uninstall with purge | No tables are registered |
| `db/upgrade.py` | `upgrades`, a dict of `db_version` to an upgrade function | On install and upgrade | No migrations run |
| `db/uninstall.py` | `async def uninstall(dml, dbman)` | On uninstall with purge, before the tables are dropped | Only the tables are dropped |
| `settings_schema.py` | `schemas`, a list of `ConfigSchemaDefinition` | When the plugin loads, if `settings_namespace` is set | No settings are registered |
| `hooks.py` | `def register_hooks(hook_manager)` | When the plugin loads | No hook handlers |
| `api.py` | `router`, an `APIRouter` | When the plugin loads | No routes |
| `tasks.py` | Tasks made with `register_task`, and an optional `beat_schedule` dict | When the Celery worker starts | No background tasks |
| `lang/<locale>.json` | Translation strings | When the plugin loads | No translations |

At start-up the backend imports only the package and its `manifest.py`. It imports the other files when the plugin is installed or loaded.

## Where the backend looks

| Source | Package name |
| --- | --- |
| `backend/plugins/<name>/` | `plugins.<name>` |
| `backend/plugins/examples/<name>/` | `plugins.examples.<name>` |
| Each absolute path in `EXTERNAL_PLUGINS_DIRS`, separated by colons | `ext_plugins_<name>` |
| An installed package with an entry point in the `cmdx.plugins` group | The package's own name |

A folder whose name starts with `_` or `.` is ignored. If two sources hold a plugin with the same name, the first one found wins and the other is skipped with a warning.

## Manifest

```python title="manifest.py"
from core.plugin_api import PluginDependency, PluginManifest, PluginType

manifest = PluginManifest(
    name="greetings",
    type=PluginType.LOCAL,
    version="0.1.0",
    db_version=2026102800,
    display_name="Greetings",
    dependencies=[PluginDependency(name="core.auth", version=">=1.0")],
    capabilities=["greetings.view"],
    settings_namespace="greetings",
    multitenant="per_tenant",
)
```

| Field | Type | Default | Rules |
| --- | --- | --- | --- |
| `name` | `str` | required | 1 to 128 characters. Letters, digits and underscores, starting with a letter. Stored in lowercase. Must equal the folder name. |
| `type` | `PluginType` | required | One of the values in [Plugin types](#plugin-types). |
| `version` | `str` | required | A valid PEP 440 version, such as `1.2.0`. |
| `db_version` | `int` | required | 0 or more. Must equal the highest key in `db/upgrade.py` when that file has upgrades. |
| `display_name` | `str` | required | 1 to 255 characters. |
| `description` | `str` | `""` | |
| `author` | `str` | `""` | |
| `license` | `str` | `"MIT"` | |
| `homepage` | `str \| None` | `None` | |
| `min_core_version` | `str` | `">=0.0.0"` | A PEP 440 specifier. Not checked today; to require a core version, add a `core` dependency. |
| `dependencies` | `list[PluginDependency]` | `[]` | See [Dependencies](#dependencies). |
| `capabilities` | `list[str]` | `[]` | Each one is `<name>.<action>`, lowercase, with this plugin's name first. They are added to the capability catalog when the plugin is installed. |
| `settings_namespace` | `str \| None` | `None` | Letters, digits and underscores, starting with a letter. Required if `settings_schema.py` defines schemas. |
| `api_router_module` | `str \| None` | `"api"` | The module that holds `router`. `None` mounts no routes. |
| `multitenant` | `"global"` or `"per_tenant"` | `"per_tenant"` | Whether the plugin is enabled for the whole installation or per tenant. |
| `personal_data` | `list[PersonalDataTable]` | `[]` | See [Personal data](#personal-data). |

Capabilities come from the manifest only. A `permissions.py` file is not read.

### Plugin types

`PluginType` values: `auth`, `enrol`, `activity`, `qtype`, `report`, `notification`, `payment`, `integration`, `theme`, `block`, `local`, `format`. The type is a label: it doesn't change how the backend loads the plugin.

### Dependencies

`PluginDependency(name, version=">=0.0.0", optional=False)`.

| `name` form | Checked against |
| --- | --- |
| `core` | The CMDX core version |
| `core.<component>` | That core component's version, or the core version |
| `module:<module>` | The module's version. A module with no recorded version always passes. |
| `plugin:<plugin>` | The other plugin's `version`. The plugin must be discovered. |

`version` is a PEP 440 specifier such as `>=1.0,<2`. Installing fails if a required dependency isn't met. An `optional` dependency that isn't met is ignored. Plugins load after the plugins they depend on, and a dependency cycle fails.

### Personal data

`PersonalDataTable(table, user_column="user_id", keep=None, export=True)` declares a table with rows about a user.

| Field | Meaning |
| --- | --- |
| `table` | Must start with `plg_<name>_`. |
| `user_column` | The column that holds the user's ID. |
| `keep` | The reason to keep rows when the user is erased. If unset, erasure deletes the rows. |
| `export` | Set to `False` to leave the rows out of the user's data export, for example a per-user token. |

Every table in `install_tables` with a `user_id`, `learner_id`, `author_id` or `submitted_by` column must be declared.

## Tables

Describe each table once in `db/install.py` and create it from `db/upgrade.py`.

```python title="db/install.py"
from core.plugin_api import (
    ColumnType,
    FieldDefinition,
    TableDefinition,
    standard_id_field,
    standard_timestamp_fields,
)

items_table = TableDefinition(
    name="plg_greetings_items",
    fields=[
        standard_id_field(),
        FieldDefinition("label", ColumnType.STRING, length=255, nullable=False),
        *standard_timestamp_fields(),
    ],
)

install_tables = [items_table]
```

Name every table `plg_<name>_<table>`. Uninstalling with purge drops each table in `install_tables`.

| Class | Fields |
| --- | --- |
| `TableDefinition` | `name`, `fields`, `indexes=[]`, `foreign_keys=[]` |
| `FieldDefinition` | `name`, `type`, `length=None`, `precision=None`, `scale=None`, `nullable=True`, `default=None`, `primary_key=False`, `auto_increment=False`, `unique=False`, `index=False`, `native_json=False` |
| `IndexDefinition` | `name`, `fields`, `unique=False` |
| `ForeignKeyDefinition` | `name`, `fields`, `ref_table`, `ref_fields`, `on_delete="CASCADE"`, `on_update=None` |

`ColumnType` values: `integer`, `biginteger`, `smallinteger`, `string`, `text`, `boolean`, `float`, `decimal`, `datetime`, `date`, `time`, `uuid`, `json`, `binary`. `length` applies to `string`; `precision` and `scale` apply to `decimal`.

`standard_id_field()` returns a non-null `uuid` primary key named `id` that defaults to a new UUID. `standard_timestamp_fields()` returns non-null `created_at` and `updated_at` datetime fields that default to the current UTC time.

## Upgrades

```python title="db/upgrade.py"
from core.plugin_api import DB, DBManager

from .install import install_tables


async def upgrade_2026102800(dml: DB, dbman: DBManager) -> None:
    for table_def in install_tables:
        await dbman.create_table(table_def)


upgrades = {
    2026102800: upgrade_2026102800,
}
```

- Each key is a version number. The value is an `async` function that takes `dml` and `dbman`.
- Install and upgrade run, in ascending order, every upgrade whose key is above the version recorded for the plugin. After each one, the recorded version moves to its key.
- If an upgrade raises, the run stops and the install or upgrade fails.
- To change the schema, add a new upgrade with a higher key and set `db_version` to it.
- Uninstalling with purge forgets the recorded version, so a later install starts again from the first upgrade.

## Settings

```python title="settings_schema.py"
from core.plugin_api import ConfigSchemaDefinition, ConfigScope, ConfigValueType

schemas = [
    ConfigSchemaDefinition(
        key="greetings.example_setting",
        namespace="greetings",
        value_type=ConfigValueType.STRING,
        default="hello",
        description="An example setting.",
        allowed_scopes=[ConfigScope.GLOBAL, ConfigScope.TENANT],
    ),
]
```

Each schema's `namespace` must equal `manifest.settings_namespace`. For keys, scopes and how values resolve, see [Config service](../architecture/config-service.md).

## Hooks

```python title="hooks.py"
from core.plugin_api import HookContext, HookManager


async def on_course_created(ctx: HookContext) -> None:
    ...


def register_hooks(hook_manager: HookManager) -> None:
    hook_manager.register("course.created", on_course_created)
```

For a `per_tenant` plugin, handlers run only for events whose tenant has the plugin enabled. Hook points and handler options are in [Hooks and events](../architecture/hooks-and-events.md).

## Routes

The backend mounts the plugin's `router` at `/api/v1/plugins/<name>`. A route declared as `@router.get("/items")` is served at `/api/v1/plugins/<name>/items`.

- For a `per_tenant` plugin, every route requires a signed-in user and returns `404` with `Plugin '<name>' not enabled` when the caller's tenant doesn't have it enabled.
- A `global` plugin's routes have no tenant check and no sign-in check. Add your own, for example `require_capability`.
- Don't declare `GET /`, or the paths `install`, `upgrade`, `enable`, `disable`, `settings` or `reload` at the top of the router. The plugin management API uses them under the same prefix.
- Plugin routes appear in the running backend's OpenAPI document only while the plugin is loaded. They are not in an OpenAPI document generated without plugins.

## Background tasks

```python title="tasks.py"
from core.plugin_api.tasks import register_task


@register_task(name="plugins.greetings.send_digest")
def send_digest(user_id: str) -> None:
    ...


beat_schedule = {
    "greetings-nightly": {
        "task": "plugins.greetings.send_digest",
        "schedule": 3600.0,
        "args": [],
    },
}
```

- `register_task` takes the same arguments as Celery's `celery_app.task`. Name tasks `plugins.<name>.<task>`.
- Enqueue a task from a route or hook handler with `send_digest.delay(str(user_id))`.
- The worker finds `tasks.py` for plugins in `backend/plugins/` and `backend/plugins/examples/`.
- Scheduled tasks run whatever the plugin's state, so check that the plugin is enabled for the tenant before doing work.

## Translations

Put one JSON file per locale in `lang/`, named after the locale, such as `lang/en.json`. The backend prefixes every key with `plugin_<name>.`, so a key `title` is read as `t("plugin_greetings.title")`.

## Validate a package

From the `backend` folder, `python -m scripts.plugin validate <name>` checks that:

- the folder name matches `manifest.name`;
- `db_version` equals the highest key in `upgrades`, and every upgrade is callable;
- each capability is `<name>.<action>` and starts with the plugin's name;
- each settings schema uses `settings_namespace`;
- each dependency name starts with `core`, `module:` or `plugin:` and has a valid version range;
- every table with a user column is declared in `personal_data`, and each declaration names one of the plugin's tables and an existing column.

## Related

- [Build your first plugin](./build-a-plugin.md)
- [Packaging and testing](./packaging-and-testing.md)
- [Plugin system](../architecture/plugin-system.md)
