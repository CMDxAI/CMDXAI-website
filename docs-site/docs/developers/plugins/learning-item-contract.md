---
id: learning-item-contract
title: Learning item contract
sidebar_label: Learning item contract
sidebar_position: 2
doc_type: reference
audience: developers
source_prd: none
ai_drafted: true
last_verified: 2026-10-28
tags: [plugins, learning-items]
---

Every learning item type, such as file, quiz or SCORM, connects to CMDX through one interface: `ContentTypeProvider`. The learning item service owns the shared record: title, status, placements and grading. The provider owns the type's own record and reports each learner's progress.

:::note
`ContentTypeProvider` is not part of the public plugin API (`core.plugin_api`) yet, and the course builder lists a fixed set of types. A plugin can't add a learning item type today. This page describes the contract the built-in types implement. Whether plugins can use it is being decided.
:::

## Imports

| Name | Import from |
| --- | --- |
| `ContentTypeProvider`, `ProgressSignals` | `modules.learning_items.plugin` |
| `register_provider`, `get_provider`, `list_providers`, `KindAlreadyRegisteredError` | `modules.learning_items.plugin` |
| `CompletionCriterionType`, `ProgressStatus` | `modules.learning_items.enums` |
| `CompletionEvaluator` | `modules.learning_items.services.completion_evaluator` |

## Built-in types

| `kind` | Provider | Valid completion criteria |
| --- | --- | --- |
| `assignment` | `AssignmentItemProvider` | `view`, `mark_complete`, `submission_graded`, `submission_submitted`, `submission_passed` |
| `feedback` | `FeedbackItemProvider` | `mark_complete` |
| `file` | `FileItemProvider` | `view`, `download`, `mark_complete` |
| `html_page` | `HtmlPageItemProvider` | `view` |
| `media` | `MediaItemProvider` | `view`, `mark_complete`, `media_pct_gte`, `video_pct_gte`, `time_spent_gte` |
| `quiz` | `QuizItemProvider` | `score_gte` |
| `scorm` | `ScormItemProvider` | `scorm_status_in`, `score_gte` |
| `training` | `TrainingItemProvider` | `mark_complete` |
| `url_resource` | `UrlResourceItemProvider` | `view` |
| `video` | `VideoItemProvider` | `view`, `mark_complete`, `media_pct_gte`, `video_pct_gte`, `time_spent_gte` |

## Attributes

| Attribute | Type | Meaning |
| --- | --- | --- |
| `kind` | `str` | The type name stored on each learning item. 1 to 32 characters, unique across providers. |
| `valid_completion_criteria` | `set[str]` | Criterion types an instructor can add to an item of this kind. `POST /api/v1/learning-items-api/learning-items/{id}/criteria` rejects any other type with 422. |

## Methods

Every method is `async`. Each one except `supports_self_serve_player` takes the database handle `dml: DB` as its first argument.

