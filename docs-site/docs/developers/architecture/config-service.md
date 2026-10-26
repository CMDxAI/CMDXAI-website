---
id: config-service
title: Configuration
sidebar_label: Configuration
sidebar_position: 5
doc_type: reference
audience: developers
source_prd: "216694785"
ai_drafted: true
last_verified: 2026-10-26
tags: [architecture, configuration]
---

CMDX settings that administrators can change at run time are declared in code as config keys and stored in the database by scope. This page lists the parts: the schema registry in `core.config.lib.registry`, the stored entries in the `config_entries` table, and the audit trail in `config_audit_log`.

Settings read only from the environment at start-up, such as database URLs, are covered on the environment variables page for administrators.

## Summary

| Part | Where | What it does |
| --- | --- | --- |
| Schema registry | `get_config_registry()` | Holds every key's type, default, allowed scopes and validation rules. Filled at start-up. |
| Key definition | `ConfigSchemaDefinition` | Declares one key. |
| Stored entries | `config_entries` table | One row per key, scope and scope ID. |
| Audit trail | `config_audit_log` table | One row per create, update or delete of a stored entry. |
| Data functions | `core.config.service` | Read and write stored entries through the `DB` facade. Every write adds an audit row. |

## Keys and namespaces

A key is a dotted name: `<namespace>.<name>`, for example `developer.log_level`. A namespace groups the keys of one module or plugin.

- A namespace is lowercase letters, digits and underscores. It starts with a letter and is at most 50 characters.
- Every key starts with its namespace and a dot.
- A key belongs to exactly one namespace. Registering the same key under a second namespace raises `DuplicateKeyError`.

Namespaces registered today:

| Namespace | Registered by | Keys listed on |
| --- | --- | --- |
| `developer` | Developer settings module, at start-up | [Logging](./logging.md) and [developer settings](../../administrators/configuration/developer-settings.md) |
| `features` | Developer settings module, at start-up | [Feature flags](./feature-flags.md) |
| `<plugin settings namespace>` | The plugin loader, when it loads a plugin | The plugin's own documentation |

## Key definition fields

`ConfigSchemaDefinition` is a Pydantic model. Plugins import it from `core.plugin_api`.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `key` | `str` | required | Full key name. Must start with `<namespace>.` |
| `namespace` | `str` | required | Namespace the key belongs to. |
| `value_type` | `ConfigValueType` | required | One of the value types below. |
| `default` | any | `None` | Code default, used when no other source has a value. |
| `description` | `str` | required | Shown to administrators. |
| `allowed_scopes` | `list[ConfigScope]` | `[GLOBAL]` | Scopes at which the key can be stored. |
| `is_required` | `bool` | `False` | The key must resolve to a value. |
| `is_sensitive` | `bool` | `False` | The value is a secret. Always `True` for the `secret` type. |
| `is_hot_reloadable` | `bool` | `True` | `False` means a change takes effect after a restart. |
| `enum_choices` | `list[str]` | `None` | Allowed values. Required for the `enum` type. |
| `validation_regex` | `str` | `None` | Pattern a string value must match. |
| `env_var_mapping` | `str` | `None` | Environment variable that can supply the value. |
| `file_path_mapping` | `str` | `None` | File whose contents can supply the value. |
| `metadata` | `dict` | `{}` | Free-form extra data. |

The model checks itself when it is created. A key that doesn't start with its namespace, or an `enum` key without `enum_choices`, raises `ValueError`.

## Value types

`ConfigValueType` sets how a value is checked when it is written. Stored values are always strings.

| Type | Accepts |
| --- | --- |
| `string` | Any text. |
| `integer` | A whole number, such as `250`. |
| `float` | A decimal number, such as `0.25`. |
| `boolean` | `true`, `1`, `yes`, `on` or `false`, `0`, `no`, `off`, in any case. |
| `json` | A JSON object or array, or a string that parses as one. |
| `secret` | Any text. The key is marked sensitive. |
| `enum` | One of the key's `enum_choices`. |
| `url` | Text that starts with `http://` or `https://`. |
| `email` | Text with an `@` and a dot in the domain. |
| `duration` | A number and a unit: `30s`, `15m`, `24h` or `7d`. |

After the type check, the value must match `validation_regex` if one is set. It then passes through any custom validators registered for the key.

## Scopes

`ConfigScope` sets where a stored value applies. A key can be stored only at a scope in its `allowed_scopes`.

