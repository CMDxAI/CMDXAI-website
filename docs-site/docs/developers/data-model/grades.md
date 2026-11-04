---
id: grades
title: Grades
sidebar_label: Grades
sidebar_position: 4
doc_type: reference
audience: developers
source_prd: none
ai_drafted: true
last_verified: 2026-10-28
tags: [data-model, grades]
---

The gradebook tables: what can be graded, each learner's grade, how grades are grouped, scales, letters and the change history.

## Overview

| Table | One row per |
| --- | --- |
| `grade_items` | Thing that gets a grade, such as a quiz in a course |
| `grade_grades` | Learner's grade on a grade item |
| `grade_categories` | Group of grade items, nested to any depth |
| `grade_scales` | Scale that grades can use instead of numbers |
| `grade_letters` | Letter boundary, such as A from 90 % |
| `grade_history` | Change to a learner's grade |

Every table has a UUID `id`, a nullable `tenant_id`, and `created_at` and `updated_at` timestamps.

### Context

A grade item, a category and a letter boundary belong to a context, set by `context_type` and `context_id`:

| `context_type` | `context_id` is |
| --- | --- |
| `course` | A course |
| `learning_item` | A learning item |
| `learning_path` | A learning path |
| `program` | A program |

## Grade items

| Column | Type | Default | Meaning |
| --- | --- | --- | --- |
| `context_type`, `context_id` | string (32), UUID | required | Where the item is graded. |
| `category_id` | UUID | `NULL` | References `grade_categories.id`; set to `NULL` if the category is deleted. |
| `item_type` | string (16) | `manual` | `manual`, `module`, `category` or `container`. |
| `name` | string (255) | required | |
| `id_number` | string (128) | `NULL` | |
| `source_type` | string (32) | `NULL` | What produces the grade: `quiz`, `assignment`, `scorm` or `attendance`. |
| `source_id` | UUID | `NULL` | The record that produces the grade. |
| `grade_type` | string (16) | `value` | `none`, `value`, `scale` or `text`. |
| `scale_id` | UUID | `NULL` | References `grade_scales.id`; set to `NULL` if the scale is deleted. |
| `grade_max` | decimal (10, 4) | `100.0` | A grade above it is rejected. |
| `grade_min` | decimal (10, 4) | `0.0` | A grade below it is rejected. |
| `grade_pass` | decimal (10, 4) | `NULL` | The pass mark. |
| `weight` | decimal (10, 4) | `NULL` | |
| `is_extra_credit` | boolean | `false` | |
| `display_type` | string (16) | `real` | `real`, `percentage`, `letter` or `scale`. |
| `decimals` | integer | `2` | |
| `sort_order` | integer | `0` | |
| `gradebook_visible` | boolean | `true` | |
| `is_hidden` | boolean | `false` | |
| `hidden_until` | datetime | `NULL` | |
| `is_locked` | boolean | `false` | |
| `locked_at` | datetime | `NULL` | |
| `created_by` | UUID | `NULL` | References `users.id`. |
| `deleted_at` | datetime | `NULL` | Soft delete. |

`source_type` and `source_id` are unique together, so each source has one grade item.

Publishing a SCORM learning item placed in a course creates its grade item. Quizzes and assignments get theirs when an instructor sets them up.

## Grades

`grade_grades` holds one learner's grade on one grade item. `grade_item_id` and `user_id` are unique together.

| Column | Type | Default | Meaning |
| --- | --- | --- | --- |
| `grade_item_id` | UUID | required | References `grade_items.id`; deleted with the item. |
| `user_id` | UUID | required | References `users.id`; deleted with the user. |
| `raw_score` | decimal (10, 4) | `NULL` | The score as earned. |
| `override_score` | decimal (10, 4) | `NULL` | A score an instructor set instead. |
| `is_overridden` | boolean | `false` | Whether `override_score` applies. |
| `final_grade` | decimal (10, 4) | `NULL` | `override_score` when overridden, otherwise `raw_score`. |
| `percentage` | decimal (10, 4) | `NULL` | `final_grade` as a percentage of `grade_max`. |
| `letter` | string (16) | `NULL` | The letter for `percentage` in the item's context. |
| `is_passing` | boolean | `false` | `final_grade` is at least `grade_pass`. If the item has no `grade_pass`, `percentage` is at least 60. |
| `feedback` | text | `NULL` | |
| `is_excluded` | boolean | `false` | |
| `is_hidden` | boolean | `false` | |
| `graded_by` | UUID | `NULL` | References `users.id`. |
| `graded_at` | datetime | `NULL` | |
| `overridden_by`, `overridden_at` | UUID, datetime | `NULL` | |

Four columns repeat others for older readers: `raw_grade` copies `raw_score`, `score` copies `final_grade`, `score_pct` copies `percentage` and `is_override` copies `is_overridden`. `raw_scale_value` is not written.

## Grade categories

| Column | Type | Default | Meaning |
| --- | --- | --- | --- |
| `context_type`, `context_id` | string (32), UUID | required | |
| `parent_id` | UUID | `NULL` | The parent category; set to `NULL` if the parent is deleted. |
| `name` | string (255) | required | |
| `aggregation` | string (32) | `natural` | How the category's grade is worked out: `natural`, `weighted_mean`, `simple_weighted_mean`, `mean`, `sum`, `min`, `max` or `median`. |
| `weight` | decimal (10, 4) | `NULL` | |
| `drop_lowest` | integer | `0` | Number of lowest grades to leave out. |
| `keep_highest` | integer | `0` | Number of highest grades to keep. |
| `sort_order` | integer | `0` | |
| `is_hidden` | boolean | `false` | |

## Grade scales

| Column | Type | Default | Meaning |
| --- | --- | --- | --- |
| `name` | string (255) | required | |
| `description` | string (255) | `NULL` | |
| `scale_type` | string (32) | `discrete` | `discrete`, `numeric` or `letter`. |
| `options` | JSON | `NULL` | The scale's values. |
| `min_score`, `max_score` | decimal (10, 4) | `NULL` | |
| `rules` | JSON | `NULL` | |
| `is_active` | boolean | `true` | |

A learning item uses a scale through `learning_modules.grade_scale_id`. See [Learning items](./learning-items.md).

## Grade letters

| Column | Type | Default | Meaning |
| --- | --- | --- | --- |
| `context_type`, `context_id` | string (32), UUID | `NULL` | The context the letter applies in. |
| `letter` | string (16) | required | |
| `min_percentage` | decimal (6, 3) | `NULL` | The lowest percentage that earns this letter. |

## Grade history

`grade_history` records each change to a grade. Rows are deleted with the grade item or the user.

| Column | Type | Meaning |
| --- | --- | --- |
| `grade_item_id`, `user_id` | UUID | The grade that changed. |
| `action` | string (32) | What happened. |
| `old_raw`, `new_raw` | decimal (10, 4) | |
| `old_final`, `new_final` | decimal (10, 4) | |
| `old_score`, `new_score` | decimal (10, 4) | |
| `reason`, `notes` | text | |
| `performed_by` | UUID | Who made the change. References `users.id`. |

## Related

- [Learning items](./learning-items.md)
- [Courses](./courses.md)
- [Mastery](./mastery.md)
