---
id: branding
title: Change the branding
sidebar_label: Branding
sidebar_position: 3
doc_type: how-to
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [tenants]
---

Set the logo and colors learners see. Branding covers the app, the sign-in page and the footer of emails.

Branding is one set for the whole install. The app and the sign-in page load it before they know which tenant someone belongs to, so all tenants look the same. The one tenant-level image is the organization logo, under **Settings** > **Tenancy**.

## Prerequisites

You need the Super Administrator role. Prepare your images:

| Image | Used in | Size |
| --- | --- | --- |
| Square icon logo | The collapsed sidebar | PNG or SVG, at least 128×128 |
| Wordmark | The sidebar and the sign-in page | PNG or SVG, at least 200 pixels wide |
| Favicon | The browser tab | 32×32, PNG or SVG |
| Login background | The sign-in page | The largest of the images |

Uploads can be JPEG, PNG, WebP or SVG, up to 5 MB each.

## Steps

Go to **Settings** > **Branding**. The screen has five tabs. Images are saved as soon as you upload them. For everything else, save the tab when you finish. The whole app picks up the new look after saving.

To check your changes, select **Preview**, which opens the sign-in page.

### Identity

| Field | Description |
| --- | --- |
| **Platform display name** | Shown in the header, in emails and in the browser title. |
| **Tagline** | Shown on the sign-in page below the name, up to 120 characters. |
| **Square icon logo**, **Wordmark / full logo**, **Favicon** | Your images. |

### Colors

Enter colors as `#rrggbb`.

| Field | Description |
| --- | --- |
| **Primary / accent color** | The main brand color |
| **Secondary / surface color** | The secondary color |
| **Danger / destructive color** | Used for destructive actions |
| **Dark mode toggle for users** | Lets people switch between light and dark |
| **App theme** | The default for everyone: light, dark or the device setting |
| **Nav theme** | Light or dark sidebar |

### Login page

| Field | Description |
| --- | --- |
| Layout | Where the sign-in form sits on the page |
| Background | A CMDX background, your own image or a plain color |
| **Focal point** | Which part of an image stays visible when the screen crops it |
| **Darken image** | Darkens the image, up to 70%, to keep text readable |
| **Platform name** | Shown under the sign-in title and in the browser tab |
| **Logo** | The CMDX logo or your own |
| **Welcome text on background** | A heading of up to 60 characters, and a sub-heading of up to 120 |
| **Show “Powered by CMDX”** | Shows or hides the credit |

### Emails

| Field | Description |
| --- | --- |
| **Support address** | Where learners are pointed for help |
| **Footer text** | Shown at the bottom of every email |

The sender's name and address are on [**Settings** > **Email**](../configuration/email.md).

### Custom domain

**Custom domain** is stored for your reference only. CMDX doesn't check the domain, set up DNS or issue a certificate, and links in emails always use `FRONTEND_BASE_URL`. To change the address of an install, change `CADDY_DOMAIN` and `FRONTEND_BASE_URL`. See [install for production](../install/production.md#turn-on-tls).

## Verify

Open the sign-in page in a private window. Then sign in, and check the sidebar.

The store listing and home screen icon of the iOS and Android apps are set when the apps are built, not in **Settings**.

## Related

- [Tenant settings](./tenant-settings.md)
- [Configure email](../configuration/email.md)
