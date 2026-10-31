---
id: developer-settings
title: Developer settings
sidebar_label: Developer settings
sidebar_position: 2
doc_type: reference
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [configuration]
---

Settings and diagnostics for logging and telemetry, for the whole install. There are no screens for these yet. Use the API under `/api/v1/developer`.

Developer settings apply to the whole install, so tenant administrators don't have them.

## Access

| Capability | Allows | Held by |
| --- | --- | --- |
| `developer_settings:read` | Reading settings, the audit trail, diagnostics, hooks and system information | `super-admin`, `admin` |
| `developer_settings:manage` | Changing and resetting settings | `super-admin`, `admin` |
| `developer_settings:diagnostics_edit` | Creating and reverting diagnostic overrides | `super-admin`, `admin` |
| `developer_settings:testdata_execute` | Seeding and cleaning test data, outside production | `super-admin`, `admin` |

## Endpoints

All paths are under `/api/v1/developer`.

| Method and path | Does |
| --- | --- |
| `GET /settings` | Lists settings, with each value and where it comes from |
| `GET /settings/schema` | Lists the settings' types and allowed values |
| `GET /settings/audit` | Lists changes to settings |
| `PUT /settings/{key}` | Saves a value |
| `DELETE /settings/{key}` | Removes a saved value |
| `GET /features`, `PUT /features/{key}`, `DELETE /features/{key}` | Reads and sets [feature flags](./feature-flags.md). `/feature-flags` is the same route. |
| `GET /diagnostics` | Shows the logging, Sentry and OpenTelemetry settings in effect |
| `POST /diagnostics/override` | Creates a temporary override |
| `POST /diagnostics/override/{id}/revert` | Ends an override early |
| `GET /diagnostics/banner` | Lists active overrides |
| `GET /inspect/hooks` | Lists the registered hooks |
| `GET /system-info` | Shows information about the running system |
| `POST /testing/seed`, `POST /testing/cleanup` | Create and remove test data. They refuse to run in production. |

## Settings

The log level is the only setting you can change here. The others are read from the environment at start-up, so the API shows them read-only. To change one, edit `.env` and recreate the containers.

| Key | Environment variable | Default | Can be saved |
| --- | --- | --- | --- |
| `developer.log_level` | `LOG_LEVEL` | `INFO` | Yes |
| `developer.log_json` | `LOG_JSON` | `true` | No |
| `developer.log_format` | `LOG_FORMAT` | `%(asctime)s %(levelname)s %(name)s %(message)s` | No |
| `developer.body_logging_enabled` | `BODY_LOGGING_ENABLED` | `false` | No |
| `developer.body_logging_max_bytes` | `BODY_LOGGING_MAX_BYTES` | `8192` | No |
| `developer.sentry_environment` | `SENTRY_ENVIRONMENT` | `development` | No |
| `developer.sentry_sample_rate` | `SENTRY_SAMPLE_RATE` | `0.1` | No |
| `developer.sentry_traces_sample_rate` | `SENTRY_TRACES_SAMPLE_RATE` | `0.1` | No |
| `developer.otel_enabled` | `OTEL_ENABLED` | `false` | No |
| `developer.otel_trace_sample_rate` | `OTEL_TRACE_SAMPLE_RATE` | `1.0` | No |

`SENTRY_DSN` and `OTEL_EXPORTER_OTLP_ENDPOINT` are environment only, and aren't listed here at all.

:::warning
`BODY_LOGGING_ENABLED` writes request and response bodies to the logs, which can include personal data. It also costs CPU and disk. Use it for short investigations only, and not in production.
:::

### Set the log level

The allowed values are `CRITICAL`, `ERROR`, `WARNING`, `INFO` and `DEBUG`.

A saved level applies at once in the worker that handles the request, and every API worker uses it from its next start. Celery workers always use `LOG_LEVEL`.

## Diagnostic overrides

A diagnostic override is a temporary change for an investigation, such as `DEBUG` logging for 30 minutes. It needs a reason, and ends by itself.

```bash
curl -X POST https://lms.example.com/api/v1/developer/diagnostics/override \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"key": "developer.log_level", "override_value": "DEBUG", "ttl_minutes": 30, "reason": "Investigating failed sign-ins"}'
```

| Field | Rules |
| --- | --- |
| `key` | The setting. Read-only settings are refused. |
| `override_value` | The temporary value |
| `ttl_minutes` | From 1 to 1440. The default is 30. |
| `reason` | From 3 to 500 characters |

A setting can have only one active override. An active override of the log level wins over the saved level.

## Related

- [Monitor CMDX](../operations/monitoring.md)
- [Environment variables](./environment-variables.md)
- [Logging for developers](../../developers/architecture/logging.md)
