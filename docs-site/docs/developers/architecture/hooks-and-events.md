---
id: hooks-and-events
title: Hooks and events
sidebar_label: Hooks and events
sidebar_position: 4
doc_type: reference
audience: developers
source_prd: none
ai_drafted: true
last_verified: 2026-10-27
tags: [architecture, plugins, hooks]
---

Every hook and event a plugin can subscribe to, when each one is delivered, and the keys in its payload.

## Subscribing

A plugin subscribes in its `hooks.py`. When the plugin loads, CMDX calls `register_hooks` with the backend's hook manager:

```python
from core.plugin_api import HookContext, HookManager


async def on_course_completed(ctx: HookContext) -> None:
    user_id = ctx.data.get("user_id")
    ...


def register_hooks(hook_manager: HookManager) -> None:
    hook_manager.register("course.completed", on_course_completed, priority=50)
```

- The first argument is the hook or event name from the tables below.
- Handlers for the same name run one after another, lowest `priority` first. The default is `50`.
- A handler receives a `HookContext`. `ctx.hook_point` is the name, `ctx.data` is the payload, a dictionary, and `ctx.tenant_id` is the tenant the event happened in.
- Handlers can be `async` or plain functions. Plain functions run in a worker thread so they don't block the server.
- The `@hook` decorator and `register_decorated_hooks` in `core.plugin_api.hooks` do the same with a decorator.

By default a handler can't stop the operation that fired it. If it raises an exception, CMDX logs it and the remaining handlers still run.

To veto an operation, register the handler with `failure_mode="abort"`. Its exception then skips the remaining handlers and is raised again. It fails the operation only for a hook delivered during it, because only then is the caller waiting.

A handler can also set `ctx.aborted = True`, with an optional `ctx.abort_reason`. CMDX skips the remaining handlers, but the operation itself carries on.

## When handlers run

Each name is delivered in one of three ways. The **Delivery** column in the tables says which.

| Delivery | When the handler runs | Does the caller wait? | Can it see a change that is later rolled back? |
| --- | --- | --- | --- |
| During | Inside the operation, before its changes are saved | Yes | Yes |
| After save | Once the request's database changes are saved | No | No |
| Background | Soon after the event is emitted, in a background task. For an event emitted by a worker, once the worker's task has succeeded | No | Yes for an event emitted during a request; no for one emitted by a worker task |

For handlers that run after save or in the background, the request's database session is already closed. A handler that needs the database opens its own session. Keep handlers short, and hand slow work to a background task.

Ids and times in payloads are usually strings. Keys in square brackets are sent only in some cases. Not every payload carries a tenant id. A `tenant_id` or `organization_id` key with no tenant is `None`.

`ctx.tenant_id` is a UUID: the payload's `tenant_id` or `organization_id`, otherwise the tenant of the request that emitted the event, otherwise `None`. A plugin whose manifest sets `multitenant="per_tenant"`, the default, receives an event only when `ctx.tenant_id` is a tenant that has the plugin enabled. An event with no tenant reaches only plugins with `multitenant="global"`.

:::note
Some hook points are defined in `core/hooks/points.py` but nothing fires them yet, and they are left out of this page. This includes the `model.*` points: whether they are kept as reserved or removed is still being decided.
:::

Events emitted by Celery workers and scheduled jobs reach plugin hooks too. A worker sets up the same hooks as the API, including those of enabled plugins, when it runs its first task. It holds the events a task emits and delivers them once the task has succeeded, so a task that fails delivers none. A worker loads plugins once per process, so restart the Celery workers after you enable, disable or reload a plugin.

## Hook points

These names are members of `HookPoint` in `core.hooks.points`.

### Requests

| Name | Fired when | Delivery | Payload keys |
| --- | --- | --- | --- |
| `request.started` | The API receives a request | During | `path`, `method` |
| `request.completed` | The API has a response | During | `path`, `method`, `status_code` |
| `request.failed` | Handling the request raised an error | During | `path`, `method`, `error` |

### Users and sign-in

