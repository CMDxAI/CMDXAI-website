---
id: overview
title: Administrator overview
sidebar_label: Overview
sidebar_position: 1
doc_type: explanation
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [overview]
---

This guide is for tenant and system administrators and IT teams running an install. Use it to install and upgrade CMDX, configure tenants, SSO, roles and feature flags, and keep an install running. This page explains who does what, where each setting lives, and what order to work in.

## Who does what

CMDX has three levels of administrator. Each page in this guide says which one it needs.

| Level | Role | Can do |
| --- | --- | --- |
| Host operator | Shell access to the server | Edits `.env`, starts and upgrades containers, reads logs. Needs no CMDX account. |
| Super Administrator | `platform_superadmin`, usually with `admin` | Creates tenants, and changes every setting under **Settings** for the whole install. The install wizard creates this account. |
| Tenant administrator | `tenant-admin`, or the `org_admin` member role | Manages one tenant: its members, departments and tenant overrides. |

An **auditor** can read the Site Admin settings and audit logs but can't change them. See [users and roles](./identity/users-and-roles.md).

## Where settings live

Settings live in three places. A later row overrides an earlier one where a setting exists in both.

| Place | Who changes it | When it applies | Examples |
| --- | --- | --- | --- |
| `.env` on the host | Host operator | When the containers are recreated | Database, secrets, ports, image tag. |
| **Settings** in the app, for the whole install | Super Administrator | Within about a minute | Email, storage, sign-in providers, branding, security policy |
| **Settings** in the app, for one tenant | Tenant administrator | Within about a minute | Email and security overrides. See [tenant settings](./tenants/tenant-settings.md). |

In the Compose file, a few values are fixed in `docker-compose.yml` and win over `.env`. [Install for production](./install/production.md#values-compose-sets-for-you) lists them.

## Where to start

For a new install, work in this order:

1. Check the [requirements](./install/requirements.md).
2. [Install with Docker Compose](./install/docker-compose.md), using the [installation wizard](./install/installation-wizard.md).
3. Apply the [production steps](./install/production.md), unless this is a trial, and [set your keys](./install/secrets-and-encryption-keys.md).
4. [Configure email](./configuration/email.md), [notifications](./configuration/notifications.md) and [file storage](./configuration/storage.md).
5. Set up sign-in: [users and roles](./identity/users-and-roles.md), then [OIDC](./identity/sso-oidc.md) if you use Google or GitHub.
6. [Change the branding](./tenants/branding.md), [create your tenants](./tenants/create-a-tenant.md) and set up [groups](./identity/groups.md).
7. Set up [backups](./install/backup-and-restore.md) and [monitoring](./operations/monitoring.md), and read how to [upgrade](./install/upgrade.md).

To try CMDX on a laptop instead, follow the [quick start](/getting-started/quick-start).

## Current limits

CMDX is moving quickly and no version has been released yet. These limits affect how you plan an install:

- **Sign-in.** How single sign-on and password sign-in behave is still being settled. Talk to your CMDX contact before you plan a rollout. See [OIDC](./identity/sso-oidc.md), [SAML](./identity/sso-saml.md) and [LDAP](./identity/ldap.md).
- **API-only areas.** [Developer settings](./configuration/developer-settings.md) and [skills and taxonomies](./configuration/skills-and-taxonomies.md) have no screens yet. Use the API.
- **Languages.** The apps are in English only. See [languages](./configuration/languages.md).
- **Feature flags.** Almost nothing in CMDX reads them yet. See [feature flags](./configuration/feature-flags.md).
- **Scheduled tasks.** There is no screen to see or run them. See [scheduled tasks](./operations/scheduled-tasks.md).
- **File storage.** Local disk and S3 are the only backends you can save in the app, and some files stay on local disk either way. See [file storage](./configuration/storage.md).
- **Tenant branding.** Branding is one set for the whole install. See [change the branding](./tenants/branding.md).

## Next

- [Requirements](./install/requirements.md): what a host needs before you install
- [Troubleshoot an install](./operations/troubleshooting.md): fixes for common problems
