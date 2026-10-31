---
id: ai-providers
title: Connect an AI provider
sidebar_label: AI providers
sidebar_position: 6
doc_type: how-to
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [configuration, ai]
---

Connect CMDX to a language model service, so that people can use its AI features. CMDX doesn't include a model. You bring your own provider and API key, and your content is sent to that provider.

## Prerequisites

- An API key from your provider.
- The `admin` or `platform_superadmin` role, or the `ai.provider.manage` capability.
- A review of what you can send to the provider. Learner content in an AI request goes to the provider you connect. Check your data protection terms first.

## Provider types

| Type | Use it for |
| --- | --- |
| OpenAI compatible | OpenAI, and any service with the same API, such as a local Ollama server |
| Anthropic | Anthropic's API |
| Gemini | Google's API |
| Azure OpenAI | Azure OpenAI Service |
| DeepSeek | Blocked by default. See [blocked providers](#blocked-providers). |

## Steps

1. Go to **AI Subsystem** > **Providers**.
2. Select the option to connect a provider.
3. Fill in the form:

   | Field | Required | Description |
   | --- | --- | --- |
   | **Display name** | Yes | Your name for this connection |
   | **Provider type** | Yes | See the table above |
   | **Base URL** | | Needed for a self-hosted service, for example `http://localhost:11434/v1` for Ollama |
   | **API key** | Yes | Encrypted when saved, and never returned by the API |
   | **Default model** | | The model to use when a feature doesn't name one |
   | **Temperature**, **Max tokens**, **Timeout (s)** | | Request settings. The timeout defaults to `AI_DEFAULT_TIMEOUT_SECONDS`, and output to `AI_MAX_OUTPUT_TOKENS`. |
   | **Priority** | | The order among providers |

4. Choose whether this applies to every tenant, or one, and whether it is the default.
5. Save the provider, then test it from the provider list.

## Turn features on or off

**AI Subsystem** > **Features** sets which provider and model each feature uses, and whether it is on. The features are:

| Feature | Key |
| --- | --- |
| Summarize text | `summarize_text` |
| Generate text | `generate_text` |
| Generate a quiz | `generate_quiz` |
| AI tutor chat | `tutor_chat` |
| Check a submission | `verify_submission` |
| Extract content from a file | `extract_content` |
| Generate a course | `course_generation` |

Set `ENABLE_AI=false` in `.env` to turn off AI across the install.

## Blocked providers

`AI_BLOCKED_PROVIDER_TYPES` lists provider types that can't be configured. It defaults to `["deepseek"]`, because that service runs in a country with no data protection adequacy decision. Clear it only once your legal basis for the transfer is on file.

## Watch usage

**AI Subsystem** > **Usage log** lists each request. Viewing it needs `ai.usage.view`. CMDX keeps these rows for 90 days once the retention sweep is on, set by `RETENTION_AI_REQUEST_LOG_DAYS`. Tutor conversations are kept for 180 days, set by `RETENTION_AI_TUTOR_DAYS`.

## Access

These permissions gate the AI screens. The `admin` and `platform_superadmin` roles pass all of them. They aren't in the [capability list](../identity/permissions.md), because the AI module checks them itself.

| Permission | Allows |
| --- | --- |
| `ai.provider.manage` | Managing providers |
| `ai.feature.manage` | Changing features |
| `ai.usage.view` | Reading the usage log |
| `ai.action.use` | Using AI actions |

## Verify

1. Test the provider from the provider list.
2. Go to **AI Subsystem** > **Playground** and try a request.
3. Check that it appears in **Usage log**.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| The test fails with an authentication error | The API key is wrong or expired. | Enter the key again. |
| Requests time out | The model is slow, or `Timeout (s)` is too low. | Raise the timeout. Long AI requests can also stop at a proxy. See [Troubleshoot an install](../operations/troubleshooting.md). |
| A self-hosted model can't be reached | `localhost` inside a container is that container. | Use an address the backend container can reach. |
| Saved keys stopped working | `SECRET_KEY` changed. AI keys are encrypted with it. | Enter the keys again. |
| A provider type is refused | It is in `AI_BLOCKED_PROVIDER_TYPES`. | See [blocked providers](#blocked-providers). |

## Related

- [Permissions](../identity/permissions.md)
- [Monitor CMDX](../operations/monitoring.md)
