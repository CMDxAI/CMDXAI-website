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

<!-- TODO: verify: link "API reference" on this page to the generated reference once #82 merges -->


## Summary

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `page` | integer | `1` | Page number, starting at 1. |
| `limit` | integer | `20` | Results per page, from 1 to the endpoint's maximum: 1000 on most endpoints, 100 on some. |
| `sort_by` | string | set by the endpoint | Fields to sort by, comma-separated. Put `-` before a field to sort it in descending order. |
| `search` | string | none | Text to look for. The match ignores case and can be any part of a value. `%` matches any run of characters and `_` matches any one character. |
| `search_fields` | string | none | Fields to search, comma-separated. A name the endpoint doesn't know is dropped without an error. |

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

Without `sort_by`, some endpoints use a default order: `GET /api/v1/courses` sorts by `-created_at`. Others set none, and the rows can come back in a different order on each request. Rows with no value in the sort field come last, in both directions.

Not every endpoint breaks ties, so rows with the same sort value can swap places between pages. To read every page without gaps or repeats, sort on a field whose values differ from row to row, such as `created_at`.

### `search` and `search_fields`

Send both: `search=intro&search_fields=full_name,short_name` returns rows where either field contains `intro`. Without `search_fields`, most endpoints ignore `search`. If no name in `search_fields` matches a text field, the search is dropped and the full list comes back, so check the spelling.

`%` and `_` in `search` aren't escaped, so a search for a literal `_` matches other characters too: `search=a_b` also matches `axb`.

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
| `pagination.total_pages` | `total` divided by `limit`, rounded up. Most endpoints return at least 1, even when `total` is 0; some return 0. |

Some endpoints, such as the quiz attempt lists, also return the `success`, `message`, `meta` and `errors` fields that most CMDX responses carry. Their `data` and `pagination` are the same, so read those two fields and ignore the rest.

To read every page, start at `page=1` and stop once `page` is greater than or equal to `total_pages`, or when `data` is empty.

## Endpoints that page differently

These endpoints don't page as described above. All are `GET` requests under `/api/v1`. Each returns its own list shape; the API reference shows it.

### `page` and `limit`

Add 1 to `page` for the next page. The first five endpoints return the rows in `items`, with `total`, `page` and `limit` beside them.

| Endpoint | Default `limit` | Maximum `limit` |
| --- | --- | --- |
| `/enrollments` | 20 | 100 |
| `/enrollments/rules` | 20 | 100 |
| `/enrollment-keys` | 20 | 100 |
| `/me/enrollments` | 20 | 100 |
| `/learning-items` | 20 | 100 |
| `/users/export/jobs` | 20 | 100 |
| `/enrollments/admin/permissions` | 20 | 100 |
| `/enrollments/admin/roles` | 20 | 100 |

### `page` and `page_size`

Add 1 to `page` for the next page.

| Endpoint | Default `page_size` | Maximum `page_size` |
| --- | --- | --- |
| `/users` | 20 | 100 |
| `/users/directory` | 20 | 100 |
| `/users/delete-requests` | 20 | 100 |
| `/profiles` | 10 | 100 |
| `/import/jobs` | 10 | 100 |
| `/storage/list` | 10 | 100 |

`/users` and `/users/directory` also take `limit`, which wins over `page_size`. They sort differently from the scheme above: `sort_by` is one of `last_activity`, `display_name`, `points` or `created_at`, with no `-` prefix, and `order` is `asc` or `desc` (the default). They return `total_pages: 0` when there are no rows.

### `cursor` and `limit`

Send the cursor from the response as `cursor` for the next page. Where the table names `has_more`, stop when it is `false`.

| Endpoint | Default `limit` | Maximum `limit` | Next cursor |
| --- | --- | --- | --- |
| `/notifications` | 20 | 200 | `next_cursor` |
| `/calendar/agenda` | 25 | 100 | `meta.next_cursor` |
| `/calendar/announcements` | 25 | 100 | `meta.next_cursor` |
| `/audit/audit-log` | 20 | 100 | `next_cursor`, while `has_more` |
| `/audit/logs` | 20 | 100 | `next_cursor`, while `has_more` |
| `/audit/timeline` | 20 | 100 | `next_cursor`, while `has_more` |
| `/audit/user/{user_id}/timeline` | 20 | 100 | `next_cursor`, while `has_more` |
| `/reports/enrollment-summary` | 50 | 500 | `pagination.cursor`, while `pagination.has_more` |
| `/reports/completion-rate` | 50 | 500 | `pagination.cursor`, while `pagination.has_more` |
| `/reports/assessment-scores` | 50 | 500 | `pagination.cursor`, while `pagination.has_more` |
| `/reports/learner-activity` | 50 | 500 | `pagination.cursor`, while `pagination.has_more` |
| `/reports/course-progress` | 50 | 500 | `pagination.cursor`, while `pagination.has_more` |
| `/reports/pass-fail` | 50 | 500 | `pagination.cursor`, while `pagination.has_more` |

### `offset` and `limit`

Add `limit` to `offset` for the next page.

| Endpoint | Default `limit` | Maximum `limit` |
| --- | --- | --- |
| `/notifications/admin/templates` | 50 | 200 |
| `/notifications/admin/broadcasts` | 50 | 200 |
| `/notifications/admin/backups` | 50 | 200 |
| `/notifications/admin/deliveries` | 50 | 200 |
| `/notifications/admin/audit-log` | 50 | 200 |
| `/notifications/admin/delivery-dashboard` and the pages under it | 50 | 200 |
| `/grades/my-grades/all` | 20 | 100 |

### `skip` and `limit`

Add `limit` to `skip` for the next page.

| Endpoint | Default `limit` | Maximum `limit` |
| --- | --- | --- |
| `/admin/feature-flags` | 50 | 200 |
| `/admin/audit-log` | 50 | 200 |
| `/admin/access-logs` | 50 | 200 |
| `/tenant/feature-flags` | 50 | 200 |
| `/tenant/audit-log` | 50 | 200 |
| `/organizations` | 50 | 200 |
| `/organizations/{org_id}/members` | 50 | 200 |
| `/organizations/{org_id}/members/candidates` | 50 | 100 |
| `/roles/assignments` | 50 | 200 |
| `/roles/switch/sessions` | 50 | 200 |
| `/developer/settings/audit` | 50 | 200 |
| `/config/audit-log` | 50 | 500 |
| `/users/{user_id}/audit-logs` | 100 | 500 |
| `/media/{media_id}/transcript/search` | 50 | 100 |

`/admin/access-logs` also takes `page` and `page_size`. When you send either, they win over `skip` and `limit`.

### `limit` only

These return at most `limit` rows and have no next page.

| Endpoint | Default `limit` | Maximum `limit` |
| --- | --- | --- |
| `/admin/traces/{trace_id}` | 200 | 500 |
| `/me/dashboard/grades` | 20 | 100 |
| `/reports/exports` | 20 | 100 |

### Search with `q`

Some endpoints take a search term as `q` instead of `search`: `/courses/explore/catalog`, `/organizations`, `/enrollments`, `/learning-items`, `/audit/audit-log`, `/roles/assignments`, `/notifications/admin/templates` and `/search`. The catalog also lists `search` and `search_fields` among its parameters, but searches only with `q`.

## Examples

Get the second page of ten courses, newest first, in one category:

`BASE_URL`, `ACCESS_TOKEN` and `TENANT_ID` are set as in [Authenticate API requests](./authentication.md):

```bash
curl -s "$BASE_URL/api/v1/courses?page=2&limit=10&sort_by=-created_at&category_id=<category-id>" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
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
