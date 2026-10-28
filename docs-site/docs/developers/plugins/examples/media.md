---
id: media
title: Media learning items
sidebar_label: Media
sidebar_position: 2
doc_type: explanation
audience: developers
source_prd: "226263041"
ai_drafted: true
last_verified: 2026-10-28
tags: [examples, learning-items, media]
---

A media learning item plays a video, an audio recording or an image, and counts the item complete when the learner has watched or listened to enough of it. It is a built-in type, `kind: "media"`, provided by the `media` module through the [learning item contract](../learning-item-contract.md).

:::note
CMDX also has an older `video` kind with its own module and routes, and the course builder still creates `video` items. This page covers `media`.
:::

## How it fits together

| Record | What it is |
| --- | --- |
| Media item | The learning item's own record: its media type, source, completion threshold and whether learners may skip ahead. |
| Version | One upload of the content. A new version sends the item back to draft. |
| Asset and renditions | The uploaded file, and the encodings made from it for playback. |
| Tracks | Captions, subtitles, descriptions, transcripts and chapters, each with a language. |
| Mastery | Each learner's watched coverage. See [Mastery](../../data-model/mastery.md#media-mastery). |

`media_type` is `video`, `audio` or `image`. The source is usually `native`, an upload to CMDX. External sources such as YouTube, Vimeo, Mux, HLS, DASH and direct links are also accepted.

## Create a media learning item

1. Create the learning item with `POST /api/v1/learning-items-api/learning-items`, `kind: "media"` and a `payload`:

   | Field | Default | Meaning |
   | --- | --- | --- |
   | `media_type` | Required | `video`, `audio` or `image`. Without it, only the learning item is created. |
   | `source_mode` | `native` | Where the content comes from. |
   | `completion_threshold_pct` | `90` | Coverage, 0 to 100, that completes the item. |
   | `allow_seek_ahead` | `true` | Whether the learner may skip past what they've watched. |

2. Upload the content in chunks: `POST /api/v1/media/uploads/init`, `PUT /api/v1/media/uploads/{session_id}/chunks/{i}` for each 5 MB chunk, then `POST /api/v1/media/uploads/{session_id}/complete`.
3. CMDX scans the file, reads its length and format, and encodes renditions in the background. The item becomes `ready` when this finishes.
4. Publish the item. Publishing needs the item to be `ready`. It also needs captions when the tenant requires them, alt text for an image, and approval when the tenant requires review.

## Playback

1. The player starts a session with `POST /api/v1/media/{id}/playback/session`. The item must be published.
2. The session returns signed URLs for the manifest, segments and tracks. They expire with the session, after 600 seconds; the player refreshes them with `POST /api/v1/media/{id}/playback/refresh`.
3. Every 15 seconds the player reports what was played with `POST /api/v1/media/playback/{session_token}/beacons`.

## Watched coverage and completion

CMDX records the ranges the learner has played and merges them, so watching the same part twice counts once. Coverage is the merged length as a percentage of the media's duration, up to 100. An image counts as 100 % once it has been shown.

When `allow_seek_ahead` is `false`, a range that starts past the furthest point the learner has reached is ignored, so skipping ahead earns no coverage.

When coverage reaches `completion_threshold_pct`, the learner's media mastery becomes `completed` and their learning item progress updates.

| Criterion | Met when |
| --- | --- |
| `media_pct_gte`, `video_pct_gte` | Coverage is at least the threshold. |
| `view` | The learner has started the item. |
| `mark_complete` | The learner has marked it complete. |
| `time_spent_gte` | Time on the item is at least the threshold, in seconds. |

The default criterion is `media_pct_gte`, with the item's pass mark or else its completion threshold.

### New versions

`POST /api/v1/media/{id}/versions` takes a recompletion policy:

| Policy | Effect on learners who completed the item |
| --- | --- |
| `invalidate` (default) | Their mastery becomes `invalidated` and their coverage restarts from 0. |
| `preserve` | Their coverage carries over to the new version. |

## Endpoints

All paths are under `/api/v1/media`. A user without access to an item gets `404`.

| Method and path | Needs |
| --- | --- |
| `POST /`; `POST /uploads/init`; `PUT /uploads/{sid}/chunks/{i}`; `POST /uploads/{sid}/complete` | `media:create` |
| `GET /`; `GET /{id}`; `GET /{id}/versions`, `/renditions`, `/tracks` | `media:read` |
| `PATCH /{id}`; `DELETE /{id}`; `POST /{id}/publish`, `/archive`, `/versions` | `media:manage` |
| `POST /{id}/tracks`; `PATCH`, `DELETE /{id}/tracks/{tid}` | `media:captions_manage` |
| `POST /{id}/renditions/{rid}/retry` | `media:transcode_override` |
| `POST /{id}/promote` | `media:promote` |
| `POST /{id}/review/submit` | `media:manage` |
| `GET /{id}/analytics/overview`, `/heatmap`, `/dropoff`, `/learners` | `media:analytics_read` |
| `POST /{id}/playback/session`, `/refresh`; `POST /playback/{token}/beacons`; `GET /{id}/my-progress` | `media:read` |

## Settings

| Setting | Default | Scope | Notes |
| --- | --- | --- | --- |
| `captions_required` | `true` | Tenant | Blocks publishing a video without captions. |
| `ladder_profile` | `standard` | Tenant | Which renditions are encoded. |
| `default_completion_threshold_pct` | `90.0` | Tenant | Not applied yet. New items use 90. |
| `MEDIA_PLAYBACK_SESSION_TTL_SECONDS` | `600` | Environment | Playback session and signed URL lifetime. |
| `MEDIA_CHUNK_SIZE_BYTES` | `5242880` | Environment | Upload chunk size. |
| `MEDIA_TELEMETRY_RETENTION_DAYS` | `30` | Environment | How long playback events are kept. |

## Related

- [Learning item contract](../learning-item-contract.md)
- [Mastery data model](../../data-model/mastery.md)
