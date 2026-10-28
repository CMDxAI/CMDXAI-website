---
id: courses
title: Courses
sidebar_label: Courses
sidebar_position: 1
doc_type: reference
audience: developers
source_prd: none
ai_drafted: true
last_verified: 2026-10-28
tags: [data-model, courses]
---

The tables behind courses, their sections, categories and course-level role assignments. Learning items are placed into courses and sections through placements; see [Learning items](./learning-items.md).

## Overview

| Table | One row per |
| --- | --- |
| `courses` | Course |
| `sections` | Section of a course, nested to any depth |
| `section_paths` | Ancestor and descendant pair of sections |
| `section_dependencies` | Section that must come before another |
| `section_completion_criteria` | Completion rule of a section |
| `course_categories` | Category, nested to any depth |
| `category_departments` | Department a category is limited to |
| `learning_item_categories` | Category a learning item is filed under |
| `course_role_assignments` | Role a user has in a course |
| `category_role_assignments` | Role a user has in a category |

Most tables have a UUID `id` and a nullable `tenant_id`. `courses`, `sections` and `course_categories` are soft-deleted: a row with `deleted_at` set is ignored.

## Courses

| Column | Type | Default | Meaning |
| --- | --- | --- | --- |
| `category_id` | UUID | required | References `course_categories.id` with `ON DELETE RESTRICT`. |
| `full_name` | string (255) | required | |
| `short_name` | string (120) | required | Unique within a tenant among courses that aren't deleted. |
| `summary`, `description` | text | `NULL` | |
| `status` | string (16) | `draft` | `draft`, `published` or `archived`. |
| `published_at`, `archived_at` | datetime | `NULL` | |
| `is_visible` | boolean | `true` | |
| `allow_self_enrollment` | boolean | `true` | |
| `start_date`, `end_date` | datetime | `NULL` | |
| `enroll_start`, `enroll_end` | datetime | `NULL` | |
| `max_enrollment` | integer | `NULL` | `NULL` means unlimited. |
| `current_enrollment` | integer | `0` | |
| `sequence_mode` | string (16) | `free` | `free`, `sequential` or `linear_strict`. Placements and sections set to `inherit` use it. |
| `pass_threshold` | decimal (5, 2) | `NULL` | 0 to 100. |
| `completion_criteria` | boolean | `true` | |
| `layout` | integer | `NULL` | |
| `default_language` | string (120) | `en` | |
| `created_by` | UUID | required | References `users.id`. |
| `created_at`, `updated_at`, `deleted_at` | datetime | | |

Each course also has a row in `learning_modules` with `kind` set to `course` and `ref_id` set to the course's ID. Enrollments point at that row. See [Enrollments](./enrollments.md).

## Sections

| Column | Type | Default | Meaning |
| --- | --- | --- | --- |
| `course_id` | UUID | required | References `courses.id`; deleted with the course. |
| `parent_section_id` | UUID | `NULL` | The section this one is nested in. `NULL` for a top-level section. Deleted with its parent. |
| `title` | string (255) | required | |
| `summary` | text | `NULL` | |
| `position` | integer | `0` | Order among sections with the same parent. |
| `depth` | integer | `0` | `0` for a top-level section. |
| `sequence_mode` | string (16) | `free` | `free`, `sequential`, `linear_strict` or `inherit`. |
| `is_locked` | boolean | `false` | |
| `lock_reason` | string (32) | `NULL` | `manual`, `dependency` or `time`. |
| `available_from` | datetime | `NULL` | |
| `created_at`, `updated_at`, `deleted_at` | datetime | | |

A new section's `sequence_mode` is `free`, not `inherit`. A placement in that section therefore doesn't use the course's mode until the section is set to `inherit`.

### Section paths

`section_paths` stores every ancestor and descendant pair, so a subtree can be read in one query.

| Column | Type | Meaning |
| --- | --- | --- |
| `ancestor_id` | UUID | References `sections.id`. |
| `descendant_id` | UUID | References `sections.id`. |
| `depth` | integer | Levels between the two. |


### Section dependencies

| Column | Type | Meaning |
| --- | --- | --- |
| `section_id` | UUID | The section that waits. |
| `prerequisite_section_id` | UUID | The section that comes first. |

The pair is unique, and both columns reference `sections.id` with `ON DELETE CASCADE`.

### Section completion criteria

| Column | Type | Meaning |
| --- | --- | --- |
| `section_id` | UUID | References `sections.id`; deleted with the section. |
| `criterion_type` | string (32) | `view_all`, `quiz_score_gte`, `mark_complete` or `time_spent_gte`. |
| `threshold` | decimal (10, 2) | |
| `target_id` | UUID | |
| `target_type` | string (32) | |

These rows are stored and copied when a course is cloned.

## Categories

`course_categories` forms a tree. Each course belongs to one category.

| Column | Type | Default | Meaning |
| --- | --- | --- | --- |
| `parent_id` | UUID | `NULL` | The parent category, with `ON DELETE RESTRICT`. `NULL` for a top-level category. |
| `name` | string (255) | required | |
| `slug` | string (120) | required | |
| `description` | text | `NULL` | |
| `path` | text | required | The IDs from the root down, such as `/<root-id>/<child-id>`. |
| `depth` | integer | `0` | |
| `is_active` | boolean | `true` | |
| `sort_order` | integer | `0` | |
| `inherit_scope` | boolean | `true` | |
| `show_in_reports` | boolean | `true` | |
| `created_at`, `updated_at`, `deleted_at` | datetime | | |

`category_departments` limits a category to departments: one row per `category_id` and `department_id` pair. `learning_item_categories` files a learning item under a category: one row per `learning_module_id` and `category_id` pair. Both are deleted with the category.

## Role assignments

`course_role_assignments` gives a user a role in one course, and `category_role_assignments` gives a user a role in a category.

| Column | Type | Default | Meaning |
| --- | --- | --- | --- |
| `course_id` or `category_id` | UUID | required | |
| `user_id` | UUID | required | References `users.id`. |
| `role_id` | UUID | required | References `roles.id`. |
| `is_inherited_disabled` | boolean | `false` | |
| `created_at`, `updated_at` | datetime | | |

Each row is deleted with its course or category, user or role. `tenant_id`, the course or category, `user_id` and `role_id` are unique together.

## Related

- [Learning items](./learning-items.md)
- [Enrollments](./enrollments.md)
