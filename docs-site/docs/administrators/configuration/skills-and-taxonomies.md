---
id: skills-and-taxonomies
title: Manage skills and taxonomies
sidebar_label: Skills and taxonomies
sidebar_position: 8
doc_type: how-to
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [configuration]
---

Set up the vocabularies you use to organize learning items. A **taxonomy** is a named set of terms, such as subjects or levels. A **skill framework** is a named set of skills that learning items can teach.

There are no screens for these yet, so use the API. Course categories are separate, and have their own **Categories** screen.

## Prerequisites

| To | You need |
| --- | --- |
| Read taxonomies | `taxonomy:read` |
| Change taxonomies | `taxonomy:manage` |
| Change skills | `skill:manage`, or the `admin` role |
| An API token | See the authentication page for developers |

Both are stored per tenant. Send the tenant's ID in the `X-Tenant-ID` header.

All paths are under `/api/v1/learning-items-api`.

## Steps

### Create a taxonomy

1. Create the taxonomy:

   ```bash
   curl -X POST https://lms.example.com/api/v1/learning-items-api/taxonomies \
     -H "Authorization: Bearer $TOKEN" \
     -H "X-Tenant-ID: <tenant-id>" \
     -H 'Content-Type: application/json' \
     -d '{"key": "level", "name": "Level", "is_hierarchical": false, "allow_multi": false}'
   ```

   | Field | Required | Description |
   | --- | --- | --- |
   | `key` | Yes | Up to 64 characters |
   | `name` | Yes | Up to 64 characters |
   | `description` | No | |
   | `is_hierarchical` | No | Terms can have parents. Defaults to `true`. |
   | `allow_multi` | No | An item can have several terms. Defaults to `false`. |

2. Add terms to it:

   ```bash
   curl -X POST https://lms.example.com/api/v1/learning-items-api/taxonomies/<taxonomy-id>/terms \
     -H "Authorization: Bearer $TOKEN" \
     -H "X-Tenant-ID: <tenant-id>" \
     -H 'Content-Type: application/json' \
     -d '{"name": "Beginner", "slug": "beginner"}'
   ```

   Add `parent_id` to nest a term in a hierarchical taxonomy.

| Route | Does |
| --- | --- |
| `GET`, `PATCH`, `DELETE /taxonomies/<id>` | Reads, changes or removes a taxonomy |
| `GET /taxonomies/<id>/tree` | Reads the terms as a tree |
| `GET /taxonomies/<id>/terms` | Lists the terms |
| `PATCH`, `DELETE /taxonomies/<id>/terms/<term-id>` | Changes or removes a term |
| `GET`, `DELETE /taxonomies/tags/<entity-type>/<entity-id>` | Reads or removes an item's tags |

### Create a skill framework

1. Create the framework:

   ```bash
   curl -X POST https://lms.example.com/api/v1/learning-items-api/skill-frameworks \
     -H "Authorization: Bearer $TOKEN" \
     -H "X-Tenant-ID: <tenant-id>" \
     -H 'Content-Type: application/json' \
     -d '{"key": "digital", "name": "Digital skills"}'
   ```

2. Add skills with `POST /skill-frameworks/<framework-id>/skills`.
3. Attach a skill to a learning item with the routes under `/learning-items/<id>/skills`.

| Route | Does |
| --- | --- |
| `GET /skill-frameworks` | Lists the frameworks |
| `GET`, `PATCH`, `DELETE /skill-frameworks/<id>` | Reads, changes or removes a framework |
| `GET /skill-frameworks/<id>/skills` | Lists its skills |
| `GET`, `PATCH`, `DELETE /skills/<id>` | Reads, changes or removes a skill |
| `GET /learning-items/<id>/skills` | Lists an item's skills |
| `DELETE /learning-items/<id>/skills/<skill-id>` | Removes a skill from an item |

## Verify

List what you created:

```bash
curl https://lms.example.com/api/v1/learning-items-api/taxonomies/<taxonomy-id>/tree \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: <tenant-id>"
```

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| 403 | You aren't a member of that tenant, or lack the capability. | Check your membership and role. |
| 400 on a skill framework | The request failed validation, for example a repeated `key`. | Read the message in the response. |
| Terms aren't nested | The taxonomy has `is_hierarchical` off. | Update the taxonomy. |

## Related

- [Permissions](../identity/permissions.md)
- [Tenant settings](../tenants/tenant-settings.md)
