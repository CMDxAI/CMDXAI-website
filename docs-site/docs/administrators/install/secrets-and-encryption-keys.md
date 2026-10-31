---
id: secrets-and-encryption-keys
title: Manage secrets and encryption keys
sidebar_label: Secrets and encryption keys
sidebar_position: 8
doc_type: how-to
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [install, security]
---

Set the keys that protect a CMDX install, and change them safely. Each key protects different data, and losing one can make stored secrets unreadable.

## What each key protects

| Key | Protects | If you change it |
| --- | --- | --- |
| `SECRET_KEY` | Sign-in tokens, session cookies, file download links and webhook signatures | Everyone is signed out, and links in use stop working. |
| `SECRET_KEY` | AI provider API keys | Saved AI keys can't be read. Enter them again. |
| `SECRET_KEY` | Video conferencing settings, unless `VC_CONFIG_ENCRYPTION_KEY` is set | Saved settings can't be read. |
| `SITE_ADMIN_DEK`, or KMS or Vault | Secrets saved under **Settings**: SMTP passwords, storage keys, sign-in provider secrets and the SIEM secret | See [change the settings key](#change-the-settings-key). |

Without `SITE_ADMIN_DEK`, KMS or Vault, CMDX derives the settings key from `SECRET_KEY` and logs a warning. Changing `SECRET_KEY` then also makes every saved setting secret unreadable.

CMDX reads the settings key from the first of these that is set:

1. AWS KMS: `SITE_ADMIN_KMS_KEY_ID` and `SITE_ADMIN_DEK_CIPHERTEXT`
2. HashiCorp Vault: `SITE_ADMIN_VAULT_ADDR`, `SITE_ADMIN_VAULT_TOKEN` and `SITE_ADMIN_VAULT_DEK_PATH`
3. `SITE_ADMIN_DEK`
4. The fallback from `SECRET_KEY`

## Prerequisites

- Shell access to the host.
- A current backup. See [Upgrade CMDX](./upgrade.md).

## Steps

1. Generate `SECRET_KEY`:

   ```bash
   python3 -c "import secrets; print(secrets.token_urlsafe(48))"
   ```

2. Generate `SITE_ADMIN_DEK`, the base64 of exactly 32 random bytes:

   ```bash
   python3 -c "import base64,secrets;print(base64.b64encode(secrets.token_bytes(32)).decode())"
   ```

3. Put both in `.env`, and make the file readable only by its owner:

   ```bash
   chmod 600 .env
   ```

4. Recreate the app containers. The backend and the Celery containers must all use the same keys:

   ```bash
   docker compose -f docker-compose.yml up -d --force-recreate backend celery_worker celery_beat
   ```

Do this before you save any secret under **Settings**. To add the key later, follow the next section.

## Change the settings key

The old key stays available while CMDX encrypts each stored secret again.

1. Set the new key as `SITE_ADMIN_DEK`, or in KMS or Vault.
2. Set the old key in `SITE_ADMIN_DEK_PREVIOUS`. CMDX tries it when the new key can't read a value.
3. Set `SITE_ADMIN_KEY_ROTATION_ENABLED=true`.
4. Recreate the backend and Celery containers.
5. Run the rotation task:

   ```bash
   docker compose -f docker-compose.yml exec celery_worker \
     celery -A core.tasks.app call site_admin.key_rotation
   ```

6. Check the worker's log for `site_admin_key_rotation: completed`.
7. Remove `SITE_ADMIN_DEK_PREVIOUS` and `SITE_ADMIN_KEY_ROTATION_ENABLED`, then recreate the containers.

<!-- TODO: verify: run the rotation on a staging host. It is scheduled nowhere, so this comes from reading the task, and PR #85 also has this open. -->

If you never set a key, the old key is the fallback from `SECRET_KEY`. `SITE_ADMIN_DEK_PREVIOUS` takes the base64 of its SHA-256 hash:

```bash
python3 -c "import base64,hashlib,getpass;print(base64.b64encode(hashlib.sha256(getpass.getpass().encode()).digest()).decode())"
```

Paste `SECRET_KEY` at the prompt, so it doesn't reach your shell history.

## View a stored secret

Stored secrets are masked as `***` in the app and the API. A Super Administrator can read one by entering their password again, with `POST /api/v1/admin/secrets/reveal`. Each reveal needs that password. An account that signs in only through a provider has no password, so it can't reveal secrets.

## Verify

- The backend log no longer shows `site_admin_dek: using SECRET_KEY fallback`:

  ```bash
  docker compose -f docker-compose.yml logs backend | grep site_admin_dek
  ```

- **Send test email** under **Settings** > **Email** still works, which shows the backend can read the SMTP password.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Saved SMTP or provider secrets stop working | The settings key changed without `SITE_ADMIN_DEK_PREVIOUS`. | Restore the old key, then follow [change the settings key](#change-the-settings-key). |
| AI providers fail after a key change | `SECRET_KEY` changed. AI keys don't use the settings key. | Enter the API keys again. |
| The backend won't start with a key error | `SITE_ADMIN_DEK` isn't the base64 of exactly 32 bytes. | Generate it again with the command above. |
| Everyone was signed out | `SECRET_KEY` changed. | Sign in again. This is expected. |

Keep copies of your keys somewhere safe, apart from your backups. A database backup can't restore stored secrets without them.

## Related

- [Install for production](./production.md)
- [Upgrade CMDX](./upgrade.md)
