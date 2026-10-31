---
id: scheduled-tasks
title: Manage scheduled tasks
sidebar_label: Scheduled tasks
sidebar_position: 2
doc_type: how-to
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [operations]
---

See and manage the jobs CMDX runs on a schedule. The `celery_beat` container starts each job at its interval, and the `celery_worker` container runs it. There is no screen for this. You manage jobs from the host, with `.env` and the Celery command line.

Run exactly one `celery_beat`. A second one would start every job twice.

## See what is scheduled

The [table of tasks](#scheduled-tasks) lists the jobs. To see what is happening on a running install, check the logs:

```bash
docker compose logs -f celery_beat
```

Beat writes a line each time it sends a job. To ask the worker what it's running and what it knows about:

```bash
docker exec cmdx_celery_worker celery -A core.tasks.app inspect active
docker exec cmdx_celery_worker celery -A core.tasks.app inspect registered
```

## Turn a task off or change its interval

Tasks with a key in the table can be changed in `.env`. Set the key, then recreate the three services, because beat builds its schedule at start-up:

```bash
docker compose up -d --force-recreate backend celery_worker celery_beat
```

Tasks without a key always run.

## Run a task now

To run a task once, use its task name from the table:

```bash
docker exec cmdx_celery_worker celery -A core.tasks.app call enrollments.expire_due_enrollments
```

The command prints a task ID, and the worker runs the task. Check the result in the worker's logs. Some tasks take arguments or change data, so run one only if you know what it does.

## Scheduled tasks

Intervals are the defaults. Task names are shortened in places. Use `inspect registered` for the full name.

### Notifications

| Job | Task | Interval | Key |
| --- | --- | --- | --- |
| Send digests | `flush_digests` | 5 minutes | `NOTIFICATION_DIGEST_ENABLED`, `NOTIFICATION_DIGEST_BEAT_INTERVAL_MINUTES` |
| Retry stuck deliveries | `sweep_stuck_deliveries` | 1 hour | `STUCK_DELIVERY_SWEEP_ENABLED` |
| Release after quiet hours | `release_deferred_notifications` | 1 minute | `NOTIFICATION_QUIET_HOURS_RELEASE_ENABLED`, `NOTIFICATION_QUIET_HOURS_BEAT_INTERVAL_MINUTES` |
| Send scheduled broadcasts | `process_scheduled_broadcasts` | 1 minute | `NOTIFICATION_BROADCAST_BEAT_ENABLED`, `NOTIFICATION_BROADCAST_BEAT_INTERVAL_MINUTES` |
| Back up notifications | `run_scheduled_notification_backup` | 24 hours | `NOTIFICATION_BACKUP_ENABLED`, `NOTIFICATION_BACKUP_BEAT_INTERVAL_HOURS` |

### Enrollments

| Job | Task | Interval | Key |
| --- | --- | --- | --- |
| Reconcile group sync | `enrollments.group_sync_reconciliation` | 1 hour | `GROUP_SYNC_RECONCILIATION_ENABLED`, `GROUP_SYNC_RECONCILIATION_BEAT_INTERVAL_MINUTES` |
| Expire enrollments | `enrollments.expire_due_enrollments` | 1 hour | `ENROLLMENT_EXPIRY_ENABLED`, `ENROLLMENT_EXPIRY_BEAT_INTERVAL_HOURS` |
| Clean up enrollment keys | `enrollments.key_cleanup` | 24 hours | `ENROLLMENT_KEY_CLEANUP_ENABLED`, `ENROLLMENT_KEY_CLEANUP_BEAT_INTERVAL_HOURS` |
| Recover stuck bulk jobs | `enrollments.recover_stale_bulk_jobs` | 15 minutes | `BULK_ENROLLMENT_STALE_RECOVERY_ENABLED`, `BULK_ENROLLMENT_STALE_RECOVERY_BEAT_INTERVAL_MINUTES` |
| Backfill enrollment rules | `enrollments.rule_backfill` | 24 hours | `ENROLLMENT_RULE_BACKFILL_ENABLED`, `ENROLLMENT_RULE_BACKFILL_BEAT_INTERVAL_HOURS` |

`EXPIRE_COURSE_ENROLLMENTS_ENABLED` is an older job. Leave it off: beat refuses to start if both it and `ENROLLMENT_EXPIRY_ENABLED` are on.

### Learning

| Job | Task | Interval | Key |
| --- | --- | --- | --- |
| Submit abandoned quiz attempts | `quizzes.finalize_expired_attempts` | 5 minutes | None |
| Save SCORM activity | `scorm.flush_telemetry` | 30 seconds | None |
| Save media analytics | `flush_media_analytics` | 30 seconds | None |
| Scan uploads | `files.scan_pending` | 30 seconds | None |
| Read video details | `video.transcode_runner` | 1 minute | None |
| Send calendar reminders | `calendar.send_due_reminders` | 1 minute | None |
| Purge deleted calendar events | `calendar.purge_deleted_events` | 1 day | None |

### Reports and exports

| Job | Task | Interval | Key |
| --- | --- | --- | --- |
| Refresh report views | `refresh_materialized_views` | 30 minutes | None |
| Run report schedules | `run_due_report_schedules` | 15 minutes | None |
| Expire report exports | `expire_report_exports` | 1 hour | None |
| Run user export schedules | `core.auth.run_user_export_schedules` | 1 minute | None |
| Expire user exports | `core.auth.expire_user_export_jobs` | 1 hour | None |

### Audit and administration

| Job | Task | Interval | Key |
| --- | --- | --- | --- |
| Remove old audit rows | `prune_logs` | 1 hour | `AUDIT_RETENTION_SWEEP_ENABLED`, `AUDIT_RETENTION_SWEEP_INTERVAL_MINUTES` |
| Detect error spikes | `detect_error_spike` | 5 minutes | `AUDIT_ERROR_SPIKE_ENABLED`, `AUDIT_ERROR_SPIKE_INTERVAL_MINUTES` |
| Export audit logs | `run_scheduled_export` | 1 hour | Does nothing unless scheduled export is on under **Logs** > **Settings** |
| Remove old settings audit rows | `site_admin.audit_retention` | 24 hours | `SITE_ADMIN_AUDIT_RETENTION_ENABLED`, `SITE_ADMIN_AUDIT_RETENTION_BEAT_INTERVAL_HOURS` |
| Notify about maintenance | `site_admin.maintenance_notify` | 5 minutes | None |

### Privacy

Both are off by default. See [review data retention](../install/production.md#step-11-review-data-retention).

| Job | Task | Interval | Key |
| --- | --- | --- | --- |
| Delete data past its retention window | `core.privacy.retention_sweep` | 24 hours | `RETENTION_SWEEP_ENABLED`, `RETENTION_SWEEP_INTERVAL_HOURS` |
| Carry out account deletions | `core.privacy.execute_delete_requests` | 24 hours | `ACCOUNT_DELETION_AUTO_EXECUTE`, `RETENTION_SWEEP_INTERVAL_HOURS` |

Changing a `RETENTION_*` window takes effect in the worker, so always recreate the worker as well as beat.

### Plugins

A plugin can add its own tasks. They are merged into the schedule when the plugin is installed.

| Job | Task | Interval | Notes |
| --- | --- | --- | --- |
| Recompute the leaderboard | `plugins.gamification.recompute_leaderboard` | 1 hour | This task goes to a queue named `default`, which the worker in the Compose file doesn't consume, so it doesn't run. |

## Queues

The worker in the Compose file consumes these queues:

| Queue | Holds |
| --- | --- |
| `celery` | Scheduled jobs and general work |
| `notif.email`, `notif.sms`, `notif.whatsapp`, `notif.push`, `notif.inbox` | Notification delivery |
| `audit.write`, `audit.export` | Audit records and exports |

## When a job doesn't run

1. Check that `celery_beat` and `celery_worker` are up: `docker compose ps`.
2. Look for the job in the beat logs.
3. Look for an error in the worker logs.
4. Check that the worker answers: `docker exec cmdx_celery_worker celery -A core.tasks.app inspect ping`.
5. Check whether the job's key is off in `.env`.

Beat keeps its schedule file in `/tmp`, so it starts fresh when the container is replaced. That is harmless.

## Related

- [Monitor CMDX](./monitoring.md)
- [Environment variables](../configuration/environment-variables.md)
