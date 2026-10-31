---
id: languages
title: Configure languages
sidebar_label: Languages
sidebar_position: 7
doc_type: how-to
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [configuration]
---

Set which languages the CMDX API uses for its messages, and change its translations.

:::note
The web and mobile apps are in English only today. These settings change text that comes from the backend, such as API error messages and notifications. They don't translate the app's screens.
:::

## Prerequisites

- Shell access to the host, to change `.env`.
- The `admin` role, to change translations through the API.

## Steps

### Choose the languages

Set these in `.env`, then recreate the app containers:

| Key | Default | Description |
| --- | --- | --- |
| `I18N_ENABLED` | `true` | Turns translated messages on |
| `SUPPORTED_LOCALES` | `["en","es","fr","de"]` | Allowed languages, as a JSON list |
| `DEFAULT_LOCALE` | `en` | Used when a request names no language |
| `FALLBACK_LOCALE` | `en` | Used when a key has no translation |

CMDX ships message files for `en`, `es`, `fr` and `de`.

### Change a translation

All of these routes are under `/api/v1/translations`, and need the `admin` role.

1. List the languages:

   ```bash
   curl https://lms.example.com/api/v1/translations/locales \
     -H "Authorization: Bearer $TOKEN"
   ```

2. Export a language, to see its keys:

   ```bash
   curl https://lms.example.com/api/v1/translations/es \
     -H "Authorization: Bearer $TOKEN"
   ```

3. Update entries with `PUT /api/v1/translations`, giving a `locale` and a list of `entries`. The locale must be in `SUPPORTED_LOCALES`.

| Route | Does |
| --- | --- |
| `GET /locales` | Lists the languages |
| `GET /<locale>` | Exports a language |
| `GET /<locale>/stats` | Shows translation counts |
| `PUT /` | Adds or updates entries |
| `DELETE /` | Removes entries |
| `POST /import` | Imports entries in bulk |
| `POST /reload` | Reloads the translations |

## How CMDX picks a language

For each request, CMDX uses the first of these that is set:

1. The `?lang=` query parameter
2. The `locale` in the person's sign-in token
3. The `Accept-Language` header
4. `DEFAULT_LOCALE`

Notifications use the recipient's own locale, then `DEFAULT_LOCALE`. Each template belongs to one locale. See [Configure notifications](./notifications.md).

## Verify

Ask for an error in another language, and check that the message changes:

```bash
curl -i 'https://lms.example.com/api/v1/users/me?lang=es'
```

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| A request returns `locale not supported` | The locale isn't in `SUPPORTED_LOCALES`. | Add it, then recreate the containers. |
| The app's screens stay in English | The apps have one language today. | Expected. |
| A message appears in English | The key has no translation, so `FALLBACK_LOCALE` applied. | Add the entry. |
| `SUPPORTED_LOCALES` stops the backend starting | Lists must be JSON. | Write `["en","fr"]`, not `en,fr`. |

## Related

- [Configure notifications](./notifications.md)
- [Install for production](../install/production.md)