| Name | Fired when | Delivery | Payload keys |
| --- | --- | --- | --- |
| `user.registered` | An account is created | After save | `user_id`, `email`, [`send_email`, `username`, `handle`, `first_name`, `middle_name`, `last_name`, `gender`, `phone_number`, `locale`] |
| `user.login` | A user signs in with a password | After save | `user_id`, `ip`, `user_agent`, [`verified_tenant_id`] |
| `user_invited` | Someone is invited to CMDX | After save | `email`, `action_url`, `role`, `subject`, `expires_in`, `tenant_id` |
| `password_reset_requested` | A password reset is requested | After save | `user_id`, `email`, `action_url`, `subject`, `expires_in` |
| `password_changed` | A password is changed | After save | `user_id`, `subject`, [`set_by_admin`] |
| `email_verification_requested` | An email verification link is sent | After save | `user_id`, `email`, `action_url`, `subject`, `expires_in` |
| `email_verified` | A user verifies their email address | After save | `user_id` |
| `account_suspended` | An administrator suspends an account | After save | `user_id`, `subject` |
| `role_assignment_created` | A role is assigned to a user | After save | `user_id`, `user_name`, `role_name` |
| `role_assignment_revoked` | A role is taken away from a user | After save | `user_id`, `user_name`, `role_name` |

### Courses and enrollment

| Name | Fired when | Delivery | Payload keys |
| --- | --- | --- | --- |
| `course.created` | A course is created or cloned | Background | `course_id`, `created_by`, `tenant_id`, [`cloned_from`] |
| `course.enrolled` | A learner is enrolled in a course | During or background | `user_id`, `student_id`, `course_id`, `learning_module_id`, `course_name`, `context_type`, `context_id`, `tenant_id`, [`user_name`, `student_name`, `locale`, `instructor_id`] |
| `course.completed` | A learner completes a course | Background | `user_id`, `course_id`, `tenant_id` |
| `user.enrolled` | An enrollment is created or revoked | During | `enrollment_id`, `user_id`, `learning_module_id`, `tenant_id`, `method`, `status`, `event` (`enrollment.created` or `enrollment.revoked`) |

In `course.enrolled`, `course_id` is the course's own id and `learning_module_id` is the learning module the learner was enrolled in.

### Groups

| Name | Fired when | Delivery | Payload keys |
| --- | --- | --- | --- |
| `group.created` | A group is created | During | `event`, `group_id`, `actor_id`, `tenant_id`, `emitted_at` |
| `group.member_added` | A user joins a group | During | `event`, `group_id`, `user_id`, `actor_id`, `tenant_id`, `emitted_at` |
| `group.member_removed` | A user leaves a group | During | `event`, `group_id`, `user_id`, `actor_id`, `tenant_id`, `emitted_at` |

`group.created` runs once the group is saved, although the caller still waits for it.

### Assignments

| Name | Fired when | Delivery | Payload keys |
| --- | --- | --- | --- |
| `assignment.submitted` | A learner submits an assignment | After save | `assignment_id`, `submission_id`, `user_id`, `learner_id`, `tenant_id` |
| `assignment.graded` | A submission is graded | After save | `assignment_id`, `submission_id`, `grader_id`, `user_id`, `learner_id`, `tenant_id`, `score`, `passed` |

### URL resources

| Name | Fired when | Delivery | Payload keys |
| --- | --- | --- | --- |
| `url_resource.created` | A URL resource is created, including by cloning | After save | `tenant_id`, `organization_id`, `url_resource_id`, `status`, `url`, [`learning_item_id`, `course_id`, `user_id`] |
| `url_resource.updated` | A URL resource is changed | After save | Same as `url_resource.created` |
| `url_resource.cloned` | A URL resource is cloned | After save | Same as `url_resource.created`, plus `source_url_resource_id` |
| `url_resource.published` | A URL resource is published | After save | Same as `url_resource.created` |
| `url_resource.archived` | A URL resource is archived | After save | Same as `url_resource.created` |
| `url_resource.deleted` | A URL resource is deleted | After save | Same as `url_resource.created` |
| `url_resource.visited` | A learner opens a URL resource | After save | `tenant_id`, `url_resource_id`, `user_id`, `visit_id`, `course_id`, `learning_item_id`, `status`, `url`, `visited_at` |

