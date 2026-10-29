---
id: build-a-plugin
title: Build your first plugin
sidebar_label: Build a plugin
sidebar_position: 1
doc_type: tutorial
audience: developers
source_prd: none
ai_drafted: true
last_verified: 2026-10-28
tags: [plugins, hooks]
---

## What you will build

A plugin called `greetings` that adds an API route to CMDX and writes a log line each time someone creates a course. You generate it, install it, enable it for your tenant, call its route, and then add a hook handler. It takes about 20 minutes.

## Before you start

- **A running CMDX.** Finish [Install CMDX and create a course](/getting-started/quick-start) first. This tutorial uses the same Docker Compose stack, your Super Administrator's email and password, and the tenant the install wizard created.
- **Python 3.11 or later** on your machine, to run the plugin generator. It uses only the standard library.
- **curl** and **jq**, to call the API.

Run every command from the `cmdx-LMS` folder. The Docker Compose commands use the same file as the quick-start, `docker-compose-build.yml`. That file mounts the `backend` folder into the containers, so a plugin you add on your machine is visible to the backend without rebuilding the image.

This tutorial was tested on 2026-10-28 with Docker 29.5.2 and Docker Compose 5.3.1 on macOS.

## Step 1: Generate the plugin

The generator writes a working plugin into `backend/plugins/`:

```bash
python3 backend/scripts/create_plugin.py greetings --author "<your-name>"
```

The output lists each file it wrote:

```text
Scaffolding 'greetings' (local) in <path-to>/cmdx-LMS/backend/plugins/greetings
  + <path-to>/cmdx-LMS/backend/plugins/greetings/__init__.py
  + <path-to>/cmdx-LMS/backend/plugins/greetings/manifest.py
  ...
  + <path-to>/cmdx-LMS/backend/plugins/greetings/README.md

Done.  Try:
  cd <path-to>/cmdx-LMS/backend && python -m pytest -c pytest.ini <path-to>/cmdx-LMS/backend/plugins/greetings/tests
```

A plugin name is lowercase letters, digits and underscores, starting with a letter. It must not match any plugin CMDX already discovers. The generator checks only the folders in `backend/plugins/`, not the examples in `backend/plugins/examples/`. If you name a plugin `hello_plugin`, the loader keeps the example and skips yours as a duplicate.

## Step 2: Read what you generated

Three files define what the plugin adds to CMDX.

`manifest.py` declares the plugin:

```python
manifest = PluginManifest(
    name="greetings",
    type=PluginType.LOCAL,
    version="0.1.0",
    db_version=2026102800,
    display_name="Greetings",
    description="TODO: describe your plugin",
    author="<your-name>",
    license="MIT",
    min_core_version=">=1.0",
    dependencies=[
        PluginDependency(name="core.auth", version=">=1.0"),
    ],
    capabilities=["greetings.view"],
    settings_namespace="greetings",
    multitenant="per_tenant",
    # Add every table with a user-keyed column, e.g.
    # PersonalDataTable(table="plg_greetings_visits") (import it from
    # core.plugin_api), so the GDPR export includes its rows and
    # erasure deletes them.
    personal_data=[],
)
```

Your `db_version` is the date you ran the generator, followed by `00`.

| Field | What it does here |
| --- | --- |
| `capabilities` | Adds the permission `greetings.view` to the capability catalog when the plugin is installed. |
| `settings_namespace` | The plugin's settings use keys that start with `greetings.`. `settings_schema.py` declares one, `greetings.example_setting`. |
| `multitenant` | `per_tenant`: the plugin is switched on for each tenant separately. |
| `personal_data` | Empty, because the plugin's table holds no rows about a user. |

`db/install.py` creates the plugin's table, `plg_greetings_items`. Every plugin table name starts with `plg_<plugin-name>_`.

`api.py` adds one route. CMDX mounts a plugin's routes under `/api/v1/plugins/<plugin-name>`, so this one is `GET /api/v1/plugins/greetings/items`:

```python
router = APIRouter(tags=["greetings"])


@router.get("/items", response_model=BaseResponse[list[ItemOut]])
async def list_items(
    dml: Annotated[DB, Depends(get_dml)],
    _user: Annotated[User, Depends(require_capability("greetings.view", admin_bypass=True))],
):
    rows = await svc.list_items(dml)
    return success_response([ItemOut(id=str(r["id"]), label=r["label"]) for r in rows])
```

The route needs the plugin's `greetings.view` capability. `admin_bypass=True` lets administrators through without it, so your Super Administrator can call the route before you grant the capability to any role.

## Step 3: Validate and install

Check the plugin before you install it:

```bash
docker compose -f docker-compose-build.yml exec backend python -m scripts.plugin validate greetings
```

The output is `OK   greetings`. If a check fails, the output starts with `FAIL` and lists each problem.

Install it. Installing creates the plugin's table and adds its capability to the catalog:

```bash
docker compose -f docker-compose-build.yml exec backend python -m scripts.plugin install greetings
```

The output is `installed greetings (1 migration(s) applied)`.

## Step 4: Enable it for your tenant

A per-tenant plugin is enabled for one tenant at a time, so you need your tenant's id. First set the backend's base URL:

```bash
BASE_URL=<backend-base-url>
```

Sign in to the API and keep the token:

```bash
TOKEN=$(curl -s -X POST $BASE_URL/api/v1/tokens \
  --data-urlencode 'username=<admin-email>' \
  --data-urlencode 'password=<admin-password>' | jq -r .data.access_token)
```

