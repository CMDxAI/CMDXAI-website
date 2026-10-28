---
id: layers
title: Architecture layers
sidebar_label: Layers
sidebar_position: 1
doc_type: explanation
audience: developers
source_prd: 113344513
ai_drafted: true
last_verified: 2026-10-25
tags: [architecture]
---

CMDX splits each feature into layers, and each layer has one job. In the backend, routes handle HTTP, services hold the business rules, and repositories talk to the database. In the app, screens draw, hooks manage server state, and data files describe endpoints. This page explains what each layer owns and why the boundaries sit where they do.

These are conventions, not rules a tool enforces. Most of the code follows them, and review is where they are kept. New code follows them.

## Backend

### The layers in a module

A backend module under `modules/` keeps each layer in its own folder.

| Layer | Folder | Owns | Does not |
| --- | --- | --- | --- |
| Routes | `api/` | The HTTP surface: paths, status codes, authentication and permission dependencies, and the response envelope. | Hold business rules or build queries. |
| Schemas | `schemas/` | The request and response shapes, as Pydantic models. | Know about the database. |
| Services | `services/` | The business rules: validation that needs data, workflows, hooks, events and caching. | Know about HTTP. |
| Repositories | `repositories/` | Reading and writing the module's models, including the tenant filter. | Make business decisions. |
| Models | `models/` | The SQLAlchemy tables. | Contain behaviour beyond the mapping. |

A request moves down the layers and the result moves back up: the route validates the request against a schema and calls a service; the service calls one or more repositories; the route wraps the service's result in the response envelope.

Dependencies point down only. A route may import services and schemas, a service may import repositories, and a repository imports models. A repository should not call a service, and a route should not call a repository directly.

### Why the boundaries sit here

- **Services don't know about HTTP**, so the same rule runs from an API call, a Celery task or a script, and can be tested without a web server.
- **Repositories own the queries**, so tenant filtering and soft deletion are applied where the data is read, not left to each service to remember. See [Multi-tenancy](./multi-tenancy.md).
- **Schemas sit at the edge**, so the API contract can change without changing the tables, and the OpenAPI description is generated from them.

### `core/` and `modules/`

`core/` is the framework and `modules/` are the features built on it. Modules import from `core/`; `core/` should not import from a feature module. A few parts of `core/` still do. New code does not add more.

When one module needs another, it goes through that module's services, events or hooks. A few services still use another module's repositories; new code does not.

### Data access

Two styles of data access exist, and both go through the request's database session:

- **Repository classes** built on `core.database.repository.SQLAlchemyRepository`. They work with model instances and support filtering, pagination and bulk operations.
- **The `DB` facade** in `core.database.dml`. It works with plain dictionaries and table names, for example `get_record("users", {"email": ...})`.

### One transaction per request

The `get_db` dependency opens one database session for the request. Every dependency that asks for it in the same request gets the same session, including the `DB` facade from `get_dml`.

- When the request succeeds, the session commits once at the end.
- When anything raises, the session rolls back, so a request never leaves half its changes behind.
- Callbacks registered to run after the commit, such as domain-event hooks, run only once the commit succeeds, never for a rolled-back change.

Read-only endpoints can ask for `get_read_db` instead, which routes to a read replica when one is configured and falls back to the primary after a write in the same request.

### Responses

Routes return the `BaseResponse` envelope from `core.utils.responses`, built with `success_response`, or a paginated envelope for lists. Validation and server errors are turned into a consistent error shape by exception handlers registered in `main.py`. See [Errors](../api/errors.md) and [Pagination and filtering](../api/pagination-and-filtering.md).

## App

The app splits each feature the same way, from the screen down to the endpoint.

| Layer | Folder | Owns | Does not |
| --- | --- | --- | --- |
| Screens | `screens/` | Layout and interaction. They read a flat view model from a hook: data, loading, error and reload. | Import React Query or build URLs. |
| Hooks | `hooks/` | Server state with React Query: queries, cache invalidation and turning a query result into the view model. | Build URLs. |
| Data | `data/` | One file per endpoint group: wire types, URLs, fetch and write functions, mapping to view models, and the query keys. | Import React or React Query. |

Each layer depends only on the one below it.

- **`data/` has no React**, so endpoint code is tested with plain Jest, without rendering anything.
- **Query keys live beside the fetchers**, so a query and the invalidation meant to match it cannot drift apart.
- **Screens never see React Query**, so the data library can change without touching a screen.

Within a domain, files import each other with relative paths. Each route file under `app/` only re-exports a screen.

Shared UI lives in `components/`, in tiers from basic elements up to page templates. Plumbing used everywhere, such as the API client, authentication, storage and theming, lives in `core/`.

## Next

- [Multi-tenancy](./multi-tenancy.md): how the tenant filter in repositories works
- [Hooks and events](./hooks-and-events.md): how modules react to each other
- [Coding standards](../contributing/coding-standards.md)
