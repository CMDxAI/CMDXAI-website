---
id: pagination-and-filtering
title: Pagination and filtering
sidebar_label: Pagination and filtering
sidebar_position: 2
doc_type: reference
audience: developers
source_prd: none
ai_drafted: true
last_verified: 2026-10-28
tags: [api, pagination]
---

How CMDX API list endpoints page, sort, search and filter their results. Most list endpoints share one scheme, described first. The endpoints that page differently are listed after it.

:::note
The API doesn't yet use one paging scheme on every list endpoint, and the format is being settled. Until it is, check each endpoint's parameters in the API reference.
:::

## Summary

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `page` | integer | `1` | Page number, starting at 1. |
| `limit` | integer | `20` | Results per page, from 1 to the endpoint's maximum: 1000 on most endpoints, 100 on some. |
| `sort_by` | string | set by the endpoint | Fields to sort by, comma-separated. Put `-` before a field to sort it in descending order. |
| `search` | string | none | Text to look for. The match ignores case and can be any part of a value. |
| `search_fields` | string | none | Fields to search, comma-separated, from the set the endpoint allows. |

## Details

### `page` and `limit`

`page` counts from 1. A `page` beyond the last page returns an empty `data` list, not an error.

`limit` sets the page size. A value below 1 or above the endpoint's maximum returns `422`. The API reference shows each endpoint's maximum.

### `sort_by`

`sort_by` takes one or more field names, separated by commas, for example `sort_by=-created_at,full_name`. A field with a `-` prefix sorts in descending order. A field with no prefix, or with `+`, sorts in ascending order.

Each endpoint accepts its own set of sort fields. An endpoint either rejects a field outside its set with `422` or ignores it. The `422` body names the fields the endpoint accepts:

```json
{"detail": "Invalid sort field: 'title'. Allowed: created_at, current_enrollment, full_name, short_name, status, updated_at"}
```

Without `sort_by`, the endpoint uses its own default order. `GET /api/v1/courses` sorts by `-created_at`. Rows with no value in the sort field come last, in both directions.

### `search` and `search_fields`

Send both: `search=intro&search_fields=full_name,short_name` returns rows where either field contains `intro`. Without `search_fields`, most endpoints ignore `search`.

Some endpoints search a fixed set of fields and need only `search`. For example, `GET /api/v1/users/list` matches `search` against email, username, first name and last name.

### Filters

Filters are named query parameters, and each endpoint has its own. For example, `GET /api/v1/courses` takes `category_id` and `status`, and `GET /api/v1/users/list` takes `status`, `role` and `batch`. Filters combine with each other and with paging: `total` counts only the rows that match.

## Response

An endpoint that uses this scheme returns its rows in `data` and the paging details in `pagination`:

```json
{
  "data": [],
  "pagination": {
    "page": 2,
    "limit": 10,
    "total": 37,
    "total_pages": 4
  }
}
```

| Field | Description |
| --- | --- |
| `data` | The rows on this page. |
| `pagination.page` | The page you asked for. |
| `pagination.limit` | The page size you asked for. |
| `pagination.total` | The number of rows that match, across all pages. |
| `pagination.total_pages` | `total` divided by `limit`, rounded up. It is at least 1, even when `total` is 0. |

Some endpoints, such as the quiz attempt lists, also return the `success`, `message`, `meta` and `errors` fields that most CMDX responses carry. Their `data` and `pagination` are the same, so read those two fields and ignore the rest.

To read every page, start at `page=1` and stop after `page` equals `total_pages`.

## Endpoints that page differently

These endpoints don't page as described above. Each returns its own list shape; the API reference shows it.

| Endpoints | Parameters | Default `limit` | Maximum `limit` | Next page |
| --- | --- | --- | --- | --- |
| `GET /api/v1/enrollments`, `/enrollments/rules`, `/enrollment-keys`, `/me/enrollments`, `/learning-items` | `page`, `limit` | 20 | 100 | Add 1 to `page`. The rows are in `items`, with `total`, `page` and `limit` beside them. |
| `GET /api/v1/notifications` | `cursor`, `limit` | 20 | 200 | Send `next_cursor` from the response as `cursor`. |
| `GET /api/v1/calendar/agenda`, `GET /api/v1/calendar/announcements` | `cursor`, `limit` | 25 | 100 | Send `meta.next_cursor` as `cursor`. |
| `GET /api/v1/audit/audit-log`, `/audit/logs`, `/audit/timeline`, `/audit/user/{user_id}/timeline` | `cursor`, `limit` | 20 | 100 | Send `next_cursor` as `cursor` while `has_more` is `true`. |
| `GET /api/v1/reports/*` (six report types) | `cursor`, `limit` | 50 | 500 | Send `pagination.cursor` as `cursor` while `pagination.has_more` is `true`. |
| `GET /api/v1/notifications/admin/*` and `GET /api/v1/grades/my-grades/all` | `offset`, `limit` | 50 (20 for grades) | 200 (100 for grades) | Add `limit` to `offset`. |
| `GET /api/v1/admin/feature-flags`, `/admin/audit-log`, `/tenant/feature-flags`, `/tenant/audit-log`, `/organizations`, `/organizations/{org_id}/members`, `/roles/assignments`, `/roles/switch/sessions`, `/developer/settings/audit` | `skip`, `limit` | 50 | 200 | Add `limit` to `skip`. |
| `GET /api/v1/config/audit-log`, `GET /api/v1/users/{user_id}/audit-logs` | `skip`, `limit` | 50 (100 for user audit logs) | 500 | Add `limit` to `skip`. |
| `GET /api/v1/organizations/{org_id}/members/candidates`, `GET /api/v1/media/{media_id}/transcript/search` | `skip`, `limit` | 50 | 100 | Add `limit` to `skip`. |
| `GET /api/v1/admin/access-logs` | `skip` and `limit`, or `page` and `page_size` | 50 | 200 | Add `limit` to `skip`, or add 1 to `page`. When you send `page` or `page_size`, they win over `skip` and `limit`. |
| `GET /api/v1/admin/traces/{trace_id}`, `GET /api/v1/me/dashboard/grades`, `GET /api/v1/reports/exports` | `limit` | 200 for traces, 20 for the others | 500 for traces, 100 for the others | None: these return at most `limit` rows. |
| `GET /api/v1/users/directory`, `/users`, `/users/delete-requests`, `/profiles`, `/import/jobs`, `/storage/list` | `page`, `page_size` | 20 (10 for profiles, import jobs and storage) | 100 | Add 1 to `page`. |

Some endpoints take a search term as `q` instead of `search`, for example `GET /api/v1/courses/explore/catalog` and `GET /api/v1/organizations`.

## Examples

Get the second page of ten courses, newest first, in one category:

```bash
curl -s "http://localhost:8000/api/v1/courses?page=2&limit=10&sort_by=-created_at&category_id=<category-id>" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" | jq .pagination
```

```json
{
  "page": 2,
  "limit": 10,
  "total": 37,
  "total_pages": 4
}
```

## Related

- [Authenticate API requests](./authentication.md): get the token these examples send
- [Errors](./errors.md): the `422` body for an invalid parameter