### HTML pages

| Name | Fired when | Delivery | Payload keys |
| --- | --- | --- | --- |
| `html_page.published` | An HTML page is published | After save | `page_id`, `tenant_id`, `organization_id`, `course_id`, `user_id`, `version_number`, `published_at` |
| `html_page.archived` | An HTML page is archived | After save | `page_id`, `tenant_id`, `organization_id`, `course_id`, `user_id`, `archived_at` |
| `html_page.viewed` | A learner views an HTML page | After save | `page_id`, `tenant_id`, `organization_id`, `course_id`, `user_id`, `completion_id`, `view_count`, `viewed_at`, `completed_at`, `last_viewed_at`, `is_first_view` |

### Trainings

| Name | Fired when | Delivery | Payload keys |
| --- | --- | --- | --- |
| `training.published` | A training is published | During | `training_id`, `course_id`, `tenant_id`, `published_by` |
| `session.started` | A training session starts | During | `session_id`, `training_id`, `session_type`, `tenant_id`, `started_by` |
| `session.ended` | A training session ends | During | `session_id`, `training_id`, `tenant_id`, `ended_by` |

### Feedback

All are delivered after save.

| Name | Fired when | Payload keys |
| --- | --- | --- |
| `feedback.form.created` | A feedback form is created | `form_id`, `course_id`, `tenant_id`, `created_by` |
| `feedback.form.updated` | A feedback form is changed | `form_id`, `course_id`, `tenant_id`, `updated_by` |
| `feedback.form.deleted` | A feedback form is deleted | `form_id`, `tenant_id`, `deleted_by` |
| `feedback.form.published` | A feedback form is published | `form_id`, `course_id`, `tenant_id`, `published_by` |
| `feedback.form.closed` | A feedback form stops taking responses | `form_id`, `tenant_id`, `response_count` |
| `feedback.question.created` | A question is added | `form_id`, `question_id`, `question_type`, `option_count`, `tenant_id`, `created_by` |
| `feedback.question.updated` | A question is changed | `form_id`, `question_id`, `question_type`, `options_synced`, `option_count`, `tenant_id`, `updated_by` |
| `feedback.question.deleted` | A question is deleted | `form_id`, `question_id`, `tenant_id`, `deleted_by` |
| `feedback.question.reordered` | Questions are reordered | `form_id`, `question_count`, `tenant_id`, `reordered_by` |
| `feedback.submitted` | A learner submits a response | `form_id`, `response_id`, `user_id`, `course_id`, `tenant_id` |
| `feedback.response.deleted` | A response is deleted | `form_id`, `response_id`, `tenant_id`, `deleted_by` |

## Events

These names are emitted on the event dispatcher in `core.events` and delivered to hook handlers in the background. Subscribe to them with `hook_manager.register` exactly like a hook point.

### Courses

| Name | Fired when | Payload keys |
| --- | --- | --- |
| `course.updated` | A course is changed | `course_id`, `tenant_id` |
| `course.deleted` | A course is deleted | `course_id`, `tenant_id` |
| `course.published` | A course is published | `course_id`, `tenant_id` |
| `course.archived` | A course is archived | `course_id`, `tenant_id` |
| `course.owner_transferred` | A course gets a new owner | `course_id`, `previous_owner_id`, `new_owner_id`, `actor_id` |

### Enrollments

| Name | Fired when | Payload keys |
| --- | --- | --- |
| `enrollment.created` | An enrollment is created | `enrollment_id`, `user_id`, `learning_module_id`, `method`, `status`, `actor_id`, `tenant_id` |
| `enrollment.revoked` | An enrollment is revoked | `enrollment_id`, `user_id`, `learning_module_id`, `method`, `status`, `revoke_reason`, `actor_id`, `tenant_id`, [`course_name`, `user_name`, `locale`] |
| `enrollment.completed` | An enrollment is completed | `enrollment_id`, `user_id`, `learning_module_id`, `method`, `status`, `actor_id`, `tenant_id` |
| `enrollment.expired` | An enrollment expires | `enrollment_id`, `user_id`, `learning_module_id`, `status`, `actor_id`, `tenant_id`, [`course_name`, `user_name`, `locale`] |
| `enrollment.reminder` | An enrollment reminder is due | Same as `enrollment.expired` |
| `enrollment.dropped` | A course is force-deleted and its active or pending enrollments are dropped | `enrollment_id`, `user_id`, `learning_module_id`, `method`, `status`, `reason`, `course_id`, `actor_id`, `tenant_id` |
| `enrollment.progress_updated` | A learner's progress in an enrollment changes | `tenant_id`, `user_id`, `learning_item_id`, `status` |

