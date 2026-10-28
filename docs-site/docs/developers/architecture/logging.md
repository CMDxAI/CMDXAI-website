---
id: logging
title: Logging
sidebar_label: Logging
sidebar_position: 7
doc_type: reference
audience: developers
source_prd: "216694785"
ai_drafted: true
last_verified: 2026-10-26
tags: [architecture, logging]
---

The CMDX backend writes one log stream to standard output. This page lists the record format and fields, the helpers for writing records from code, what gets redacted, and the settings that control logging and Sentry error reporting. The code is in `core.logging` and `core.privacy.redact`.

## Settings

CMDX reads these environment variables at start-up. A change takes effect after a restart.

| Environment variable | Developer settings key | Default | Description |
| --- | --- | --- | --- |
| `LOG_LEVEL` | `developer.log_level` | `INFO` | Lowest level written: `CRITICAL`, `ERROR`, `WARNING`, `INFO` or `DEBUG`. |
| `LOG_JSON` | `developer.log_json` (read-only) | `true` | Write JSON records. `false` writes plain text. |
| `LOG_FORMAT` | `developer.log_format` (read-only) | `%(asctime)s %(levelname)s %(name)s %(message)s` | Python format string, used only when `LOG_JSON` is `false`. |
| `BODY_LOGGING_ENABLED` | `developer.body_logging_enabled` (read-only) | `false` | Log JSON request and response bodies. |
| `BODY_LOGGING_MAX_BYTES` | `developer.body_logging_max_bytes` (read-only) | `8192` | Largest body logged, in bytes. |
| `SENTRY_DSN` | none | not set | Sentry project DSN. Sentry is off when this is not set. |
| `SENTRY_ENVIRONMENT` | `developer.sentry_environment` (read-only) | `development` | Environment name sent to Sentry. |
| `SENTRY_SAMPLE_RATE` | `developer.sentry_sample_rate` (read-only) | `0.1` | Fraction of errors sent to Sentry, from `0.0` to `1.0`. |
| `SENTRY_TRACES_SAMPLE_RATE` | `developer.sentry_traces_sample_rate` (read-only) | `0.1` | Fraction of requests traced by Sentry, from `0.0` to `1.0`. |

:::note
`developer.log_level` is the only key in this table you can save from developer settings. A saved level applies at once in the worker that handles the request. At start-up, every uvicorn worker applies it in place of `LOG_LEVEL`. An active diagnostic override of the log level takes precedence over the saved level. Celery workers always use `LOG_LEVEL`.

A read-only key shows its environment value. Saving it, or creating a diagnostic override for it, returns `409 Conflict`. Set these keys as environment variables.
:::

## Record format

With `LOG_JSON` set to `true`, each record is one JSON object on one line. Every record has these fields:

| Field | Value |
| --- | --- |
| `timestamp` | When the record was written, in server local time. |
| `level` | `DEBUG`, `INFO`, `WARNING`, `ERROR` or `CRITICAL`. |
| `logger` | Name of the Python logger, usually the module path. |
| `message` | The formatted message. |
| `request_id` | ID of the current request, or `null` outside a request. |
| `user_id` | ID of the signed-in user, or `null`. |
| `tenant_id` | ID of the current tenant, or `null`. |
| `trace_id`, `span_id` | OpenTelemetry trace and span IDs, or `null` when tracing is off. |

Any `extra` fields the caller passes are added to the same object, after redaction.

With `LOG_JSON` set to `false`, records use `LOG_FORMAT` and contain no `extra` fields.

## Request context

The request fields come from context variables in `core.logging.context`. You don't pass them to each log call.

| Field | Set by |
| --- | --- |
| `request_id` | The request ID middleware, for every request. |
| `tenant_id` | The authentication or tenant dependency, once it knows the tenant. |
| `user_id` | The authentication dependency, after it signs the user in. Code that authenticates a user itself calls `bind_user_id()`. |

The request ID comes from the `X-Request-ID` request header when that header holds 1 to 128 letters, digits or hyphens. Otherwise CMDX generates a UUID. The response always carries the ID in `X-Request-ID`, so a client can quote it in a support request.

## Access log

The logging middleware writes one record for each request, except requests to `/health` and `/`.

