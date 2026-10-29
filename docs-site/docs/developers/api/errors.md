---
id: errors
title: Errors
sidebar_label: Errors
sidebar_position: 3
doc_type: reference
audience: developers
source_prd: none
ai_drafted: true
last_verified: 2026-10-27
tags: [api, errors]
---

How the CMDX API reports errors: the status codes it uses, the shapes of error bodies, and the headers that come with them.

:::note
CMDX is settling on one error body format for every endpoint. Until then, the body depends on the endpoint, as described below. Rely on the status code first.
:::

## Summary

| Status | Meaning in CMDX |
| --- | --- |
| `400` | The request breaks a rule: a bad header, a value the operation doesn't allow, or a missing tenant. |
| `401` | No valid access token. See [Authenticate API requests](./authentication.md). |
| `403` | Signed in, but not allowed: a missing permission, no membership in the tenant, or an expired password. |
| `404` | No such route, or no such record in your tenant. A record in another tenant also returns `404`, so the response doesn't confirm it exists. |
| `405` | The route doesn't accept this HTTP method. |
| `409` | The request conflicts with existing data, such as a duplicate value, or the resource isn't ready yet. |
| `410` | The resource is gone, such as an expired signed file link. |
| `413` | An uploaded file is larger than the limit, on endpoints that check the size before storing the file. The default is 10 MB. When the storage layer rejects a file instead, the status is `400` with the code `upload_failed`. |
| `422` | The request body, query, path, headers or cookies don't match the schema, or a value fails a check. |
| `429` | Too many requests, or too many failed sign-ins. |
| `500` | An unexpected error on the server. |
| `502` | A service CMDX depends on, such as an AI provider, returned an error. |
| `503` | CMDX is in maintenance, or a service it needs is unavailable. |

## Details

An error body has one of five shapes. To read any of them, check the status, then look for, in order: an `errors` list, a `code` at the top level, a `detail` object, and a `detail` string.

### Message only

Many errors have a `detail` string. Some `422` responses have this shape too, instead of the error envelope:

```json
{
  "detail": "Category with slug 'docs' already exists under parent."
}
```

### Message with a code

Some errors put an object in `detail`, with a code that doesn't change between languages. Branch on the code, not on the message. For example, when multi-factor authentication is required:

```json
{
  "detail": {
    "error": "unauthorized",
    "message": "Multi-factor authentication is required",
    "code": "ERR_MFA_REQUIRED"
  }
}
```

| `code` | Status | Meaning |
| --- | --- | --- |
| `ERR_MFA_REQUIRED` | `401` | The security policy requires multi-factor authentication. Verify a code first. |
| `ERR_IP_NOT_ALLOWED` | `403` | The security policy doesn't allow requests from your IP address. |
| `ERR_PASSWORD_EXPIRED` | `403` | The account's password has expired and must be changed before signing in. |

Some endpoints name the code `error_code` instead, with a dotted value such as `enrollment.window_closed`. Those codes are listed on the pages for their endpoints.

### Code at the top level

Site Admin endpoints put the same three keys at the top level, with no `detail`:

```json
{
  "error": "not_found",
  "message": "<message>",
  "code": "ERR_NOT_FOUND"
}
```

The code sets the status: `ERR_BAD_REQUEST` (`400`), `ERR_UNAUTHORIZED` (`401`), `ERR_FORBIDDEN` (`403`), `ERR_NOT_FOUND` (`404`), `ERR_CONFLICT` (`409`), `ERR_VALIDATION` (`422`), `ERR_RATE_LIMITED` (`429`) and `ERR_PROBE_FAILED` (`503`).

### Error envelope

Some errors use the same envelope as successful responses, with `success` set to `false` and a list of `errors`. For example, a duplicate value:

```json
{
  "success": false,
  "message": "A record with this value already exists.",
  "errors": [
    {
      "code": "conflict",
      "message": "A record with this value already exists."
    }
  ]
}
```

| Status | `errors[].code` | Meaning |
| --- | --- | --- |
| `409` | `conflict` | A value must be unique and already exists. |
| `422` | The type of problem | The request doesn't match the schema. See [Validation errors](#validation-errors). |
| `500` | `database_error` | A database error. |
| `500` | `internal_error` | An unexpected error. |
| Varies | A storage code, such as `upload_failed` | The file storage rejected or failed the operation. |

### Validation errors

