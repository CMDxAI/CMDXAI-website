---
id: tenant-settings
title: Tenant settings
sidebar_label: Tenant settings
sidebar_position: 2
doc_type: reference
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [tenants]
---

The settings each tenant has. A tenant starts with the global settings for the install. It can then override some of them, and the rest are fixed for every tenant. This page lists both.

## How overrides work

The effective value for a tenant is the global value with the tenant's overrides laid on top. Saving an override doesn't change the global value. A saved change reaches running services within about a minute.

Which screen you see depends on your role:

| Role | **Settings** shows | Changes apply to |
| --- | --- | --- |
| Super Administrator | Global settings | Every tenant without an override |
| Tenant administrator | Your tenant's overrides, on **Security**, **Email** and **Authentication providers** | Your tenant |
| Auditor | Read-only | Nothing |

The API has the same split: `/api/v1/admin/global-settings/{category}` for global settings, and `/api/v1/tenant/settings/{category}` for one tenant. The tenant comes from the `X-Tenant-ID` header, and you must be a member of that tenant.

## Organization details

These are on **Settings** > **Tenancy**.

| Setting | Editable | Description |
| --- | --- | --- |
| Name | Yes | The tenant's display name |
| URL slug | No | Set when the tenant is created |
| Primary email domain | Yes | Optional, for example `acme.com` |
| Plan | Yes | A label. It defaults to `free`, and doesn't turn anything on or off. |
| Max users | Yes | Stored and shown, but not enforced |
| Logo | Yes | PNG, JPEG, GIF, WebP or SVG, up to 2 MB |
| Active | Yes | Suspending a tenant cuts off access for every member |

## What a tenant can override

| Category | Keys a tenant can override | Notes |
| --- | --- | --- |
| Security | `password_min_length`, `password_require_uppercase`, `password_require_number`, `password_require_special`, `session_timeout_minutes`, `access_token_ttl_minutes`, `refresh_token_ttl_minutes`, `mfa_required`, `mfa_required_for_admins`, `max_login_attempts`, `lockout_duration_minutes`, `remember_me_enabled`, `remember_me_days` | An override can only tighten the global policy. The server rejects a looser value. |
| Email | `host`, `port`, `username`, `password`, `use_tls`, `start_tls`, `sender_email`, `sender_name`, `reply_to`, `max_per_minute`, `max_recipients_per_message` | Lets a tenant send through its own server. See [configure email](../configuration/email.md#send-from-a-tenants-own-server). |
| Branding | `site_name`, `tagline`, `logo_url`, `icon_url`, `favicon_url`, `primary_color`, `secondary_color`, `danger_color`, `support_email`, `footer_text`, `custom_domain`, `default_locale`, `timezone` | The API accepts these, but the app and the sign-in page read only the global branding. See [change the branding](./branding.md). |
| Storage | `quota_bytes` | A storage limit for the tenant, set through the API. The screen doesn't edit it. |
| Feature flags | `flags` | See [feature flags](../configuration/feature-flags.md). |
| Profile fields | `enforce_required_on_update`, `prompt_on_next_login`, `block_enrollment_when_incomplete` | Controls how required profile fields are enforced. |

## What only a Super Administrator can set

Audit and maintenance settings have no tenant overrides. Neither does anything in Storage except `quota_bytes`. In Security, these three keys are also global only. A tenant request that includes one of them is rejected:

- `password_expiry_days`
- `ip_allowlist`
- `cors_origins`

## Sign-in providers

A tenant has its own row for each [authentication provider](../identity/sso-oidc.md), on top of the global row. Saving one doesn't change the other.

- A tenant can turn a provider on only if it is on for the whole install. The exception is **Local (email + password)**, which a tenant controls by itself.
- The last enabled provider can't be turned off, for the install or for a tenant.
- A test result is stored for the scope you tested in.

## Other per-tenant features

| Feature | How to set it |
| --- | --- |
| Calendar | The `calendar.calendar_enabled` key. See [feature flags](../configuration/feature-flags.md#the-calendar). |
| Plugins | A `per_tenant` plugin is enabled for one tenant at a time, under **Settings** > **Plugins**. |

## Related

- [Create a tenant](./create-a-tenant.md)
- [Configuration for developers](../../developers/architecture/config-service.md)
