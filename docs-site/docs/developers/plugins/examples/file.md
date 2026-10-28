---
id: file
title: File learning items
sidebar_label: File
sidebar_position: 3
doc_type: explanation
audience: developers
source_prd: "225247233"
ai_drafted: true
last_verified: 2026-10-28
tags: [examples, learning-items]
---

A file learning item gives learners a document, image or recording to open or download. It is a built-in type, `kind: "file"`, provided by the `files` module through the [learning item contract](../learning-item-contract.md).

## How it fits together

| Record | What it is |
| --- | --- |
| File | The stored bytes, with their type, size, hash and scan status. Identical bytes are stored once per tenant. |
| File item | The learning item's own record: one per learning item, holding the viewer hint and whether preview and download are allowed. |
| File version | One version of the file item's content. The file item points at its current version. |

The tables are `files`, `file_items` and `file_versions`. Viewing sessions, access events and version reviews have tables of their own.

## Create a file learning item

1. Upload the file, which returns a `file_id`.
   - Small files: `POST /api/v1/learning-items-api/files` as multipart form data with a `file` field.
   - Larger files: start an upload session with `POST /api/v1/learning-items-api/files/upload`, send chunks of up to 5 MB to `PUT .../files/sessions/{session_id}/chunk/{n}`, then `POST .../files/sessions/{session_id}/complete`. A session expires after 1 hour.
2. Create the learning item with `POST /api/v1/learning-items-api/learning-items`, `kind: "file"` and this `payload`:

   | Field | Required | Meaning |
   | --- | --- | --- |
   | `file_id` | Yes | The uploaded file. |
   | `viewer_hint` | No | How the player shows it: `pdf`, `docx`, `image`, `audio` or `generic` (default). |
   | `comment` | No | The first version's comment. Default `Initial version`. |

   CMDX creates version 1 and makes it current. Preview and download are both allowed.
3. To change the viewer hint, turn preview or download off, or point the item at another version, send `PATCH /api/v1/learning-items-api/learning-items/{id}` with a `content` object holding `viewer_hint`, `allow_preview`, `allow_download` or `current_version_id`.

Uploads are limited by the tenant's maximum upload size, 10 MB by default, and by its storage quota. A larger upload fails with `413`.

## What CMDX checks

- **File type.** CMDX reads the file's type from its content, not its name, and checks it against the types allowed for the upload.
- **Virus scan.** When ClamAV is turned on, a background job scans new files every 30 seconds. An infected file is quarantined and never delivered. A file waiting for its scan isn't delivered either, except to users with `file:scan_override`.
- **Access.** Every request is limited to the user's tenant and needs `file:download`. Learners can't open a file item whose learning item is a draft, archived or deleted.

## Preview and download

`GET .../file-items/{id}/preview-url` and `GET .../file-items/{id}/download-url` return a signed URL for the current version. The URL works only for the user who asked for it, and expires after the tenant's signed URL lifetime, 300 seconds by default. An expired URL returns `410`.

Preview works only when `allow_preview` is on and the file is a PDF, an image, or an audio or video format a browser can play. Download works only when `allow_download` is on.

## Versions

`POST .../file-items/{id}/versions?file_id=<file-id>&comment=<text>` adds a version and makes it current. To go back to an earlier version, set `current_version_id` to it with `PATCH`, as in step 3.

## Progress and completion

| Criterion | Met when |
| --- | --- |
| `view` | The learner has opened a preview or a viewing session. |
| `download` | The learner has downloaded the file. |
| `mark_complete` | The learner has marked the item complete. |

The default criterion is `mark_complete`. A file usually opens outside the app, so CMDX can't always tell that it was read, and the learner confirms instead. The player marks the item complete with `POST .../progress/{learning_item_id}/mark-complete`, which works only when the item's criteria include `mark_complete`.

Opening the file moves the learner's progress to `in_progress`. A viewing session ends after 120 seconds without a heartbeat, or after 4 hours.

## Endpoints

All paths are under `/api/v1/learning-items-api`.

| Method and path | Needs |
| --- | --- |
| `POST /files` | `file:upload` |
| `POST /files/upload`; `PUT /files/sessions/{sid}/chunk/{n}`; `POST /files/sessions/{sid}/complete` | `file:upload` |
| `GET /file-items/{id}`; `GET /file-items/{id}/preview-url`, `/download-url` | `file:download` |
| `POST /file-items/{id}/viewing-sessions`; `POST /file-items/viewing-sessions/{sid}/heartbeat`, `/end` | `file:download` |
| `GET /file-items/{id}/versions` | `file:download` |
| `POST /file-items/{id}/versions` | `file:manage` |
| `GET /file-items/{id}/stats`, `/access-log`, `/access-log/export` | `file:manage` |
| `POST /file-items/{id}/review/submit`; `GET /file-items/{id}/review/history` | `file:manage` |
| `POST /file-items/{id}/review/decision` | `file:review` |

By default, learners have `file:download`; course authors have `file:upload`, `file:download` and `file:manage`; and category administrators also have `file:scan_override`.

## Settings

| Setting | Default | Where |
| --- | --- | --- |
| Maximum upload size | 10 MB | Storage settings, per tenant |
| Storage quota | Unlimited | Storage settings, per tenant |
| Signed URL lifetime | 300 seconds (60 to 86,400) | Storage settings |
| `CLAMAV_ENABLED` | `false` | Environment |

## Related

- [Learning item contract](../learning-item-contract.md)
- [Learning items data model](../../data-model/learning-items.md)