### Enrollment keys and rules

| Name | Fired when | Payload keys |
| --- | --- | --- |
| `key.generated` | An enrollment key is generated | `key_id`, `learning_module_id`, `actor_id`, `tenant_id` |
| `key.batch_generated` | A batch of keys is generated | `batch_id`, `count`, `learning_module_id`, `actor_id`, `tenant_id` |
| `key.redeemed` | A learner redeems a key | `key_id`, `user_id`, `enrollment_id`, `actor_id`, `tenant_id` |
| `key.revoked` | A key is revoked | `key_id`, `status_before`, `status_after`, `actor_id`, `tenant_id` |
| `key.expired` | A key expires | `key_id`, `actor_id`, `tenant_id` |
| `rule.created` | An enrollment rule is created | `rule_id`, `rule_type`, `tenant_id`, `actor_id` |
| `rule.updated` | An enrollment rule is changed | `rule_id`, `rule_type`, `tenant_id`, `actor_id` |
| `rule.deleted` | An enrollment rule is deleted | `rule_id`, `rule_type`, `tenant_id`, `actor_id` |
| `rule.run` | An enrollment rule runs | `rule_id`, `tenant_id`, `actor_id`, `rule_type` |

### Learning items, attempts and grades

These events share one payload: `tenant_id`, `entity_id`, `user_id`, `timestamp`, `event_type` and `payload`. The table lists the keys inside `payload`.

| Name | Fired when | Keys inside `payload` |
| --- | --- | --- |
| `learning_item.created` | A learning item is created | `kind`, `title` |
| `learning_item.updated` | A learning item is changed | `kind`, `title`, [`status`] |
| `learning_item.published` | A learning item is published | `kind`, `title`, `status` |
| `learning_item.archived` | A learning item is archived | `kind`, `title`, `status` |
| `attempt.submitted` | A learner submits a quiz attempt | `kind`, `quiz_id`, `learning_item_id`, `attempt_id`, `learner_id`, `attempt_number`, `score_pct`, `max_score`, `passed`, `status` |
| `attempt.returned` | A quiz attempt is returned to the learner | Same as `attempt.submitted`, plus `return_reason` |
| `submission.graded` | A quiz attempt or assignment submission is graded | Quiz: same as `attempt.submitted`. Assignment: `learning_item_id`, `assignment_id`, `submission_id` |
| `submission.regraded` | A graded submission is graded again | Same as `submission.graded` |
| `progress.recorded` | A learner's progress on a learning item is recorded | `status`, `score` |
| `completion.achieved` | A learner completes a learning item | `kind`, or `manual` when an instructor marks it |
| `grade.override` | A grade is overridden | `override_score`, `overridden_by`, `grade_item_id` |
| `video.uploaded` | A video is uploaded | `learning_item_id`, `file_id`, `source_mode` |
| `video.viewed` | A learner watches a video | `learning_item_id`, `max_playhead_seconds`, `watch_time_seconds` |
| `video.completed` | A learner finishes a video | `learning_item_id`, `completion_pct`, `max_playhead_seconds`, `duration_seconds` |

These events use a flat payload:

| Name | Fired when | Payload keys |
| --- | --- | --- |
| `learning_item.available` | A learning item becomes available to a learner | `tenant_id`, `learning_item_id` |
| `learning_item.unavailable` | A learning item stops being available to a learner | `tenant_id`, `learning_item_id` |
| `learning_item.completed` | A learner completes a learning item in an enrollment | `user_id`, `learning_module_id`, `progress_pct`, `tenant_id` |
| `gradebook.recompute` | A learner's grades need recalculating | `tenant_id`, `user_id`, `learning_item_id` |
| `certificate.check_eligibility` | A learner may have become eligible for a certificate | `tenant_id`, `user_id`, `learning_item_id` |
| `module.event_handler_failed` | A learning item event handler failed | `event_type`, `entity_id`, `tenant_id`, `handler` |

