---
id: requirements
title: Requirements
sidebar_label: Requirements
sidebar_position: 1
doc_type: reference
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [install]
---

Hardware, software and service requirements for CMDX. The supported way to run CMDX is the container images with Docker Compose. See [install with Docker Compose](./docker-compose.md).

## Host

| Requirement | Value |
| --- | --- |
| CPU architecture | `linux/amd64` or `linux/arm64`. Every image is published for both. |
| Docker Engine | 20.10 or later. The non-root frontend binds port 80 inside its container, which needs this version. |
| Docker Compose | v2 or later |
| Registry access | A GitHub token with `read:packages`. The images on `ghcr.io/cmdxai/cmdx-lms` are private. |

### Memory and CPU

CMDX doesn't publish a minimum size. These figures come from the sizing of a production host:

| Item | Figure |
| --- | --- |
| Production host | 4 vCPU and 7 GB of RAM, for the settings in [size the connection budget](./production.md#step-1-size-the-connection-budget) |
| Jaeger | Up to 1 GB by default. Set by `JAEGER_MEM_LIMIT`. |
| ClamAV | About 1 GB more, when you turn it on |

Add to these for your own number of users and the size of your content. Run a load test before you go live.

### Disk

The install wizard warns when local storage has less than 500 MB free. That is the lowest limit CMDX checks, not a target. Disk use depends on your uploads, so plan for them. Docker volumes hold the database, the uploads and the certificates.

## Services

The Compose file runs each of these for you. It pins the version in the table.

| Service | Version in Compose | Lowest version CMDX supports | What it does |
| --- | --- | --- | --- |
| PostgreSQL | 15 | 13 | Main database |
| Redis | 7 | 7 | Cache, sessions and Celery results |
| RabbitMQ | 3.13 | Not stated | Message broker for Celery |
| Jaeger | 1.55 | Not stated | Stores request traces |
| Mailpit | 1.31 | Not needed in production | Catches email in development |
| ClamAV | 1.5 | Optional | Scans uploads. See [file storage](../configuration/storage.md#scan-uploads-for-viruses). |
| Caddy | 2.11 | Optional | Handles TLS on a public host |

### Databases

PostgreSQL is the database to use. The container entrypoint waits for PostgreSQL before it starts, so a container deployment needs it.

CMDX also accepts these in `DATABASE_URL`. The install wizard checks the version where a minimum is listed.

| Database | Lowest version | Notes |
| --- | --- | --- |
| PostgreSQL | 13 | 14 or later recommended |
| MySQL | 8.0 | |
| MariaDB | None set | |
| SQL Server | None set | |
| Oracle | None set | |
| SQLite | 3.35 | For evaluation only |

The database user needs `CREATE`, `CREATE EXTENSION` and `ALTER` on the target schema. The database must use UTF8 with a deterministic collation, and must have no CMDX tables in it before the install.

## Network

### Ports

By default only the API listens on every interface. The others bind to `127.0.0.1`.

| Service | Port | Default bind | Change it with |
| --- | --- | --- | --- |
| API | 8000 | All interfaces | `BACKEND_PUBLISH` |
| Web app | 8080 | `127.0.0.1` | `FRONTEND_PUBLISH` |
| PostgreSQL | 5432 | `127.0.0.1` | `POSTGRES_PUBLISH` |
| Redis | 6379 | `127.0.0.1` | Compose file |
| RabbitMQ | 5672, 15672 | `127.0.0.1` | Compose file |
| Jaeger | 16686, 4317, 4318 | `127.0.0.1` | Compose file |
| Mailpit | 1025, 8025 | `127.0.0.1` | Compose file |
| ClamAV | 3310 | `127.0.0.1` | Compose file |
| Caddy | 80, 443 and 443/udp | All interfaces | Compose file |

Docker writes its port rules straight into iptables, so they bypass firewalld. A port published on every interface is open to the internet even if `firewall-cmd` says it isn't. Keep backing services on loopback or a private address.

### Outbound access

| To | When |
| --- | --- |
| `ghcr.io` | Pulling images, and for each automatic update check |
| Your SMTP server | Sending email |
| Let's Encrypt | When Caddy handles TLS |
| Your identity provider | When you use single sign-on |
| The ClamAV signature servers | First start of ClamAV, and for updates |

### TLS and DNS

A public install needs a domain name that points at the host. Caddy, included in the Compose file, gets and renews the certificate. See [install for production](./production.md#step-5-turn-on-tls).

## Browsers and mobile apps

CMDX is one app for web, iOS and Android. The web app is a static site served by the `frontend` container, so learners need only a current browser.

## Run without containers

Developers can run the backend from source. That needs Python 3.11 or later, and Node.js 18 or later to run the web app. The install wizard warns if Node.js is older than 20. A container install doesn't need Node.js or Python on the host, and the wizard's Node.js warning is expected there.

## Related

- [Install with Docker Compose](./docker-compose.md)
- [Install for production](./production.md)
- [Environment variables](../configuration/environment-variables.md)