When the request doesn't match the endpoint's schema, the status is `422` and the error envelope lists each problem:

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "code": "missing",
      "message": "Field is required",
      "field": "body.slug"
    }
  ]
}
```

| Field | Description |
| --- | --- |
| `success` | Always `false`. |
| `message` | A summary, `Validation error`. |
| `errors[].field` | Where the problem is: `body`, `query`, `path`, `header` or `cookie`, then the field's path, joined with dots. For example, `body.email` or `body.items.0.name`. Left out when the problem has no location. |
| `errors[].code` | The type of problem, such as `missing`, `string_too_short`, `uuid_parsing` or `value_error`. It doesn't change between languages. |
| `errors[].message` | A description of the problem. |

### Problem details

Report export endpoints, under `/api/v1/reports/exports`, return a problem-details body ([RFC 9457](https://www.rfc-editor.org/rfc/rfc9457)):

```json
{
  "type": "https://cmdx.io/errors/report-exports/410",
  "title": "Export expired",
  "status": 410,
  "detail": "<message>",
  "instance": "/api/v1/reports/exports/<job-id>/download"
}
```

Here `detail` is a string, as in [Message only](#message-only). `type` and `title` don't change between languages.

## Headers

| Header | When | Description |
| --- | --- | --- |
| `X-Request-ID` | Most responses | An id for the request. If you send an `X-Request-ID` of up to 128 letters, digits and hyphens, CMDX uses yours. Quote it when you report a problem. |
| `Retry-After` | `429` from the rate limit, and `503` in maintenance | The number of seconds to wait before trying again. The `429` for too many failed sign-ins doesn't have it. |
| `WWW-Authenticate` | `401` | `Bearer`. |
| `Content-Language` | Most responses | The language of the messages in the response. |

## Language of messages

Messages are translated into English, Spanish, French or German. CMDX picks the language from, in order:

1. the `lang` query parameter, such as `?lang=fr`;
2. the language saved on the account, carried in the access token;
3. the `Accept-Language` header;
4. English.

Codes, field paths and the `error` key are never translated, so use them, and the status, in your code. Some messages are always in English.

## Maintenance mode

When an administrator puts CMDX into maintenance, requests return `503` with a `Retry-After` header:

```json
{
  "detail": "The service is temporarily unavailable for maintenance. Please try again later.",
  "retry_after": 3600
}
```

In read-only maintenance, `GET`, `HEAD` and `OPTIONS` requests still work. Other requests return `503` with `"mode": "read_only"` and no `Retry-After`.

`/health`, the API documentation pages and the endpoint that turns maintenance off stay available. Two kinds of request also get through in both modes: requests from addresses in `MAINTENANCE_BYPASS_IPS`, and requests from an account that holds the Super Administrator role for the whole installation.

## Rate limits

When you send too many requests, the status is `429`:

```json
{
  "detail": "Rate limit exceeded. Retry after 60 seconds."
}
```

Wait for the number of seconds in the `Retry-After` header. Limits are counted per account for signed-in requests, and per IP address otherwise. Each endpoint sets its own limit; sign-in, for example, allows 5 requests a minute. If the installation sets `RATE_LIMIT_STRATEGY=token_bucket`, all endpoints draw on one allowance per account or address, so a request can be limited sooner than its endpoint's limit suggests.

Too many failed sign-ins also return `429`, with `Too many failed login attempts. Please try again later.` and no `Retry-After`. See [Authenticate API requests](./authentication.md) for how long sign-in stays blocked.

## Examples

Send a request with a missing field and read the status, the request id and the body. `BASE_URL`, `ACCESS_TOKEN` and `TENANT_ID` are set as in [Authenticate API requests](./authentication.md):

```bash
curl -s -i -X POST "$BASE_URL/api/v1/courses/categories?lang=fr" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -H "X-Request-ID: docs-example-1" \
  -H 'Content-Type: application/json' \
  -d '{"name": "Docs"}' 
```

The category has no `slug`, so the status is `422`. Your request id comes back, and the messages are in French because of `?lang=fr`, while the codes and field paths stay the same:

```text
HTTP/1.1 422 Unprocessable Entity
x-request-id: docs-example-1
...

{"success":false,"message":"Erreur de validation","errors":[{"code":"missing","message":"Le champ est obligatoire","field":"body.slug"}]}
```

## Related

- [Authenticate API requests](./authentication.md): the `401` and `403` errors from signing in
- [Pagination and filtering](./pagination-and-filtering.md)
- [Multi-tenancy](../architecture/multi-tenancy.md): why records in other tenants return `404`