- **Message:** `<method> <path> <status> <duration>ms`, for example `GET /api/v1/courses 200 41.7ms`.
- **Level:** `INFO` for a status below 400, `WARNING` for 400 and above.
- **Extra fields:** `http.method`, `http.path`, `http.status_code`, `http.duration_ms` and `http.request_id`.
- **Query strings:** a parameter whose name contains `token`, `key`, `secret`, `password` or `api_key` has its value replaced with `[REDACTED]`.

The access record never includes the client IP address.

## Write a record from code

Use the async helpers in `core.logging`, or a standard Python logger with `extra` fields.

| Helper | Level | Adds |
| --- | --- | --- |
| `log_app(event, message, **context)` | `INFO` | `event.type` set to `event`, and each keyword argument as a field. |
| `log_error(event, message, error=None, **context)` | `ERROR` | The same, plus `error.type`, `error.message` and the stack trace when `error` is given. |

Both helpers never raise. If writing the record fails, they report the failure on the `core.logging.fallback` logger and return. A keyword argument that clashes with a built-in record attribute, such as `name`, is written with a `ctx_` prefix.

## Redaction

Before a JSON record is written, `core.privacy.redact.redact()` checks every field name, including nested ones, and replaces sensitive values with `[REDACTED]`. It matches the whole name and its last dotted segment, so `auth.ip_address` matches as well as `ip_address`.

| Field name | Rule |
| --- | --- |
| Personal data: `email`, `phone`, `phone_number`, `phone_secondary`, `address`, `address_line_1`, `address_line_2`, `date_of_birth`, `first_name`, `last_name`, `credit_card`, `ip`, `ip_address`, `client_ip`, `remote_addr`, `user_agent` | Always redacted. |
| Contains `password`, `token`, `secret`, `api_key`, `apikey`, `otp`, `authorization`, `cookie` or `ssn` | Redacted when the value is text, bytes, a list or an object. Booleans, numbers and dates are kept. |
| Ends in `_id` or `_type` | Never treated as a secret, so `token_id` is kept. |

Redaction is a safety net. When you need part of a value, log a field that holds only that part. `core.privacy.redact` has helpers for this:

| Helper | Example |
| --- | --- |
| `email_domain(value)` | `jane.doe@example.com` becomes `example.com` |
| `mask_email(value)` | `jane.doe@example.com` becomes `ja***@example.com` |
| `coarse_ip(value)` | `203.0.113.7` becomes `203.0.113.0/24` |

Use these helpers under a field name that isn't redacted, such as `email_domain`. A field named `email` is replaced whatever it holds.

## Body logging

With `BODY_LOGGING_ENABLED` set to `true`, CMDX logs the body of:

- each `POST`, `PUT` and `PATCH` request with a JSON content type
- each JSON response

Bodies are logged at `DEBUG`, so `LOG_LEVEL` must also be `DEBUG`. Each body is redacted with the rules above and written in an `http.request_body` or `http.response_body` field. A body larger than `BODY_LOGGING_MAX_BYTES` isn't logged. Its record says only that the body was too large, and gives its size.

:::warning
Bodies can hold personal data that redaction doesn't catch. Turn body logging on only on a development machine or for a short debugging session.
:::

## Sentry

When `SENTRY_DSN` is set, CMDX sends errors to Sentry:

- Records at `ERROR` and above become Sentry events.
- Records at `INFO` and above are attached to the next event as breadcrumbs.
- Unhandled exceptions in requests are reported too.

Before anything leaves the server, CMDX:

- redacts extras, breadcrumb data and span data with the rules above
- removes the request body and cookies
- removes the `Authorization`, `Cookie`, `Set-Cookie` and `X-API-Key` headers
- reduces the `User-Agent` header to the browser and operating system family

## Examples

### Log an event

```python
from core.logging import log_app

await log_app(
    "course_published",
    "Course published",
    course_id="c-42",
    email="ana@example.com",
)
```

Output, inside a request:

```json
{"timestamp": "2026-10-26 09:29:38,694", "level": "INFO", "logger": "core.logging", "message": "Course published", "event.type": "course_published", "course_id": "c-42", "email": "[REDACTED]", "request_id": "3f2b9c1e-6a8d-4e0f-9b7a-2c5d1e8f4a60", "user_id": null, "tenant_id": "7c1d2e3f-0000-4000-8000-000000000001", "trace_id": null, "span_id": null}
```

## Related

- [Configuration](./config-service.md): config keys and the developer settings namespace
- [Multi-tenancy](./multi-tenancy.md): how the tenant for a request is found
- [Developer settings](../../administrators/configuration/developer-settings.md)
