---
id: sso-saml
title: Set up SAML single sign-on
sidebar_label: SSO with SAML
sidebar_position: 4
doc_type: how-to
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [identity]
---

Let people sign in with a SAML identity provider. CMDX acts as a SAML 2.0 service provider, and sign-in starts from CMDX (SP-initiated).

:::warning
SAML isn't ready for general use:

- **No button.** The web sign-in page has no SAML button. People can start sign-in only from a direct link, as shown in [step 4](#step-4-sign-in).
- **One sign-in per person.** CMDX links an account to the ID of the assertion, and that ID changes each time. A person's first sign-in creates their account. Their next one doesn't match that link, so it fails with an email conflict.

Test with a pilot account, and talk to your CMDX contact before you plan a rollout.
:::

<!-- TODO: verify: both limits come from reading the code on main. Confirm the repeat sign-in failure against a real identity provider, and that the ACS check accepts https behind Caddy and the frontend nginx. -->

## Before you start

- You need the Super Administrator role.
- CMDX must be on its public HTTPS address.
- `FRONTEND_BASE_URL` must be the public address of the app. After a successful sign-in, CMDX redirects there.
- Your identity provider must publish a metadata URL that CMDX can reach. Uploading a metadata file isn't supported.
- Your identity provider must sign assertions. CMDX rejects unsigned assertions and deprecated signature algorithms.

## Step 1: Add CMDX to your identity provider

Create a SAML application with these values. CMDX doesn't publish a metadata URL of its own, so enter them by hand.

| Identity provider field | Value |
| --- | --- |
| Entity ID, or audience | A name you choose, such as `https://lms.example.com/saml` |
| Assertion consumer service URL, or reply URL | `https://lms.example.com/api/v1/auth/sso/saml/acs` |
| Binding | HTTP-POST |
| Sign assertions | Yes |

CMDX looks for the person's email in one of these attributes: `email`, `mail`, `Email`, `emailAddress` or `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress`. If none is present, it uses the name ID, if that is an email address. Send one of them.

Copy the identity provider's metadata URL.

## Step 2: Save the provider in CMDX

Go to **Settings** > **Authentication providers** and select **Configure** on **SAML 2.0**. If it isn't listed, add it with **Add provider**. Fill in these fields:

| Field | Required | Value |
| --- | --- | --- |
| **Metadata URL** | Yes | The identity provider's metadata URL |
| **Entity ID** | Yes | The same value as step 1 |
| **ACS URL** | Yes | The same value as step 1 |
| **Certificate** | No | The identity provider's signing certificate, if you want to set it by hand instead of taking it from the metadata |
| **Private key** | No | Stored, but CMDX doesn't sign its requests |

Save the form.

## Step 3: Test and turn it on

1. Select **Test** on the row. This fetches the metadata URL and checks that it returns an `EntityDescriptor` document. It doesn't try a sign-in.
2. Turn on the provider's switch.

## Step 4: Sign in

Open this address in a private window:

```text
https://lms.example.com/api/v1/auth/sso/saml/login
```

CMDX redirects to the identity provider and back. If the person has no account, CMDX creates one from their email address, with the `user` role. If the email already belongs to an account, sign-in fails, including an account created by an earlier SAML sign-in.

CMDX doesn't read groups or roles from the assertion. Assign roles in CMDX.

## Metadata changes

CMDX keeps the metadata in memory after the first fetch. After your identity provider rotates its signing certificate, restart the backend so it fetches the metadata again, or set the new certificate in the **Certificate** field.

```bash
docker compose up -d --force-recreate backend
```

## Environment variables

The `SAML_*` keys in `.env.example` aren't read by the code. Use **Settings**.

## Related

- [Set up OIDC single sign-on](./sso-oidc.md)
- [Set up LDAP sign-in](./ldap.md)
- [Sign-in providers for a tenant](../tenants/tenant-settings.md#sign-in-providers)