| Method | Returns | When the host calls it |
| --- | --- | --- |
| `create(dml, learning_item_id, payload)` | `dict \| None` | On `POST /api/v1/learning-items-api/learning-items`, after the shared record is written. If it raises, the service removes the new learning item and the request fails. |
| `get(dml, learning_item_id)` | `dict \| None` | Whenever the API returns an item with its content, for example `GET /api/v1/learning-items-api/learning-items/{id}`. List endpoints, such as `GET /api/v1/learning-items-api/learning-items` and the placement lists, call it once per item, so keep it fast. The result becomes the item's `content` field. |
| `update(dml, learning_item_id, payload)` | `dict` | On `PUT` or `PATCH /api/v1/learning-items-api/learning-items/{id}` when the body has a `content` field. `payload` is its value, which is `None` when the body sends `"content": null`. |
| `delete(dml, learning_item_id)` | `None` | Not called today. Deleting a learning item is a soft delete that keeps the type's record. |
| `clone(dml, source_id, target_id)` | `None` | On `POST /api/v1/learning-items-api/learning-items/{id}/clone`, after the new shared record exists. Copy the type's record from `source_id` to `target_id`. |
| `get_progress_signals(dml, user_id, learning_item_id)` | `ProgressSignals` | Each time completion is evaluated for a learner. See [Evaluate progress](#evaluate-progress). |
| `supports_self_serve_player()` | `bool` | Not called today. Returns whether learners can launch the item directly in the client. |

The `create` payload is the request's `payload` object. The service adds `tenant_id`, `learning_item_id` and `title`, plus `created_by` when it knows the author.

For `url_resource`, `quiz`, `assignment` and `training`, publishing or archiving an item also calls `update` with `{"status": "published"}` or `{"status": "archived"}`.

### Optional methods

The host looks for these on the provider's class, so define them as methods. An attribute set on an instance is ignored.

| Method | Returns | When the host calls it |
| --- | --- | --- |
| `get_default_pass_threshold(dml, learning_item_id)` | `float \| None` | When an item has no criteria of its own. Default criteria that take a threshold use the item's `pass_mark_pct`, then this value, then 80. A `pass_mark_pct` of 0 counts as unset. |
| `assert_publishable(dml, learning_item_id)` | `None` | When an item moves from draft to published, before the new status is saved. Raise to block publishing. |

## Progress signals

`get_progress_signals` returns a `ProgressSignals` dataclass. Criteria read these fields.

| Field | Type | Default | Meaning |
| --- | --- | --- | --- |
| `status` | `str` | required | Usually a `ProgressStatus` value: `not_started`, `in_progress`, `completed` or `failed`. SCORM passes the attempt's own status, such as `incomplete`, `passed` or `browsed`, which `scorm_status_in` matches. |
| `score` | `float \| None` | `None` | The learner's score. |
| `time_spent_seconds` | `int` | `0` | Total time on the item, in seconds. |
| `attempts_count` | `int` | `0` | Number of attempts. |
| `completion_pct` | `float \| None` | `None` | Percentage of the content covered, for example watched. |
| `viewed` | `bool` | `False` | The learner opened the item. |
| `downloaded` | `bool` | `False` | The learner downloaded the item. |
| `submission_status` | `str \| None` | `None` | Status of the latest assignment submission. |
| `submission_passed` | `bool \| None` | `None` | Whether the latest graded assignment attempt met the pass mark. |

## Completion criteria

| `criterion_type` | Met when |
| --- | --- |
| `view` | `viewed` is true, or `status` is `in_progress` or `completed` |
| `download` | `downloaded` is true |
| `mark_complete` | `status` is `completed`. `POST /api/v1/learning-items-api/progress/{learning_item_id}/mark-complete` writes `completed` to the learner's progress record without asking the provider, so `get_progress_signals` must read that record back. Otherwise the next evaluation undoes the completion. |
| `score_gte` | `score` is at least `threshold` |
| `attempts_max` | `attempts_count` is at most `threshold`. A `threshold` of 0 or none means no limit, so the criterion is always met. |
| `time_spent_gte` | `time_spent_seconds` is at least `threshold` |
| `scorm_status_in` | `status` is one of the comma-separated values in `value_text`, ignoring case |
| `media_pct_gte`, `video_pct_gte` | `completion_pct` is at least `threshold` |
| `submission_graded` | `submission_status` is `graded`, or `status` is `completed` |
| `submission_submitted` | `submission_status` is `submitted` or `graded` |
| `submission_passed` | `submission_status` is `graded` and `submission_passed` is true |

### How criteria combine

- Criteria with the same `group_no` form a group.
- Within a group, each criterion after the first joins the result so far with its own `logical_operator`, `AND` (the default) or `OR`. The criteria are read in the order the database returns them, which isn't fixed.
- Mixing `AND` and `OR` in one group can give a different result each time. Use one operator per group, and separate groups for alternatives.
- The item is complete when any group is true.
- A quiz also needs `status` to be `completed`, so an `OR` shortcut can't complete it without a pass.

### Defaults

When an item has no criteria, the evaluator uses a default for its kind.

| `kind` | Default criterion |
| --- | --- |
| `quiz` | `score_gte` with the pass mark |
| `scorm` | `scorm_status_in` with `passed,completed` |
| `video`, `media` | `media_pct_gte` with the pass mark |
| `assignment` | `submission_graded` |
| `url_resource`, `html_page` | `view` |
| `file` and any other kind | `mark_complete` |

### Result

When the criteria are met, the learner's progress becomes `completed`. Otherwise it takes `status` from the signals, or `in_progress` if that is empty. A provider that returns `completed` completes the item even when its criteria aren't met, so return `completed` only when the item is done. The evaluator also copies `score`, `time_spent_seconds` and `attempts_count` into the progress record.

## Evaluate progress

The host doesn't evaluate progress on a schedule. It calls `get_progress_signals` when something asks for an evaluation:

- The type's backend module, after a learner does something that can change their progress.
- `POST /api/v1/learning-items-api/progress/{learning_item_id}/recompute`.
- The deprecated `POST /api/v1/learning-items-api/learning-items/{id}/progress/evaluate`.
- The Celery task `progress_user_recompute_runner`, which has no request.

Read everything `get_progress_signals` needs through `dml`, not from a request.

To ask for an evaluation from the type's module:

```python
from modules.learning_items.repositories.learning_item_repository import LearningItemRepository
from modules.learning_items.services.completion_evaluator import CompletionEvaluator

new_status = await CompletionEvaluator(LearningItemRepository(dml)).evaluate_and_update_progress(
    user_id, learning_item_id, placement_id, tenant_id=tenant_id
)
```

`placement_id` is optional. Without it, the evaluator updates every progress record the learner has for the item, or creates one for each placement.

`evaluate_and_update_progress` doesn't commit. In a request, the session commits when the request ends. In a Celery task, call `await session.commit()` afterwards, or the result is lost.

## Register a provider

`register_builtin_content_providers()` in `modules.learning_items.plugin.builtin` registers the built-in providers. The API and the Celery worker both call it at start-up, because both evaluate completion. It then checks that every built-in kind is registered and raises `RuntimeError` if one is missing.

- `register_provider(provider)` raises `KindAlreadyRegisteredError` if the kind is taken.
- `get_provider(kind)` returns the provider, or `None`.
- Creating or evaluating an item whose kind has no provider fails with `No ContentTypeProvider registered for kind: <kind>`.

A new built-in type needs:

1. A provider class in the type's backend module that implements every method above.
2. An entry in `register_builtin_content_providers()` and in `BUILTIN_CONTENT_PROVIDER_KINDS`.
3. A branch in `get_default_criteria()` in `modules.learning_items.services.completion_evaluator`, unless `mark_complete` is the right default.
4. A frontend change, because the course builder's type picker lists types by name.

```python
from typing import Any
from uuid import UUID

from core.database.dml import DB
from modules.learning_items.plugin import ContentTypeProvider, ProgressSignals


class ChecklistItemProvider(ContentTypeProvider):
    kind = "checklist"
    valid_completion_criteria = {"view", "mark_complete"}

    async def create(self, dml: DB, learning_item_id: UUID, payload: dict[str, Any]) -> dict[str, Any] | None: ...
    async def get(self, dml: DB, learning_item_id: UUID) -> dict[str, Any] | None: ...
    async def update(self, dml: DB, learning_item_id: UUID, payload: dict[str, Any]) -> dict[str, Any]: ...
    async def delete(self, dml: DB, learning_item_id: UUID) -> None: ...
    async def clone(self, dml: DB, source_id: UUID, target_id: UUID) -> None: ...
    async def get_progress_signals(self, dml: DB, user_id: UUID, learning_item_id: UUID) -> ProgressSignals: ...
    async def supports_self_serve_player(self) -> bool: ...
```

## Related

- [Learning items data model](../data-model/learning-items.md)
- [Plugin system](../architecture/plugin-system.md)
- [Build your first plugin](./build-a-plugin.md)
