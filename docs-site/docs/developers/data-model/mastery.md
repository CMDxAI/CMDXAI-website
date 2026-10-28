---
id: mastery
title: Mastery
sidebar_label: Mastery
sidebar_position: 5
doc_type: reference
audience: developers
source_prd: none
ai_drafted: true
last_verified: 2026-10-28
tags: [data-model, mastery]
---

Where CMDX stores mastery today: the mastery score of a SCORM package, and how much of a media item each learner has watched.

:::note
These are the only two places mastery is stored. A mastery model that covers every learning item type is being decided.
:::

## SCORM mastery score

Each SCORM package has a `mastery_score`, the score a learner needs to pass.

| Table | Column | Type | Default | Meaning |
| --- | --- | --- | --- | --- |
| `scorm_packages` | `mastery_score` | float | `NULL` | 0 to 100. `NULL` means no mastery score. |

When an attempt reports a score, CMDX uses `mastery_score` to decide whether it passed:

- If the package already reported `passed` or `failed`, that status stands.
- Otherwise the attempt's status becomes `passed` when its score is at least `mastery_score`, and `failed` when it is lower. This replaces a `completed` status. The score itself is kept.
- If `mastery_score` is `NULL`, the status the package reported stands.

A SCORM learning item with no completion criteria of its own is complete when its status is `passed` or `completed`. See [Learning item contract](../plugins/learning-item-contract.md).

## Media mastery

`media_mastery` holds each learner's progress through a media item: how much they have watched, and whether that reaches the item's completion threshold.

| Column | Type | Default | Meaning |
| --- | --- | --- | --- |
| `user_id` | UUID | required | References `users.id`; deleted with the user. |
| `media_item_id` | UUID | required | References `media_items.id`; deleted with the media item. |
| `version_id` | UUID | required | The media version the progress counts against. References `media_item_versions.id`. |
| `status` | string (16) | `not_started` | `not_started`, `in_progress`, `completed` or `invalidated`. |
| `coverage_pct` | float | `0.0` | Percentage of the media watched, without counting any part twice. |
| `last_position_ms` | integer | `0` | Where playback last stopped, in milliseconds. |
| `max_verified_position_ms` | integer | `0` | The furthest point reached by watching, in milliseconds. |
| `first_play_at`, `last_play_at`, `completed_at` | datetime | `NULL` | |

The table also has a UUID `id`, a nullable `tenant_id` and timestamps. `tenant_id`, `user_id` and `media_item_id` are unique together, so each learner has one row per media item.

### How the status changes

- Each playback report recalculates `coverage_pct`. An image counts as 100 % once it has been viewed.
- When `coverage_pct` reaches the media item's `completion_threshold_pct`, the status becomes `completed` and `completed_at` is set. A `completed` row stays `completed` if later coverage is lower.
- A new media version created with the invalidate recompletion policy sets every learner's row for that item to `invalidated`, and resets coverage and positions to 0. The row stays `invalidated` until the learner reaches the threshold on the new version.
- Each update also updates the learner's progress on the learning item. See [Learning items](./learning-items.md#progress).

## Related

- [Learning items](./learning-items.md)
- [Grades](./grades.md)
