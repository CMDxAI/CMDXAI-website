---
id: enrollments
title: Enrollments
sidebar_label: Enrollments
sidebar_position: 3
doc_type: reference
audience: developers
source_prd: none
ai_drafted: true
last_verified: 2026-10-28
tags: [data-model, enrollments]
---

The tables behind enrollments, the rules and keys that create them, bulk enrollment jobs, and section progress.

## Overview

| Table | One row per |
| --- | --- |
| `enrollments` | Learner enrolled in a course or a standalone learning item |
| `enrollment_audit_logs` | Change to an enrollment |
| `enrollment_rules` | Rule that enrolls learners automatically |
| `enrollment_key_batches` | Batch of enrollment keys generated together |
| `enrollment_keys` | Enrollment key |
| `enrollment_key_redemptions` | Use of a key by a learner |
| `enrollment_key_audit_logs` | Change to a key or batch |
| `bulk_enrollment_jobs` | Bulk enrollment upload |
| `bulk_enrollment_job_rows`, `bulk_enrollment_job_errors` | Row of an upload, and each row that failed |
| `section_progress` | Learner's progress through a section of a course |

Every table has a UUID `id` and `created_at` and `updated_at` timestamps. Most have a nullable `tenant_id`.

## What an enrollment points at

An enrollment's `learning_module_id` is the `id` of a row in `learning_modules`. For a course, that is the course's row, with `kind` set to `course` and `ref_id` set to the course's ID. For a standalone learning item, it is the item itself. See [Learning items](./learning-items.md).

## Enrollments

| Column | Type | Default | Meaning |
| --- | --- | --- | --- |
| `user_id` | UUID | required | References `users.id`; deleted with the user. |
| `learning_module_id` | UUID | required | What the learner is enrolled in. |
| `status` | string (32) | `active` | `pending`, `active`, `completed`, `expired`, `dropped` or `revoked`. |
| `method` | string (32) | `manual` | How the enrollment was made: `manual`, `multi_user`, `bulk`, `group_sync`, `context_rule`, `completion_chain`, `key` or `self`. |
| `source_type` | string (32) | `admin` | What made it, such as `admin`, `learner`, `rule`, `key` or `csv_upload`. |
| `source_id` | UUID | `NULL` | The rule, key or job that made it. |
| `actor_id` | UUID | `NULL` | The user who made it. References `users.id`. |
| `expires_at` | datetime | `NULL` | |
| `revoke_reason` | string (64) | `NULL` | |
| `progress_pct` | decimal (5, 2) | `0.00` | |
| `completed_at` | datetime | `NULL` | |
| `deleted_at` | datetime | `NULL` | Soft delete. |

A learner can have one current enrollment in each course or learning item. Among rows that aren't deleted, `revoked` or `expired`, `tenant_id`, `user_id` and `learning_module_id` are unique together. A revoked or expired enrollment can be followed by a new one.

`enrollment_audit_logs` records each change: `enrollment_id`, `actor_id`, `action`, `method`, the row `before` and `after` as JSON, and `occurred_at`. Its rows are deleted with the enrollment.

## Enrollment rules

`enrollment_rules` enrolls learners automatically. Rules are soft-deleted.

| Column | Type | Default | Meaning |
| --- | --- | --- | --- |
| `name` | string (160) | `NULL` | |
| `rule_type` | string (32) | required | `group_sync`, `context` or `completion_chain`. |
| `target_learning_module_id` | UUID | required | What the rule enrolls learners in. |
| `config` | JSON | required | The rule's settings. Their shape depends on `rule_type`. |
| `auto_unenroll_on_revoke` | boolean | `false` | |
| `is_enabled` | boolean | `true` | |
| `created_by` | UUID | `NULL` | References `users.id`. |

Values the rule types use in `config`:

| `rule_type` | Values |
| --- | --- |
| `group_sync` | Sync mode `additive` or `mirror` |
| `context` | Context type `tenant`, `category`, `department` or `role` |
| `completion_chain` | Criterion `completed`, `score_gte` or `passed` |

## Enrollment keys

A key is a code a learner enters to enroll. `enrollment_keys` stores a hash of each code, not the code.

| Column | Type | Default | Meaning |
| --- | --- | --- | --- |
| `learning_module_id` | UUID | required | What the key enrolls the learner in. |
| `batch_id` | UUID | `NULL` | The batch it came from. Set to `NULL` if the batch is deleted. |
| `code_hash` | string (64) | required | Unique across all keys. |
| `code_hint` | string (16) | required | A short hint built from the code, to recognize it by. |
| `key_type` | string (16) | required | `single` or `multi`. |
| `max_uses` | integer | `1` | |
| `max_uses_per_user` | integer | `1` | |
| `used_count` | integer | `0` | |
| `status` | string (16) | `active` | `active`, `exhausted`, `revoked` or `expired`. |
| `valid_from`, `valid_until` | datetime | `NULL` | |
| `revoked_at` | datetime | `NULL` | |
| `created_by` | UUID | `NULL` | References `users.id`. |

`enrollment_key_batches` holds the settings a batch was generated with: `learning_module_id`, `prefix`, `count`, `key_type`, `max_uses`, `max_uses_per_user`, `valid_from`, `valid_until`, `created_by` and `exported_at`.

`enrollment_key_redemptions` records each use: `key_id`, `user_id`, `enrollment_id`, `redeemed_at` and `ip_address`. A learner can redeem a key once: `key_id` and `user_id` are unique together. Rows are deleted with the key, the user or the enrollment.

`enrollment_key_audit_logs` records changes to keys and batches, with the row `before` and `after` as JSON.

## Bulk enrollment jobs

`bulk_enrollment_jobs` tracks an upload of many enrollments.

| Column | Type | Default | Meaning |
| --- | --- | --- | --- |
| `actor_id` | UUID | required | Who started the job. References `users.id`. |
| `status` | string (32) | `pending` | `pending`, `running`, `completed`, `completed_with_errors`, `failed` or `cancelled`. |
| `learning_module_id` | UUID | `NULL` | |
| `original_filename` | string (255) | `NULL` | |
| `total_rows`, `processed_rows`, `success_rows`, `failed_rows` | integer | `0` | |
| `job_metadata` | JSON | `NULL` | |
| `started_at`, `finished_at` | datetime | `NULL` | |
| `error_message` | string (2048) | `NULL` | |

`bulk_enrollment_job_rows` holds each row of the upload: `row_number`, `email_or_user_id`, `learning_module_ref`, `expires_at`, `idempotency_key`, `status` and the error, if any. `bulk_enrollment_job_errors` holds each failed row with its `row_data`, `error_code` and `error_message`. Both are deleted with the job.

## Section progress

`section_progress` holds a learner's progress through each section of a course they are enrolled in.

| Column | Type | Default | Meaning |
| --- | --- | --- | --- |
| `enrollment_id` | UUID | required | References `enrollments.id`; deleted with the enrollment. |
| `section_id` | UUID | required | References `sections.id`; deleted with the section. |
| `user_id` | UUID | required | A copy of the enrollment's user, for faster lookups. |
| `status` | string (16) | `pending` | `pending`, `in_progress` or `completed`. |
| `score` | decimal (5, 2) | `NULL` | |
| `time_spent_seconds` | integer | `0` | |
| `started_at`, `completed_at`, `last_accessed_at` | datetime | `NULL` | |

`enrollment_id` and `section_id` are unique together.

## Related

- [Courses](./courses.md)
- [Learning items](./learning-items.md)
