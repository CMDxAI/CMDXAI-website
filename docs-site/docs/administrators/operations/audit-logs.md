---
id: audit-logs
title: Review audit logs
sidebar_label: Audit logs
sidebar_position: 4
doc_type: how-to
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [operations, security]
---

See who changed what, export the record, and set how long CMDX keeps it.

## Prerequisites

You need the `admin` or `auditor` role. An auditor can read the logs, but can't change settings.

## Steps

### Find an event

1. Go to **Logs** > **Audit log**.
2. Search by actor, action or target. You can also filter by **Actor**, **Action**, **Risk** and **Date**.
3. Open an event to see its details.

**Logs** > **Overview** shows activity and event categories for the last 24 hours. **Logs** > **Access log** lists HTTP requests, with filters for path, method, status and date. Sensitive parameters are redacted.

Each event carries a trace ID, which links it to the matching trace and logs. See [Monitor CMDX](./monitoring.md).

### Export the logs

Exports run in the background, on the `audit.export` queue, so the Celery worker must be running.

1. Start an export from the **Audit log** screen, or with `POST /api/v1/audit/export`.
2. Wait for the job to finish.
3. Download the file. Use `GET /api/v1/audit/export/<job-id>/download` from the API.

Exports hold up to `AUDIT_EXPORT_MAX_RECORDS` rows, 100,000 by default.

### Choose what is recorded

On **Logs** > **Settings**, under **Action categories to audit**, turn each category on or off. All are on by default:

| Category | Covers |
| --- | --- |
| Authentication | Sign-in, sign-out, MFA |
| Roles and permissions | Role and permission changes |
| User management | Creating, updating and deleting users |
| Course and content | Courses, quizzes, assignments, SCORM and media |
| Communications | Notifications, broadcasts and email |
| Configuration | Setting changes |
| System | Retention and audit configuration |
| Security | SIEM, IP and session events |

Turning a category off leaves a gap in your record. Check your compliance needs first.

### Set alerts

Under **Alert thresholds**, set how many failed sign-ins, critical events and configuration changes raise an alert. The defaults are 10, 5 and 3.

CMDX also alerts on bursts of errors. See [Monitor CMDX](./monitoring.md).

### Set retention

Under **Retention & export**, set how many days to keep records, 365 by default. You can also schedule exports.

| Job | Removes | Key |
| --- | --- | --- |
| `prune_logs` | Audit streams that have an enabled retention policy | `AUDIT_RETENTION_SWEEP_ENABLED` |
| `site_admin.audit_retention` | The settings audit trail | `SITE_ADMIN_AUDIT_RETENTION_ENABLED` |

An audit stream with no enabled retention policy is kept forever, unless you set `AUDIT_RETENTION_DEFAULT_PASS_ENABLED=true`. That pass deletes across every tenant, older than `AUDIT_RETENTION_DEFAULT_DAYS`. Set `AUDIT_RETENTION_ARCHIVE_ENABLED=true` first if you must keep the rows.

Retention policies are also available under `/api/v1/audit/retention-policies`.

### Send events to a SIEM

Under **SIEM**, enter the webhook address and secret. Then turn on the `features.siem_audit_export` flag. See [Turn feature flags on or off](../configuration/feature-flags.md).

## Verify

- Change a setting, then find the event in **Logs** > **Audit log**.
- Run an export, and open the file.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| An export stays queued | The Celery worker is down, or isn't consuming `audit.export`. | Check `celery_worker`. See [Manage scheduled tasks](./scheduled-tasks.md). |
| Events are missing | Their category is off. | Turn it on under **Logs** > **Settings**. |
| The access log is empty | `capture_http_access` is off. | Turn it on in the audit settings. |
| Old rows aren't removed | The stream has no enabled policy. | Add a policy, or turn on the default pass. |

## Related

- [Monitor CMDX](./monitoring.md)
- [Users and roles](../identity/users-and-roles.md)