| Scope | `scope_id` | Applies to |
| --- | --- | --- |
| `global` | none | The whole installation. |
| `tenant` | The tenant's ID | One tenant. |
| `component` | `<component-type>:<component-id>`, for example `course:<course-id>` | One component, such as a course. No key registered today allows this scope. |

## Resolution order

When code reads a key, the first source that has a value wins:

1. A stored entry at the most specific scope the key allows and the request has: component, then tenant, then global. Only active entries count.
2. The environment variable in `env_var_mapping`.
3. The file in `file_path_mapping`.
4. The code default.

If no source has a value, the key resolves to `None`.

:::note
A shared resolver for every namespace is being settled. Until then, each module resolves its own keys in the order above. A module's page lists any exception.
:::

## Stored entries

Each row in `config_entries` holds one value. The key, scope and scope ID together are unique.

| Column | Description |
| --- | --- |
| `key`, `namespace` | The key and its namespace. |
| `value` | The value as a string. Secret fields in `site.*` values are encrypted before they are stored. |
| `scope`, `scope_id` | Where the value applies. |
| `is_active` | `False` after the entry is deleted. Inactive entries are ignored when a key is resolved. |
| `updated_at`, `updated_by` | When and by whom the entry last changed. |

Deleting an entry sets `is_active` to `False` and keeps the row. The key then falls back to the next source in the resolution order.

## Audit trail

Every create, update and delete through `core.config.service` adds a row to `config_audit_log`:

| Column | Description |
| --- | --- |
| `key`, `scope`, `scope_id` | The entry that changed. |
| `action` | `created`, `updated` or `deleted`. |
| `old_value`, `new_value` | The stored value before and after. |
| `changed_by`, `changed_at` | Who made the change and when. |
| `change_reason` | Free text. The developer settings endpoints require it. |

## Data functions

`core.config.service` reads and writes stored entries. Each function takes the `DB` facade as its first argument. These functions aren't part of `core.plugin_api`.

| Function | Does |
| --- | --- |
| `get_config(dml, key, scope, scope_id)` | Returns one entry, or `None`. |
| `get_configs_by_namespace(dml, namespace, scope=, scope_id=, active_only=True)` | Returns a namespace's entries, ordered by key. |
| `upsert_config(dml, data, changed_by=)` | Creates the entry, or updates it if one exists for the key, scope and scope ID. |
| `delete_config(dml, key, scope, scope_id, changed_by=, change_reason=)` | Marks the entry inactive. Returns `False` if there was none. |
| `get_audit_log(dml, key=, actor=, action=, tenant_id=, ...)` | Returns audit rows, newest first. |

These functions don't check the registry. Validate a value with `registry.validate_value()` and its scope with `registry.validate_scope()` before you write it.

## Examples

### Declare settings in a plugin

A plugin names its namespace in its manifest's `settings_namespace`. It lists its keys in a module-level `schemas` list in `settings_schema.py`:

```python title="settings_schema.py"
from core.plugin_api import ConfigSchemaDefinition, ConfigScope, ConfigValueType

schemas = [
    ConfigSchemaDefinition(
        key="badges.points_per_completion",
        namespace="badges",
        value_type=ConfigValueType.INTEGER,
        default=100,
        description="Points awarded for each course completion.",
        allowed_scopes=[ConfigScope.GLOBAL, ConfigScope.TENANT],
    ),
]
```

The plugin loader registers the list when it loads the plugin. You don't call `register_namespace()` yourself.

### Validate a value

```python
from core.plugin_api import ConfigScope, get_config_registry

registry = get_config_registry()
key = "badges.points_per_completion"

print(registry.validate_value(key, "250"))

try:
    registry.validate_value(key, "lots")
except Exception as exc:
    print(exc)

try:
    registry.validate_scope(key, ConfigScope.COMPONENT)
except Exception as exc:
    print(exc)
```

Output:

```text
250
Validation failed for 'badges.points_per_completion': Cannot convert to integer: invalid literal for int() with base 10: 'lots'
Validation failed for 'badges.points_per_completion': Scope 'component' is not allowed for this key. Allowed scopes: ['global', 'tenant']
```

Both failures raise `ConfigValidationError`.

## Related

- [Plugin system](./plugin-system.md): where a plugin's settings are registered
- [Feature flags](./feature-flags.md): the `features` namespace
- [Logging](./logging.md): the logging keys in the `developer` namespace
- [Multi-tenancy](./multi-tenancy.md): how the tenant for a request is found
