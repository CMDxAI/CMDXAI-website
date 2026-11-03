---
id: sso-oidc
title: Set up OIDC single sign-on
sidebar_label: SSO with OIDC
sidebar_position: 3
doc_type: how-to
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [identity]
---

Let people sign in with an OpenID Connect provider. CMDX supports three providers: Google, GitHub and Microsoft Entra ID. There is no generic OIDC option, so another provider such as Okta or Keycloak can't connect this way.

:::warning
How single sign-on behaves is still being settled, including which providers the sign-in page offers and how sign-in matches existing accounts. Talk to your CMDX contact before you plan a rollout.
:::

## Prerequisites

- You need the Super Administrator role.
- CMDX must be on its public address. See [install for production](../install/production.md#turn-on-tls).
- `FRONTEND_BASE_URL` must be the public address of the app. After a successful sign-in, CMDX redirects there.

## Set up Google or GitHub

### Find the callback address

Go to **Settings** > **Authentication providers** and select **Configure** on **Google Workspace** or **GitHub**. If the provider isn't listed, add it with **Add provider**. The form shows the callback address to register. It has this form:

```text
https://lms.example.com/api/v1/auth/google/callback
https://lms.example.com/api/v1/auth/github/callback
```

The backend builds this address from the request it receives. Behind a proxy it can differ from what you see, for example `http` instead of `https`. If the provider reports a redirect mismatch, compare it with the address in the provider's error message.

<!-- TODO: verify: test Google sign-in through Caddy and the frontend nginx. Neither proxy passes on https, so the backend may build an http callback. -->

### Create the app at the provider

**Google:** in the Google Cloud console, create an **OAuth client ID** of type **Web application**, and add the callback address as an authorized redirect URI. If only your Workspace users should sign in, set the app's user type to **Internal**.

**GitHub:** in your organization's settings, create an **OAuth App**, and set the callback address as the **Authorization callback URL**.

Copy the client ID and client secret.

### Save the provider in CMDX

Back in the form, fill in these fields:

| Field | Value |
| --- | --- |
| **Client ID** | From the provider |
| **Client secret** | From the provider. It is encrypted and is never shown again. To keep it, leave the field blank when you edit. |
| **Redirect URI** | The callback address you found above |
| **Priority** | A number from 1 to 100. A lower number puts the button first. |

Save the form.

### Test and turn it on

1. Select **Test** on the provider's row. This checks the configuration without signing anyone in. A successful test marks the provider as verified.
2. Turn on the provider's switch.
3. Open the sign-in page in a private window, and sign in with the new button.

The button appears only for an enabled provider.

## What happens at sign-in

CMDX asks the provider for the person's identity and email address, and then:

- **First sign-in, new email.** CMDX creates an account with the `user` role, links it to the provider and adds the person to the current tenant.
- **Later sign-ins.** CMDX finds the linked account and signs the person in.
- **Unverified email.** Google and GitHub must report the email as verified, or sign-in fails.
- **Deactivated account.** Sign-in fails.

CMDX doesn't read groups or roles from the provider. Assign roles in CMDX.

## Turn a provider on for one tenant

A tenant administrator can configure a provider for their own tenant on the same screen. The provider must be on for the whole install first. See [sign-in providers](../tenants/tenant-settings.md#sign-in-providers).

## Microsoft Entra ID

1. In Microsoft Entra ID, register an application, and add this as a web redirect URI:

   ```text
   https://lms.example.com/api/v1/auth/sso/oidc/oidc_microsoft/callback
   ```

2. In CMDX, configure **Microsoft Entra ID** with the **Client ID**, **Client secret** and **Redirect URI**, and set **Issuer URL** to your tenant's issuer, such as `https://login.microsoftonline.com/<tenant-id>/v2.0`.
3. Select **Test**, then turn it on.

To test it, start sign-in at this address in a private window:

```text
https://lms.example.com/api/v1/auth/sso/oidc/oidc_microsoft/login
```

## Password sign-in

Whether you can turn off password sign-in and require single sign-on is still being settled. Talk to your CMDX contact before you rely on the **Local (email + password)** switch. CMDX refuses to turn off the last enabled provider.

## Environment variables

For Google and GitHub, CMDX falls back to `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` when the form's fields are blank. The provider must still be turned on in **Settings**. The `*_REDIRECT_URI` and `MICROSOFT_*` keys in `.env.example` aren't read by the code.

## Related

- [Set up SAML single sign-on](./sso-saml.md)
- [Set up LDAP sign-in](./ldap.md)
- [Users and roles](./users-and-roles.md)
