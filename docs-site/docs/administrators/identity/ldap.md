---
id: ldap
title: Set up LDAP sign-in
sidebar_label: LDAP
sidebar_position: 5
doc_type: how-to
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [identity]
---

Let people sign in with their directory account. CMDX connects to your LDAP or Active Directory server with a service account, finds the person, and checks their password against the directory.

:::warning
The web sign-in page has no LDAP option, and its password form doesn't use LDAP. Today, only an API client can sign in this way, by calling `POST /api/v1/auth/sso/ldap/login`. Plan for that before you choose LDAP.
:::

## How it works

1. CMDX binds to the directory as the service account.
2. It searches under the base DN with the filter `(|(uid=<username>)(mail=<username>))`.
3. It binds as the entry it found, with the password the person typed.
4. It reads the entry's `mail` attribute, and looks for an active CMDX account with that email.

Two things follow from this:

- **Accounts must exist first.** CMDX doesn't create an account from the directory. If there is no active account with that email, sign-in fails. Add people first, for example with **Users** > **Import**.
- **Search covers `uid` and `mail`.** Active Directory usually has no `uid`, so people there sign in with their email address, not their `sAMAccountName`. Every person needs a `mail` value.

CMDX doesn't sync users or groups from the directory. Assign roles in CMDX.

## Prerequisites

- You need the Super Administrator role.
- The backend container must be able to reach the directory server.
- You need a read-only service account, and the base DN to search under.

## Steps

### Save the provider

Go to **Settings** > **Authentication providers** and select **Configure** on **LDAP / Active Directory**. If it isn't listed, add it with **Add provider**. Fill in these fields:

| Field | Required | Value |
| --- | --- | --- |
| **Host** | Yes | The server's host name, such as `ldap.example.com` |
| **Port** | No | `389` by default. Use `636` for LDAPS. |
| **Use TLS** | No | Connects with LDAPS from the start. Turn this on with port `636`. |
| **Bind DN** | Yes, in practice | The service account, such as `cn=cmdx,ou=services,dc=example,dc=com` |
| **Bind password** | Yes, in practice | The service account's password. It is encrypted and is never shown again. |
| **Base DN** | Yes | Where to search, such as `ou=people,dc=example,dc=com` |

Save the form.

:::warning
Without **Use TLS**, passwords cross the network in clear text. Use LDAPS. CMDX doesn't support STARTTLS.
:::

### Test and turn it on

1. Select **Test** on the row. CMDX connects, binds as the service account and runs a search under the base DN. A test with no bind DN or base DN checks only that the host is reachable.
2. Turn on the provider's switch.

### Try a sign-in

```bash
curl -X POST https://lms.example.com/api/v1/auth/sso/ldap/login \
  -H 'Content-Type: application/json' \
  -d '{"username": "ada@example.com", "password": "<password>"}'
```

A success returns access and refresh tokens. The route allows 5 attempts per minute. The common failures are:

| Message | Cause |
| --- | --- |
| `LDAP user not found` | No entry matches on `uid` or `mail` under the base DN. |
| `LDAP entry has no mail attribute` | The directory entry has no email. |
| `No active local account for LDAP user` | There is no active CMDX account with that email. |

## Environment variables

The `LDAP_*` keys in `.env.example` aren't read by the code. Use **Settings**.

## Related

- [Set up OIDC single sign-on](./sso-oidc.md)
- [Set up SAML single sign-on](./sso-saml.md)
- [Users and roles](./users-and-roles.md)
