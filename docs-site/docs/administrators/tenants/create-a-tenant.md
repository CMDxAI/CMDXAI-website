---
id: create-a-tenant
title: Create a tenant
sidebar_label: Create a tenant
sidebar_position: 1
doc_type: how-to
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [tenants]
---

Add a new tenant to a CMDX deployment. A tenant is an organization: it has its own members, courses and settings, and no tenant can see another's data. The app calls tenants organizations, so this page uses both words.

All tenants share one database. Adding a tenant adds a row, not a new database or schema. See [multi-tenancy](../../developers/architecture/multi-tenancy.md).

## Before you start

You need the `platform_superadmin` role. The Super Administrator from the install wizard has it. The `admin` role alone isn't enough: other administrators see **Only platform superadmins can create organizations.**

## Create the tenant

1. Sign in and go to **Settings** > **Tenancy**. A Super Administrator lands on the list of all organizations.
2. Select **New organization**.
3. Fill in the form:

   | Field | Required | Description |
   | --- | --- | --- |
   | **Organization name** | Yes | Up to 255 characters. You can change it later. |
   | **URL slug** | Yes | 2 to 100 lowercase letters, digits and hyphens. It must be unique, and you can't change it later. |
   | **Primary email domain** | No | For example, `acme.com`. |
   | **Max users** | No | Leave blank for no limit. See the note below. |

4. Select **Create organization**. The new tenant gets its own role context straight away.
5. In **Add the first admin**, choose who runs the tenant, or skip this and add members later.

:::note
**Max users** is stored and shown on the tenant's usage figures, but CMDX doesn't enforce it. You can add more members than the limit.
:::

## Add members

Open the tenant from the list, then select the **Members** tab. You can add people one at a time or import a CSV file. Each membership has a role, and can have a department and an expiry date. See [tenant roles](../identity/users-and-roles.md#tenant-roles).

A person must have a user account before you can add them. A user can belong to more than one tenant.

Use the **Departments** tab to set up departments, which can be nested.

## How people reach a tenant

After sign-in, the app sends the tenant's ID with each API request, based on the person's membership. They all use the same address.

CMDX can also pick a tenant from a subdomain, such as `acme.example.com`, when `DEFAULT_TENANT_DOMAIN` is `example.com`. That needs a DNS record and a certificate for each subdomain, and the Caddy setup in the Compose file covers only `CADDY_DOMAIN`. Subdomains also don't change the branding, which is one set for the whole install.

## Suspend or delete a tenant

To suspend a tenant, open it and select **Suspend organization** under **Danger zone**, then type the slug to confirm. Every member loses access at once. To undo it, select **Reactivate organization**.

To delete a tenant, call the API as a Super Administrator:

```bash
curl -X DELETE https://lms.example.com/api/v1/organizations/<org-id> \
  -H "Authorization: Bearer $TOKEN"
```

This is a soft delete: the row is marked as deleted and stays in the database.

## Related

- [Tenant settings](./tenant-settings.md)
- [Users and roles](../identity/users-and-roles.md)
