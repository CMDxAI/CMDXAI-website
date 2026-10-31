---
id: storage
title: Configure file storage
sidebar_label: Storage
sidebar_position: 4
doc_type: how-to
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [configuration]
---

Choose where CMDX stores uploaded files. By default, files go on the server's disk, in the `cmdx_storage` Docker volume. You can move uploads to S3 or an S3-compatible service.

## Backends

| Backend | Can be saved in **Settings** |
| --- | --- |
| Local disk | Yes |
| Amazon S3, or an S3-compatible service | Yes |
| Google Cloud Storage | No. You can test the connection, but **Save** is off while it's selected. |
| Azure Blob Storage | No. You can test the connection, but **Save** is off while it's selected. |

Only a Super Administrator can change the backend. It applies to the whole install, and every tenant uses the same one.

:::warning
Moving to S3 doesn't move everything. Keep the `cmdx_storage` volume and back it up, whichever backend you choose. These parts of CMDX use local disk whatever you save here:

- **SCORM.** Packages are extracted to local disk, and CMDX expects the uploaded zip there too. Test SCORM publishing before you move to S3.
- **Assignments.** Attachment and submission paths are read from `UPLOAD_DIR`.
- **Exports.** Report exports and user exports.

The S3 screen also warns that quiz, media and learning-item files stay on local disk.
:::

<!-- TODO: verify: publish a SCORM package and upload an assignment file with S3 saved. These limits come from reading the code on main. -->

CMDX doesn't move existing files when you change the backend. Choose the backend before people upload content.

## Set up S3

1. Create a bucket, and credentials that can read, write and delete objects in it.
2. Go to **Settings** > **Storage**.
3. Under **Storage backend**, choose S3, and fill in these fields:

   | Field | Required | Description |
   | --- | --- | --- |
   | **Bucket** | Yes | The bucket's name |
   | **Region** | | Such as `us-east-1` |
   | **Endpoint URL** | | Only for S3-compatible services |
   | **Access key**, **Secret key** | | Encrypted when saved. Leave them blank to keep the stored values. |
   | **CDN prefix** | | The public base address for served files |

4. Select **Test connection**. CMDX writes, reads and deletes a small file. The **Connectivity** card shows the result.
5. Select **Save**.

Leave `STORAGE_BACKEND` in `.env` as `local`. It is a separate setting, used for report and user exports, and only `local` works. Any other value makes those exports fail.

## Set up local disk

Keep the default **Storage directory** unless you have a reason to change it. With Compose, the default is `/app/storage_uploads`, which is on the `cmdx_storage` volume.

:::warning
A directory outside that volume is inside the container, and is deleted when the container is replaced. To use a different disk, mount a volume there in the Compose file first.
:::

The backend, the worker and beat must all see the same files. On more than one host, use storage they all share.

## Set upload limits

Two fields on the same screen apply to the whole install:

| Field | Default | Description |
| --- | --- | --- |
| **Max upload size (MB)** | 10 | The largest file CMDX accepts |
| **Download link expiry (minutes)** | 5 | How long a signed download link stays valid |

Raising the upload limit may not be enough, because the proxies have limits of their own:

| Layer | Limit | Change it with |
| --- | --- | --- |
| CMDX | **Max upload size (MB)** | **Settings** > **Storage** |
| Web container (nginx) | 20 MB | The limit is built into the `frontend` image, in `deployment/nginx/frontend.conf`. |
| Caddy | 20 MB | `CADDY_MAX_BODY` in `.env` |
| Your own proxy | Varies | Your proxy's configuration |

A file over a proxy's limit gets HTTP 413 before it reaches CMDX.

### Limit a tenant's storage

A tenant can have a quota, `quota_bytes`. The screen doesn't edit it, so set it through the API. See [tenant settings](../tenants/tenant-settings.md#what-a-tenant-can-override). With no quota, a tenant has no limit.

The **Usage** card shows the space in use across every tenant.

## Scan uploads for viruses

CMDX can scan uploads with ClamAV. It is off by default. A background job checks new uploads every 30 seconds.

To turn it on, set these in `.env`, then run `docker compose up -d`:

```bash
CLAMAV_ENABLED=true
COMPOSE_PROFILES=antivirus
```

If you use Caddy, set `COMPOSE_PROFILES=edge,antivirus`. The first start downloads the full signature set, so scanning doesn't begin straight away.

Each upload has a scan status:

| Status | Means | Can be downloaded |
| --- | --- | --- |
| `PENDING` | Waiting to be scanned | No |
| `CLEAN` | Scanned, nothing found | Yes |
| `SKIPPED` | Scanning is off | Yes |
| `UNSUPPORTED` | Larger than `CLAMAV_MAX_SCAN_SIZE`, 100 MB by default | Yes |
| `INFECTED` | A virus was found. The file moves to quarantine. | No |

SCORM is stricter: a package is extracted only after a clean scan, so with ClamAV off, packages can't be published.

:::warning
If `CLAMAV_ENABLED` is on and ClamAV can't be reached, uploads stay `PENDING` and can't be downloaded. `.env.example` turns it on, so check this on a new install.
:::

## Related

- [Install for production](../install/production.md)
- [Upgrade CMDX](../install/upgrade.md#step-2-back-up): back up the volume
