---
id: learning-items
title: Learning items
sidebar_label: Learning items
sidebar_position: 2
doc_type: reference
audience: developers
source_prd: none
ai_drafted: true
last_verified: 2026-10-28
tags: [data-model, learning-items]
---

The tables behind learning items, placements, completion criteria, prerequisites and learner progress. Each type's own data, such as a quiz's questions, lives in that type's tables. See [Learning item contract](../plugins/learning-item-contract.md).

## Overview

| Table | One row per | Key columns |
| --- | --- | --- |
| `learning_modules` | Learning item, and one per course | `kind`, `title`, `status` |
| `learning_item_placements` | Learning item in a course or section | `container_type`, `container_id`, `learning_item_id` |
| `learning_item_completion_criteria` | Rule that decides when an item is complete | `learning_item_id`, `criterion_type` |
| `learning_item_dependencies` | Prerequisite of a learning item | `learning_item_id`, `prerequisite_item_id` |
| `learning_item_progress` | Learner and placement of an item | `user_id`, `learning_item_id`, `placement_id`, `status` |

Every table has a UUID `id`, a nullable `tenant_id`, and `created_at`, `updated_at` and `deleted_at` timestamps. A row with `deleted_at` set is soft-deleted and ignored.

All the other tables reference `learning_modules.id` with `ON DELETE CASCADE`.

## Learning items

`learning_modules` holds the shared record of every learning item. It also holds one row for each course, with `kind` set to `course` and `ref_id` set to the course's ID; enrollments use those rows.

| Column | Type | Default | Meaning |
| --- | --- | --- | --- |
| `kind` | string (32) | required | The learning item type, such as `quiz` or `file`. |
| `ref_id` | UUID | required | For a course row, the course's ID. For a learning item, a value supplied when the item is created; the type's own record is found by the learning item's `id`. |
| `title` | string (255) | required | |
| `slug` | string (160) | required | Unique within a tenant among rows that aren't deleted. |
| `description` | string | `NULL` | |
| `status` | string (16) | `draft` | `draft`, `published` or `archived`. |
| `published_at`, `archived_at` | datetime | `NULL` | When the item was published or archived. |
| `is_active` | boolean | `true` | |
| `is_standalone` | boolean | `false` | Whether learners can enroll in the item directly, outside a course. |
| `category_id` | UUID | `NULL` | References `course_categories.id`; set to `NULL` if the category is deleted. |
| `is_gradable` | boolean | `false` | Whether the item has a grade. |
| `points_possible` | float | `NULL` | |
| `grade_strategy` | string (16) | `NULL` | Which attempt counts: `highest`, `lowest`, `average`, `last` or `first`. |
| `grade_scale_id` | UUID | `NULL` | |
| `pass_mark_pct` | float | `NULL` | The pass mark used by default completion criteria. |
| `allow_self_enrollment` | boolean | `false` | |
| `capacity` | integer | `NULL` | `NULL` means unlimited. |
| `current_enrollment` | integer | `0` | |
| `enroll_start`, `enroll_end` | datetime | `NULL` | |
| `metadata` | JSON | `NULL` | |
| `created_by` | UUID | `NULL` | |

The pair `tenant_id`, `kind`, `ref_id` is unique.

## Placements

`learning_item_placements` puts a learning item into a course or section. One learning item can have several placements.

| Column | Type | Default | Meaning |
| --- | --- | --- | --- |
| `container_type` | string (32) | required | `course` or `section`. |
| `container_id` | UUID | required | The course or section's ID. |
| `learning_item_id` | UUID | required | |
| `position` | integer | `0` | Order within the container. |
| `sequence_mode` | string (16) | `inherit` | `free`, `sequential`, `linear_strict` or `inherit`. |
| `weight` | float | `NULL` | |
| `is_required` | boolean | `true` | Whether later placements wait for this one in a sequenced container. |

A learning item can be placed in a container once: `tenant_id`, `container_type`, `container_id` and `learning_item_id` are unique together.

### Sequence mode

`inherit` takes the mode from the section, then from the course. If none is set, the mode is `free`.

In any mode other than `free`, a placement is locked until the learner has completed every earlier required placement in the same container.

## Completion criteria

`learning_item_completion_criteria` holds the rules that decide when a learner has completed an item. An item with no rows uses a default for its type.

| Column | Type | Default | Meaning |
| --- | --- | --- | --- |
| `learning_item_id` | UUID | required | |
| `placement_id` | UUID | `NULL` | |
| `criterion_type` | string (32) | required | Such as `view`, `mark_complete` or `score_gte`. |
| `threshold` | float | `NULL` | The number a criterion compares against. |
| `value_text` | string (64) | `NULL` | A text value, such as the statuses for `scorm_status_in`. |
| `logical_operator` | string (10) | `AND` | `AND` or `OR`. |
| `group_no` | integer | `1` | Criteria with the same number form a group. |
| `metadata` | JSON | `NULL` | |

Each criterion type, how groups combine and the default for each type: [Learning item contract](../plugins/learning-item-contract.md).

## Prerequisites

`learning_item_dependencies` makes one learning item wait for another, wherever either is placed.

| Column | Type | Default | Meaning |
| --- | --- | --- | --- |
| `learning_item_id` | UUID | required | The item that waits. |
| `prerequisite_item_id` | UUID | required | The item that must be done first. |
| `criterion_type` | string (32) | `NULL` | What "done" means. If `NULL`, the prerequisite must be `completed`. |
| `threshold` | float | `NULL` | Used by `criterion_type`. |

A pair of items can have one dependency: `tenant_id`, `learning_item_id` and `prerequisite_item_id` are unique together.

## Progress

`learning_item_progress` holds each learner's progress on an item, one row per placement.

| Column | Type | Default | Meaning |
| --- | --- | --- | --- |
| `user_id` | UUID | required | References `users.id`; deleted with the user. |
| `learning_item_id` | UUID | required | |
| `placement_id` | UUID | `NULL` | `NULL` when the item has no placement. |
| `status` | string (16) | `not_started` | `not_started`, `in_progress`, `completed` or `failed`. |
| `score` | float | `NULL` | |
| `time_spent_seconds` | integer | `0` | |
| `attempts_count` | integer | `0` | |
| `started_at`, `last_accessed_at`, `completed_at` | datetime | `NULL` | |
| `is_accessible` | boolean | `true` | A stored copy of whether prerequisites allow access. Access is checked again when it is enforced. |

`tenant_id`, `user_id`, `learning_item_id` and `placement_id` are unique together.

## Related

- [Learning item contract](../plugins/learning-item-contract.md)
- [Courses](./courses.md)
- [Grades](./grades.md)
