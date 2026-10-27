---
id: multi-tenancy
title: Multi-tenancy
sidebar_label: Multi-tenancy
sidebar_position: 2
doc_type: explanation
audience: developers
source_prd: 113344513
ai_drafted: true
last_verified: 2026-10-27
tags: [architecture, tenants]
---

One CMDX installation serves many tenants. Each tenant is an organization with its own members, courses and settings, and no tenant can see another's data. This page explains how tenants are stored, how CMDX works out which tenant a request is for, and what tenant-aware code has to do.

## One schema, tenant rows

All tenants share one database and one schema. A table that holds tenant data has a tenant column, `tenant_id` or `organization_id`, and every row records the tenant it belongs to. Isolation comes from filtering on that column, not from separate schemas or databases.

A shared schema keeps one set of migrations for every tenant, lets a platform administrator work across tenants, and makes adding a tenant a matter of adding a row. The cost is that every query on tenant data must apply the filter, which is why the filter lives in the repositories. See [Architecture layers](./layers.md).

## Organizations and members

A tenant is an **organization**. An organization has:

- a **slug**, unique across the installation, which also names its subdomain
- an optional custom **domain**
- an **active** flag
- **departments**, which can be nested

A user belongs to an organization through a **membership**. A membership has a role in the organization, such as instructor or learner, an optional department, and can be deactivated or given an expiry date. A user can be a member of more than one organization.

## How a request finds its tenant

The tenant for a request comes from one of these sources:

| Source | Example |
| --- | --- |
| The `X-Tenant-ID` header | `X-Tenant-ID: 3f2b…` (the organization's id). The app sends it with its API requests. |
| An `org_id` in the URL path | `/api/v1/organizations/<org-id>/members` |
| The subdomain | `acme.example.com`, where `acme` is the organization's slug and `example.com` is the `DEFAULT_TENANT_DOMAIN` setting |

The rules are strict, so a request can't be steered into another tenant by accident:

- A malformed id is rejected with `400`.
- If two sources name different tenants, the request is rejected with `400`.
- An id that names no organization, or a deleted one, is rejected with `400`.

Knowing the tenant is not enough: the caller must also belong to it. The membership-bound tenant dependency (below) refuses the request with `403` unless the caller has an active, unexpired membership in that tenant. Only a role granted platform-wide lets a caller act in a tenant they don't belong to. The same role granted inside one organization counts in that organization only.

## Writing tenant-aware code

New routes take the tenant from a dependency, never from the request body:

- Use the membership-bound tenant dependency from `core.auth.dependencies` (`MembershipBoundTenantDep`, built on `resolve_membership_bound_tenant` in `core.tenancy.dependencies`). It resolves the tenant by the rules above and checks the caller's membership. Only a platform super administrator is exempt.
- Most modules also expose their own tenant dependency, `TenantContextDep`, in the module's `dependencies.py`. It resolves the tenant by the same rules and checks membership with `require_tenant_membership` from `core.tenancy.dependencies`, which also lets platform administrators and auditors through. A module that writes its own resolver must make the same call.
- Pass the tenant down to the service and the repository.
- Don't accept a tenant field in request schemas.

In the repository:

- **Reads:** apply `core.tenancy.scope.apply_tenant_scope(query, Model, tenant_id)` to every query on tenant data.
- **Writes:** set the tenant on new rows with `stamp_tenant(values, tenant_id)`.
- **Single-row reads and changes:** filter by the tenant as well as the id. A row from another tenant is then not found, and the route returns `404`, not `403`, so the response doesn't confirm that the row exists.

Elsewhere:

- **Cache keys:** include the tenant with `tenant_cache_token(tenant_id)`, so two tenants never share a cache entry.
- **Logs:** structured logs include the tenant id once it is resolved, so a log line can be traced to its tenant.

## Next

- [Architecture layers](./layers.md): where the tenant filter sits
- [Plugin system](./plugin-system.md): how plugins are enabled per tenant
