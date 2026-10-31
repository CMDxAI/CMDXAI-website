---
id: monitoring
title: Monitor CMDX
sidebar_label: Monitoring
sidebar_position: 1
doc_type: how-to
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [operations]
---

Check health, metrics and traces for a running install. This page covers what you can watch from the host and in the app. Run the commands from the folder that holds `docker-compose.yml`.

## Check health

`/health` is the API's health endpoint. It needs no sign-in, and also works through the web app's address.

```bash
curl -s https://lms.example.com/health
```

| Field | Means |
| --- | --- |
| `status` | `healthy`, or `degraded` when the database check fails |
| `version` | The running version |
| `environment` | `development` or `production` |
| `database` | The result of the database check |

:::warning
`/health` returns HTTP 200 even when `status` is `degraded`, and it checks only the database. An uptime monitor must read the `status` field, not just the HTTP code. Redis, RabbitMQ and the Celery workers aren't covered, so check them separately.
:::

To check the containers:

```bash
docker compose -f docker-compose.yml ps
docker inspect cmdx_backend --format 'restarts={{.RestartCount}} health={{.State.Health.Status}}'
```

A rising restart count means a container is failing. See [troubleshooting](./troubleshooting.md#the-backend-keeps-restarting).

## Read the logs

The app writes JSON logs to standard output:

```bash
docker compose -f docker-compose.yml logs -f backend
docker compose -f docker-compose.yml logs -f celery_worker
docker compose -f docker-compose.yml logs -f celery_beat
```

To change how much is logged, see [set the log level](../configuration/developer-settings.md#set-the-log-level).

While tracing is on, each log line from a request carries a `trace_id`. Paste it into Jaeger to see the matching trace.

## Check database connections

Running out of connections is the most common cause of a slow or hanging app. This count should stay at `0`:

```bash
docker logs cmdx_backend --since 24h 2>&1 | grep -c 'QueuePool limit'
```

To see who holds connections, by container address:

```bash
docker exec cmdx_postgres psql -U cmdx -d cmdx -c \
  "select client_addr, count(*) from pg_stat_activity where usename='cmdx' group by 1 order by 2 desc;"
```

If one container holds most of them, see [size the connection budget](../install/production.md#size-the-connection-budget).

## Check background work

To see whether the workers respond, and what they're doing:

```bash
docker exec cmdx_celery_worker celery -A core.tasks.app inspect ping
docker exec cmdx_celery_worker celery -A core.tasks.app inspect active
```

The RabbitMQ management screen shows queue lengths. Its port is on loopback and uses the default `guest` login, so open it through an SSH tunnel:

```bash
ssh -L 15672:127.0.0.1:15672 <user>@<host>
```

Then open `http://localhost:15672`. A queue that keeps growing means the workers aren't keeping up, or aren't consuming that queue.

## View traces

The Compose stack sends a trace for each request to Jaeger. To open it, use an SSH tunnel to port 16686, then open `http://localhost:16686` and select the service `lms-framework`. The workers report as `lms-celery-worker` and `lms-celery-beat`.

Jaeger keeps traces in memory, so they are lost when it restarts, and old traces drop off. It keeps 1000 traces by default. To change that, set `JAEGER_MAX_TRACES`, `JAEGER_MEM_LIMIT` and `JAEGER_GOMEMLIMIT` together: 1000 traces use about 450 MB, while 2000 didn't fit in 1 GB. Then apply the change to that service alone:

```bash
docker compose -f docker-compose.yml up -d --no-deps jaeger
```

To send traces to your own collector, or to turn tracing off, change `OTEL_EXPORTER_OTLP_ENDPOINT` or `OTEL_ENABLED` in your production Compose file. Compose fixes both, so `.env` has no effect. See [values Compose sets for you](../install/production.md#values-compose-sets-for-you).

## Collect metrics with Prometheus

Prometheus metrics are off by default.

1. Set these in `.env`, then run `docker compose up -d backend`:

   ```bash
   ENABLE_PROMETHEUS=true
   METRICS_TOKEN=<a random value>
   ```

2. Point Prometheus at `http://<host>:8000/metrics`, with `METRICS_TOKEN` as a bearer token.

The web app's proxy doesn't forward `/metrics`, so scrape the backend's port 8000 directly, over a private network. Always set `METRICS_TOKEN`. Without it, anyone who can reach the port can read the metrics.

## Report errors to Sentry

Set `SENTRY_DSN` and `SENTRY_ENVIRONMENT` in `.env`, then recreate the app containers.

## Use the logs in the app

Administrators can use **Logs** in the app. See [review audit logs](./audit-logs.md):

| Screen | Shows |
| --- | --- |
| **Overview** | Activity and event categories for the last 24 hours |
| **Audit log** | Who changed what, with filters and export |
| **Access log** | HTTP requests |
| **Settings** | Which actions are audited, alert thresholds, retention, export and the SIEM webhook |

CMDX also watches for bursts of errors. By default, 50 errors within 5 minutes alerts administrators and auditors, at most once every 15 minutes. The `AUDIT_ERROR_SPIKE_*` keys control this.

## Related

- [Review audit logs](./audit-logs.md)
- [Manage scheduled tasks](./scheduled-tasks.md)
- [Troubleshoot an install](./troubleshooting.md)
- [Logging for developers](../../developers/architecture/logging.md)
