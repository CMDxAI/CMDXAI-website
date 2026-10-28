---
id: packaging-and-testing
title: Package and test a plugin
sidebar_label: Package and test
sidebar_position: 3
doc_type: how-to
audience: developers
source_prd: none
ai_drafted: true
last_verified: 2026-10-28
tags: [plugins, testing]
---

Check a plugin with `validate`, run its tests, and package it so that a CMDX deployment can find it.

## Prerequisites

- A plugin, such as the `greetings` plugin from [Build your first plugin](./build-a-plugin.md).
- The Docker Compose stack from the [quick-start](/getting-started/quick-start), started with `docker-compose-build.yml`. That file mounts the `backend` folder into the backend container.

Run the commands from the `cmdx-LMS` folder. Inside the container, the `backend` folder is `/app`.

## Validate the plugin

```bash
docker compose -f docker-compose-build.yml exec backend python -m scripts.plugin validate greetings
```

A valid plugin prints:

```text
OK   greetings
```

Otherwise the command prints `FAIL greetings`, lists each problem and exits with status 1. To check every plugin the backend can find, use `--all` in place of the name. For what `validate` checks, see [Plugin system](../architecture/plugin-system.md#how-plugins-are-kept-apart).

## Test the plugin

Keep tests in the plugin's `tests/` folder. Run them from the `backend` folder with the backend's pytest settings:

```bash
docker compose -f docker-compose-build.yml exec backend python -m pytest -c pytest.ini plugins/greetings/tests
```

The generated plugin has one test, which checks its manifest:

```text
1 passed
```

Run pytest from the `backend` folder and pass `-c pytest.ini`. From any other folder, Python can't import `core`. Without `-c pytest.ini`, a test file outside `backend/` doesn't get the backend's settings, and async tests fail.

### Load the plugin in a test

`core.plugin_api.testing` provides pytest fixtures. Two of them load a plugin and fire hooks without a database:

| Fixture | Gives you |
| --- | --- |
| `plugin_test_app` | `await plugin_test_app(<path-to-plugin>)` returns a FastAPI app with every plugin in that folder's parent loaded: tables registered, hook handlers registered and routes mounted. |
| `fake_event` | `await fake_event(app, <hook-point>, tenant_id=None, **data)` runs that hook point's handlers with `data` as `ctx.data`. |

Import the fixtures in the plugin's `tests/conftest.py`:

```python title="tests/conftest.py"
from core.plugin_api.testing import fake_event, plugin_test_app  # noqa: F401
```

For a `global` plugin, this test fires `course.created` and checks the plugin's handler logged it:

```python title="tests/test_hooks.py"
import logging
from pathlib import Path

from core.plugin_api.testing import fake_event, plugin_test_app  # noqa: F401

PLUGIN = Path(__file__).resolve().parent.parent


async def test_course_created_reaches_handler(plugin_test_app, fake_event, caplog):
    caplog.set_level(logging.INFO)
    app = await plugin_test_app(PLUGIN)
    await fake_event(app, "course.created", course_id="c-1")
    assert "course created: c-1" in caplog.text
```

The test assumes `hooks.py` registers `on_course_created`, as in step 7 of the tutorial.

A `per_tenant` plugin's handlers, such as the tutorial's, run only for a tenant that has the plugin enabled. Enabling needs a database, so with these fixtures alone, `fake_event` reaches only a `global` plugin's handlers.

:::note
Fixtures that install a plugin and enable it for a tenant against a database will be covered here later.
:::

## Package the plugin

The backend looks for plugins in three places when it starts. Pick one:

| Mode | Where the plugin goes | Use it for |
| --- | --- | --- |
| In the repository | `backend/plugins/<name>/` | Plugins that ship with CMDX |
| External folder | A folder listed in `EXTERNAL_PLUGINS_DIRS` | Developing a plugin outside the repository |
| Python package | An installed package with a `cmdx.plugins` entry point | Versioned releases |

In every mode, the plugin's folder or import package is named after `manifest.name`. If two places hold a plugin with the same name, the first one found wins: the repository, then external folders, then packages.

### External folder

1. Put each plugin in its own folder inside one parent folder, for example `/opt/cmdx-plugins/greetings/`.
2. Mount the parent folder into the backend container, and set `EXTERNAL_PLUGINS_DIRS` to its absolute path. Separate several paths with colons.

   <!-- TODO: verify on a full stack; tested offline only -->
   ```yaml title="docker-compose.plugins.yml"
   services:
     backend:
       volumes:
         - /opt/cmdx-plugins:/opt/cmdx-plugins:ro
       environment:
         EXTERNAL_PLUGINS_DIRS: /opt/cmdx-plugins
   ```

3. Restart the backend with the extra file:

   ```bash
   docker compose -f docker-compose-build.yml -f docker-compose.plugins.yml up -d backend
   ```

The Celery worker loads `tasks.py` only for plugins in `backend/plugins/`. Keep background tasks in a plugin that ships in the repository for now.

### Python package

1. Lay the package out with the plugin folder as the import package:

   ```text
   cmdx-greetings/
   ├── pyproject.toml
   └── src/
       └── greetings/
           ├── __init__.py
           ├── manifest.py
           ├── api.py
           ├── hooks.py
           ├── db/
           │   ├── __init__.py
           │   ├── install.py
           │   └── upgrade.py
           └── lang/
               └── en.json
   ```

2. Declare the entry point, and include the `lang` files as package data:

   ```toml title="pyproject.toml"
   [build-system]
   requires = ["setuptools>=61"]
   build-backend = "setuptools.build_meta"

   [project]
   name = "cmdx-greetings"
   version = "0.1.0"

   [project.entry-points."cmdx.plugins"]
   greetings = "greetings"

   [tool.setuptools.packages.find]
   where = ["src"]

   [tool.setuptools.package-data]
   "*" = ["lang/*.json"]
   ```

   The entry point's value is the import package. The backend imports `<package>.manifest` from it.

3. Build a wheel:

   ```bash
   python3 -m pip wheel --no-deps -w dist .
   ```

   The result is `dist/cmdx_greetings-0.1.0-py3-none-any.whl`.

4. Install the wheel into the Python environment the backend runs in, then restart the backend.

## Verify

List the plugins the backend found:

```bash
docker compose -f docker-compose-build.yml exec backend python -m scripts.plugin list
```

Your plugin appears with its version, status, scope and source. The source is `filesystem` for a plugin in the repository, `external` for an external folder, and `package` for a Python package. A plugin that is listed can be installed and enabled as in [Build your first plugin](./build-a-plugin.md).

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `ModuleNotFoundError: No module named 'core'` | pytest ran outside the `backend` folder. | Run `python -m pytest -c pytest.ini <path>` from `backend`. |
| `requested an async fixture ... with no plugin or hook that handled it` | The backend's pytest settings weren't loaded. | Add `-c pytest.ini`. |
| `error: plugin 'greetings' not discovered` | The backend can't see the plugin. | Check the folder name matches `manifest.name`, the external folder is mounted and listed in `EXTERNAL_PLUGINS_DIRS`, or the package is installed with its entry point. |
| `manifest.db_version (…) must equal the highest db/upgrade.py key (…)` | A new upgrade was added without updating the manifest, or the reverse. | Set `db_version` to the highest key in `upgrades`. |
| The plugin is missing from `list` and the log says `Plugin folder name … does not match manifest.name` | The folder is named differently from the plugin. | Rename the folder to `manifest.name`. |