### Roles and permissions

| Name | Fired when | Payload keys |
| --- | --- | --- |
| `role_created` | A role is created | `role_id`, `role_data` |
| `role_updated` | A role is changed | `role_id`, `changes` |
| `role_deactivated` | A role is deactivated | `role_id` |
| `role_capabilities_added` | Capabilities are added to a role | `role_id`, `capability_ids` |
| `role_capabilities_removed` | Capabilities are removed from a role | `role_id`, `capability_ids` |
| `role_capabilities_replaced` | A role's capabilities are replaced | `role_id`, `capability_keys` |
| `context_created` | A permission context is created | `context_id`, `context_data` |
| `context_overrides_replaced` | A context's permission overrides are replaced | `context_id` |
| `role_switch_started` | A user switches to another role | `actor_id`, `role_id` |
| `role_switch_ended` | A user switches back | `actor_id`, `session_id` |
| `role_switch_blocked` | A role switch is refused | `actor_id`, `role_id` |
| `rbac_bundle_exported` | Roles and permissions are exported | `actor_id` |
| `rbac_bundle_imported` | Roles and permissions are imported | `actor_id`, `dry_run` |
| `rbac_bundle_import_dry_run` | An import is checked without applying it | `actor_id`, `dry_run` |

### Profiles, dashboards and preferences

| Name | Fired when | Payload keys |
| --- | --- | --- |
| `user.profile.created` | A user profile is created | `user_id`, `profile_data` |
| `user.profile.updated` | A user profile is changed | `user_id`, `changes` |
| `user.profile.deleted` | A user profile is deleted | `user_id` |
| `user.profile_field_category.created` | A profile field category is created | `category_id`, `tenant_id`, `category_data` |
| `user.profile_field_category.updated` | A profile field category is changed | `category_id`, `tenant_id`, `changes` |
| `user.profile_field_category.moved` | A profile field category is moved | `category_id`, `tenant_id`, `new_parent_id` |
| `user.profile_field_category.deleted` | A profile field category is deleted | `category_id`, `tenant_id` |
| `user.profile_field.created` | A custom profile field is created | `profile_field_id`, `tenant_id`, `profile_field_data` |
| `user.profile_field.deleted` | A custom profile field is deleted | `profile_field_id`, `tenant_id` |
| `user.profile_field.reactivated` | A deleted profile field is restored | `profile_field_id`, `tenant_id` |
| `user.dashboard.created` | A dashboard is created | `dashboard_id`, `user_id`, `dashboard_data` |
| `user.dashboard.updated` | A dashboard is changed | `dashboard_id`, `changes` |
| `user.dashboard.deleted` | A dashboard is deleted | `dashboard_id`, `user_id` |
| `user.widget.created` | A dashboard widget is added | `widget_id`, `dashboard_id`, `widget_data` |
| `user.widget.updated` | A dashboard widget is changed | `widget_id`, `changes` |
| `user.widget.deleted` | A dashboard widget is removed | `widget_id`, `dashboard_id` |
| `user.import.completed` | A bulk user import finishes | `job_id`, `total_rows`, `processed_rows` |
| `user.preferences.created` | A user's preferences are first saved | `user_id`, [`fields`] |
| `user.preferences.updated` | A user's preferences are changed | `user_id`, [`fields`] |
| `user.preferences.reset` | A user's preferences are reset | `user_id` |

### Notifications

| Name | Fired when | Payload keys |
| --- | --- | --- |
| `notification.delivery_failed` | A notification can't be delivered on a channel after its retries run out | `delivery_id`, `notification_id`, `channel`, `user_id`, `error_message`, `retry_count` |

## Next

- [Plugin system](./plugin-system.md): how a plugin's `hooks.py` is loaded
- [Build a plugin](../plugins/build-a-plugin.md)