Use the Super Administrator you created in the install wizard. The token lasts 30 minutes, the default for `ACCESS_TOKEN_EXPIRE_MINUTES`. If you take longer, run this command again to get a new one.

List the tenants you belong to:

```bash
curl -s $BASE_URL/api/v1/organizations/mine \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | {id, slug}'
```

Keep the `id` of the tenant whose slug you chose in the wizard:

```bash
TENANT_ID=<tenant-id>
```

Enable the plugin for that tenant:

```bash
docker compose -f docker-compose-build.yml exec backend python -m scripts.plugin enable greetings --tenant-id "$TENANT_ID"
```

The output is `enabled greetings for tenant <tenant-id>`.

## Step 5: Restart the backend and the Celery worker

The backend mounts plugin routes and hook handlers when it starts, and only for enabled plugins. The Celery worker loads enabled plugins once per process, so events from background jobs reach the plugin only after it restarts. Restart both:

```bash
docker compose -f docker-compose-build.yml restart backend celery_worker
```

The restart returns before the backend is ready. Wait until it answers on `/health`:

```bash
until curl -fsS $BASE_URL/health >/dev/null; do sleep 5; done
```

Check that the plugin loaded:

```bash
docker compose -f docker-compose-build.yml logs backend | grep '"Plugin loaded"' | grep greetings
```

The backend logs in JSON. It runs two uvicorn workers by default (`WORKERS=2`), and each one loads plugins, so you see one line per worker. Each line contains `"message": "Plugin loaded"` and `"plugin.name": "greetings"`.

## Step 6: Call the plugin's route

Call the route with your token. Send the tenant id in the `X-Tenant-ID` header, because a per-tenant plugin answers only in a tenant that has it enabled:

```bash
curl -s $BASE_URL/api/v1/plugins/greetings/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" | jq
```

The response has an empty list, because the table has no rows yet:

```json
{
  "success": true,
  "data": [],
  "message": null,
  "meta": null,
  "pagination": null,
  "errors": null
}
```

Without the header, the route answers `404` with `Plugin 'greetings' not enabled`.

## Step 7: Handle a hook

A hook handler runs when something happens in CMDX. The generator already wrote one in `backend/plugins/greetings/hooks.py`, `on_course_created()`, but left it switched off. It imports from `core.plugin_api`, the only package a plugin should import from:

```python
async def on_course_created(ctx: HookContext) -> None:
    logger.info("greetings: course created: %s", ctx.data.get("course_id"))
```

Switch it on. At the end of the file, in `register_hooks()`, remove the `#` before `hook_manager.register(...)` and delete the `pass` line. The function now reads:

```python
def register_hooks(hook_manager: HookManager) -> None:
    # Example: react to a published hook point. A per_tenant plugin's
    # handlers only run for events that carry a tenant which enabled it.
    hook_manager.register("course.created", on_course_created)
```

`register_hooks()` is called when the backend loads the plugin. It subscribes `on_course_created` to the `course.created` hook point. The handler receives a `HookContext`: `ctx.data` is the payload and `ctx.tenant_id` is the tenant the course was created in. Because the plugin is per-tenant, the handler runs only for courses created in a tenant that has the plugin enabled.

Restart the backend and the Celery worker so they register the handler, then wait for the backend:

```bash
docker compose -f docker-compose-build.yml restart backend celery_worker
until curl -fsS $BASE_URL/health >/dev/null; do sleep 5; done
```

Create a course in your tenant to fire the hook. A course needs a category, so list your tenant's categories first:

```bash
curl -s $BASE_URL/api/v1/courses/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" | jq '.data[] | {id, slug}'
```

This lists top-level categories only. The quick-start category is top-level, so it is in the list. To list the categories under a parent, add `?parent_id=<category-id>` to the URL.

Keep the `id` of the category you created in the quick-start:

```bash
CATEGORY_ID=<category-id>
```

Create the course. The command prints the new course's id:

```bash
curl -s -X POST $BASE_URL/api/v1/courses \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -H 'Content-Type: application/json' \
  -d "{\"full_name\": \"Plugin hook test\", \"category_id\": \"$CATEGORY_ID\"}" | jq -r .data.id
```

Look for the handler's log line:

```bash
docker compose -f docker-compose-build.yml logs backend | grep "greetings: course created"
```

The line contains `"logger": "plugins.greetings.hooks"` and `"message": "greetings: course created: <course-id>"`, with the id the previous command printed.

## What you built

You generated a plugin, installed it, enabled it for one tenant, and called its route. You also subscribed a handler to a hook point. To confirm everything at once, list the plugins:

```bash
docker compose -f docker-compose-build.yml exec backend python -m scripts.plugin list
```

The `greetings` row shows `enabled`, with the scope `per_tenant`:

```text
NAME                     VERSION    STATUS       SCOPE        SOURCE
announcements            0.1.0      discovered   global       filesystem
gamification             1.1.1      discovered   per_tenant   filesystem
greetings                0.1.0      enabled      per_tenant   filesystem
hello_plugin             1.0.0      discovered   per_tenant   filesystem
```

Each time you change a plugin's Python code, restart the backend and `celery_worker`.

## Next

- [Plugin system](../architecture/plugin-system.md): the manifest, the lifecycle and who can install and enable plugins
- [Hooks and events](../architecture/hooks-and-events.md): every hook point and its payload
- [Package and test a plugin](./packaging-and-testing.md): run the plugin's tests and ship it
