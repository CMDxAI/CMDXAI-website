---
id: provider-contracts
title: Provider contracts
sidebar_label: Provider contracts
sidebar_position: 4
doc_type: reference
audience: developers
source_prd: none
ai_drafted: true
last_verified: 2026-10-29
tags: [plugins, groups, storage, notifications, ai]
---

The interfaces the CMDX backend uses to talk to outside systems: identity providers, video conferencing, AI models, quiz graders, notification channels and file storage.

Only one of them is part of the plugin API. Plugin code imports only from `core.plugin_api`, and of these contracts that package exports the group membership provider alone. The others are extension points inside the backend: you add an implementation by changing the backend repository, and their signatures can change in any minor release. See [What a plugin adds](../architecture/plugin-system.md#what-a-plugin-adds) for the rule.

## Summary

| Contract | Import from | How an implementation is added | Who can add one |
| --- | --- | --- | --- |
| [`GroupMembershipProvider`](#groupmembershipprovider) | `core.plugin_api` | `register_membership_providers()` in the plugin's `membership_providers.py` | Plugins |
| [`VCConnector`](#vcconnector) | `modules.trainings.vc_connector.base` | `@register` class decorator | Backend contributors |
| [`AIProviderAdapter`](#aiprovideradapter) | `modules.ai.providers.base` | `register_adapter()` | Backend contributors |
| [`QuestionGrader`](#questiongrader) | `modules.quizzes.grading.base` | `register_grader()` | Backend contributors |
| [`NotificationChannel`](#notificationchannel) | `core.notifications.channels.base` | `ChannelRegistry.register()` | Backend contributors |
| [`NotificationProvider`, `PushProvider`](#notificationprovider-and-pushprovider) | `modules.notifications.providers` | Edit the provider factory; there is no registry | Backend contributors |
| [`BaseStorage`](#basestorage) | `core.storage.base` | `ProviderRegistry.register()` | Backend contributors |
| [`StorageProvider`](#storageprovider) | `modules.files.services.storage.base` | Edit the storage builder; there is no registry | Backend contributors |

## Details

### `GroupMembershipProvider`

Lists groups held by an outside directory and returns who belongs to them, so CMDX groups can follow that directory.

```python
from core.plugin_api import (
    GroupMembershipProvider,
    GroupMembershipProviderContext,
    GroupMembershipProviderRegistry,
)
```

| Member | Signature | Notes |
| --- | --- | --- |
| `provider_type` | property → `GroupMembershipProviderType` | Required. One of `internal`, `azure_ad`, `okta`, `ldap`, `scim`, `external`. |
| `list_groups` | `async (context, *, page=1, limit=100) -> ProviderGroupListResult` | Required. |
| `fetch_group_members` | `async (context, *, group_id: UUID, external_group_id: str \| None = None) -> GroupMembershipSnapshot` | Required. |
| `reconcile_memberships` | `async (context, *, group_id: UUID, external_group_id: str \| None = None) -> GroupMembershipReconciliationSnapshot` | Required. |
| `health_check` | `async (context) -> bool` | Optional. Returns `True` unless you override it. |

`GroupMembershipProviderContext` carries `session` (an `AsyncSession` or `None`) and `tenant_id` (a `UUID` or `None`).

The return types are Pydantic models:

| Model | Fields |
| --- | --- |
| `ProviderGroupListResult` | `items: list[ProviderGroupSummary]`, `total`, `page`, `limit`, `provider_type` |
| `ProviderGroupSummary` | `external_id`, `name`, `group_id` (optional), `metadata` |
| `GroupMembershipSnapshot` | `provider_type`, `group_id`, `external_group_id`, `tenant_id`, `members: list[ProviderGroupMember]`, `fetched_at` |
| `GroupMembershipReconciliationSnapshot` | `provider_type`, `group_id` (required), `tenant_id`, `external_group_id`, `member_user_ids: list[UUID]`, `members`, `fetched_at` |
| `ProviderGroupMember` | `user_id`, `external_user_id`, `email`, `display_name` (all optional), `metadata` |

`core.plugin_api` doesn't re-export these models or the `GroupMembershipProviderType` enum yet. They live in `modules.groups.schemas` and `modules.groups.enums`.

**Registration.** Put a `membership_providers.py` module in your plugin package with a `register_membership_providers(registry)` function. CMDX imports it and calls the function when it builds the provider registry:

```python
# membership_providers.py
from core.plugin_api import GroupMembershipProvider, GroupMembershipProviderRegistry


class OktaProvider(GroupMembershipProvider):
    ...


def register_membership_providers(registry: GroupMembershipProviderRegistry) -> None:
    registry.register(OktaProvider())
```

**Behaviour.**

- One provider per `provider_type`. Registering a type again replaces the earlier provider, including the built-in `internal` one.
- The registry calls your methods through `execute()`. Any exception other than `GroupMembershipProviderFetchError` is logged and re-raised as `GroupMembershipProviderFetchError`.
- Only plugins in the backend's own `plugins/` folder (and `plugins/examples/`) are scanned for `membership_providers.py`. Plugins loaded from `EXTERNAL_PLUGINS_DIRS` or installed as packages aren't.
- The module is imported whether or not the plugin is enabled, and the provider is available to every tenant.

### `VCConnector`

Creates and removes online meetings for training sessions. Each connector also describes the settings form administrators fill in.

| Member | Type or signature | Notes |
| --- | --- | --- |
| `connector_type` | `str` | Registry key, for example `zoom`. |
| `display_name` | `str` | Shown to administrators. |
| `logo_url` | `str \| None` | Default `None`. |
| `supports_recording`, `supports_dial_in` | `bool` | Default `False`. |
| `max_retries` | `int` | Default `3`. |
| `config_schema` | `() -> list[ConnectorConfigField]` | Required. Each field has `key`, `label`, `type` (`text`, `password`, `url` or `select`), `required`, `options`, `placeholder`, `help_text`. |
| `validate_config` | `(config: dict) -> None` | Raises `VcIntegrationConfigError` listing required keys that are missing or blank. |
| `test_connection` | `async (*, config) -> bool` | Required. |
| `create_meeting` | `async (request: MeetingRequest, *, config) -> MeetingInfo` | Required. |
| `delete_meeting` | `async (meeting_id: str, *, config) -> None` | Required. |
| `get_meeting` | `async (meeting_id: str, *, config) -> MeetingInfo \| None` | Required. |

`MeetingRequest` has `title`, `start_time`, `end_time`, `timezone` (default `UTC`), `training_id` and `session_id`. `MeetingInfo` has `meeting_id`, `join_url`, `host_url`, `password` and `provider_metadata`.

**Registration.** Decorate the class with `register` from `modules.trainings.vc_connector.registry`, and import its module from `modules/trainings/vc_connector/__init__.py`. The decorator instantiates the class with no arguments. `register_instance()` exists for tests only.

**Built-in connectors:** `zoom`, `teams`, `webex`, `google_meet` and `custom`. None of them calls the provider yet: `create_meeting` returns a generated meeting ID and placeholder links.

### `AIProviderAdapter`

Sends chat messages to a model provider and returns a normalized completion.

| Member | Signature | Notes |
| --- | --- | --- |
| `__init__` | `(provider_id: str, base_url: str \| None, api_key: str \| None, config: dict \| None)` | Built from the stored AI provider settings; the API key arrives decrypted. |
| `chat` | `async (messages: list[AIMessage], *, model=None, temperature=None, max_tokens=None, timeout=None) -> AICompletion` | Required. |
| `provider_type` | `() -> AIProviderType` | Required. |
| `sanitize_error` | `(message: str) -> str` | Redacts the API key, bearer tokens and key-like values from error text. Use it on every provider error you surface. |
| `get_custom_headers` | `() -> dict[str, str]` | Reads `headers` or `extra_headers` from `config`. |

`AIMessage` has `role`, `content` and `attachments` (`AIAttachment`: `mime_type`, `data`, `filename`). `AICompletion` has `text`, `model`, the token counts, `raw` and `truncated`, which is `True` when the provider stopped at its output limit.

**Registration.** `register_adapter(provider_type, adapter_cls)` in `modules.ai.providers` adds or replaces the class for a provider type. `provider_type` must be an `AIProviderType` value: `openai_compatible`, `anthropic`, `gemini`, `azure_openai` or `deepseek`. A new provider type needs a new enum value too.

Set `DEFAULT_BASE_URL` on the class. The `AI_BLOCKED_PROVIDER_TYPES` setting uses it to refuse an `openai_compatible` provider that points at a blocked provider's domain.

### `QuestionGrader`

Scores one question type. A grader knows nothing about attempts, tenants or storage. The [quiz learning item](./examples/quiz.md) page describes the built-in graders.

`QuestionGrader` is a `Protocol`, so you don't subclass it:

| Member | Signature | Notes |
| --- | --- | --- |
| `question_type` | `str` | Must be a `QuestionType` value. |
| `grade` | `(question: dict, answer: dict, max_points: float) -> GradeResult` | `GradeResult` has `points_awarded` and `requires_manual_grading`. Set `requires_manual_grading` when a person must score the answer. |
| `validate_for_publish` | `(question: dict) -> list[str]` | Problems that block publishing; an empty list means the question can be published. |

**Registration.** `register_grader(grader, *, replace=False)` in `modules.quizzes.grading.registry`. Registering a type that already has a grader raises `QuestionTypeAlreadyRegisteredError` unless `replace=True`. Importing `modules.quizzes.grading` registers the built-in graders and fails if any `QuestionType` value has no grader, so a new question type needs both an enum value and a grader.

### `NotificationChannel`

Delivers a notification over one channel and turns the channel's delivery webhooks into receipts.

| Member | Signature | Notes |
| --- | --- | --- |
| `name` | `ClassVar[str]` | Channel name. |
| `requires_address` | `ClassVar[bool]` | Default `True`. `False` for channels with no address, such as in-app. |
| `send` | `async (*, to, subject, body_html, body_text, metadata) -> DeliveryResult` | Required. |
| `parse_webhook` | `async (payload: dict) -> WebhookEvent` | Required. Return a `WebhookEvent` with an empty `provider_message_id` to ignore a payload. |

`DeliveryResult` has `success`, `provider_message_id`, `error`, `metadata`, `status` and `retry_after_seconds`. Set `retry_after_seconds` when the provider asks you to back off.

**Registration.** `register(channel_name, channel_cls)` on `default_registry` in `core.notifications.channels.registry`. Names are case-insensitive. Each lookup creates a new instance with no arguments.

**Built-in channels:** `email`, `in_app`, `sms`, `whatsapp`, `push` and `webhook`. They are written against the older `ChannelAdapter` contract (`send(recipient, subject, body, metadata)` and `channel_name()`) and wrapped to fit `NotificationChannel`. Write new channels against `NotificationChannel`.

### `NotificationProvider` and `PushProvider`

The services behind the SMS, WhatsApp and push channels.

| Contract | Members |
| --- | --- |
| `NotificationProvider` (SMS and WhatsApp) | `provider_name` property; `async send_sms(*, to, body)`; `async send_whatsapp(*, to, body, template_name=None, template_language=None, template_variables=None)`; `async get_delivery_status(provider_message_id)` |
| `PushProvider` | `provider_name` property; `async send_push(request: PushSendRequest)`; `validate_token(device_token) -> bool`; `is_invalid_token_error(error_code, error_message) -> bool` (has a default) |

Sends return a `ProviderSendResult`: `success`, `provider`, `provider_message_id`, `error`, `error_code`, `retryable`, `retry_after_seconds`, `provider_status`, `raw_response`, `metadata`.

**Registration.** There is no registry. Factories in `modules.notifications.providers` choose the provider:

- **SMS:** Twilio.
- **WhatsApp:** Twilio, or Meta when `WHATSAPP_PROVIDER` is `meta`.
- **Push:** APNs for iOS devices and FCM otherwise.

Adding a provider means changing the factory.

### `BaseStorage`

Platform storage, selected by the `STORAGE_BACKEND` setting. The storage API endpoints, user data exports and report exports use it.

| Member | Signature |
| --- | --- |
| `name` | `str`. Non-empty and lowercase; it is the value `STORAGE_BACKEND` names. |
| `insert` | `async (file: BinaryIO, destination: str, metadata: dict \| None = None) -> str` |
| `fetch` | `(file_path: str) -> AsyncIterator[bytes]` |
| `delete` | `async (file_path: str) -> bool` |
| `exists` | `async (file_path: str) -> bool` |
| `list_files` | `async (folder_prefix="", page=1, page_size=10) -> dict` |
| `get_metadata` | `async (file_path: str) -> dict` |
| `get_presigned_url` | `async (file_path: str, expiration=3600) -> str` |

**Registration.** `ProviderRegistry.register(provider, overwrite=False)` in `core.storage.registry` takes an instance. Registering a name twice raises `StorageError` unless `overwrite=True`.

**Built-in drivers:** `local`, and `mock` (in memory) outside production. `get_storage()` resolves `STORAGE_BACKEND` (default `local`) once per process.

### `StorageProvider`

Storage for the files module: uploads, course files and signed download links.

| Member | Signature |
| --- | --- |
| `signed_url_ttl_seconds` | `int`, default `300` |
| `store` | `async (key: str, data: bytes) -> None` |
| `store_file` | `async (key: str, file_path: str) -> None` |
| `get` | `async (key: str) -> bytes` |
| `delete` | `async (key: str) -> None` |
| `get_signed_url` | `async (key: str, filename: str, expires_in_seconds=300) -> str` |

**Registration.** There is no registry. The provider is built from the storage settings administrators save: `local`, `s3`, `gcs` or `azure`. Adding one means changing that builder.

:::note

Whether plugins may use file storage, and through which of these interfaces, is still being decided. Until `core.plugin_api` exports a storage interface, treat both as internal.

:::

## Related

- [Plugin system](../architecture/plugin-system.md): what a plugin can add, and why plugins import only `core.plugin_api`
- [Build your first plugin](./build-a-plugin.md)
- [Learning item contract](./learning-item-contract.md): the contract for learning item types
