---
id: scorm
title: SCORM learning items
sidebar_label: SCORM
sidebar_position: 1
doc_type: explanation
audience: developers
source_prd: "112820225"
ai_drafted: true
last_verified: 2026-10-28
tags: [examples, learning-items, scorm]
---

A SCORM learning item plays a SCORM package and records the learner's status, score and time from it. It is a built-in type, `kind: "scorm"`, provided by the `scorm` module through the [learning item contract](../learning-item-contract.md).

## Supported packages

CMDX plays SCORM 1.2 and SCORM 2004 packages. It reads the version from `imsmanifest.xml`, and treats a package as 1.2 when the manifest doesn't say.

A package with several SCOs launches its first SCO. Each SCO's data is stored separately, and the attempt's status and score come from the package as a whole.

## Upload a package

1. Upload the ZIP file with `POST /api/v1/learning-items-api/scorm/packages/upload`.
2. CMDX accepts the package only once its virus scan is clean. It then checks the ZIP and extracts it:

   | Limit | Value |
   | --- | --- |
   | Files in the package | 1,000 |
   | Size when extracted | 100 MB |
   | Compression ratio of any file | 100 to 1 |

   A missing or invalid `imsmanifest.xml` returns `422`. Other problems with the package return `400`.
3. Publishing the learning item needs a playable package. Publishing a SCORM item placed in a course also creates its grade item in that course's gradebook.

## Package settings

| Setting | Default | Meaning |
| --- | --- | --- |
| `attempts_max` | Unlimited | How many finished attempts a learner may make, 1 to 1,000. |
| `relaunch_mode` | `resume` | What launching does when the learner already has an attempt. |
| `mastery_score` | None | The score, 0 to 100, that a learner needs to pass. See [Mastery](../../data-model/mastery.md). |

| `relaunch_mode` | Launch |
| --- | --- |
| `resume` | Continues an unfinished attempt, or starts a new one. |
| `new` | Always starts a new attempt. |
| `review` | Reopens the learner's latest attempt. |

An attempt is finished when its status is `completed`, `passed` or `failed`. When a learner has used all their attempts, launching returns `409`.

## Runtime

1. The player calls `POST /api/v1/learning-items-api/scorm/packages/{id}/launch`, where `{id}` is the learning item or the package. The response holds a short-lived URL that opens the player.
2. The player serves the package's files and gives its content the SCORM API: `window.API` for SCORM 1.2 and `window.API_1484_11` for SCORM 2004.
3. Values the content sets are buffered, and saved when it commits or finishes, and every 30 seconds.

CMDX reads these values from the runtime data:

| Value | Read from |
| --- | --- |
| Status | `cmi.core.lesson_status` (1.2), or `cmi.completion_status` and `cmi.success_status` (2004), whichever was set last |
| Score | `cmi.core.score.raw` (1.2) or `cmi.score.raw` (2004), kept within the score's minimum and maximum |
| Time | `cmi.core.session_time` (1.2) |

A value outside the SCORM vocabulary for that element is rejected with `400`.

## Completion and grades

| Criterion | Met when |
| --- | --- |
| `scorm_status_in` | The status is one of a comma-separated list, ignoring case. |
| `score_gte` | The score is at least the threshold. |

The default criterion is `scorm_status_in` with `passed,completed`.

When the package reports a score but not `passed` or `failed`, and the package has a `mastery_score`, CMDX sets the status to `passed` or `failed` from the score.

Each attempt's score counts as a percentage in the gradebook. Author previews don't count toward attempts, progress or grades.

## Serving and isolation

By default, package files are served from the same origin as CMDX, with a strict Content Security Policy, and are never public static files. `SCORM_CONTENT_MODE=isolated` serves them from a separate origin set in `SCORM_CONTENT_ORIGIN`; playback is refused if that origin isn't configured.

## Endpoints

Authoring and launch paths are under `/api/v1/learning-items-api/scorm`.

| Method and path | Needs |
| --- | --- |
| `POST /packages`, `/packages/upload` | `scorm:upload` |
| `GET /packages/{id}` | A signed-in user |
| `PATCH /packages/{id}`; `GET /packages/{id}/attempts`; `POST /packages/{id}/preview` | `scorm:upload` |
| `POST /packages/{id}/launch` | `scorm:attempt` |
| `GET /packages/{id}/play` and the runtime routes | The token from launch |

## Settings

All are environment settings.

| Setting | Default | Meaning |
| --- | --- | --- |
| `SCORM_LAUNCH_TOKEN_EXPIRE_MINUTES` | `5` (1 to 15) | How long the launch URL works. |
| `SCORM_RUNTIME_TOKEN_EXPIRE_MINUTES` | `120` (1 to 180) | How long a runtime session lasts. |
| `SCORM_ASSET_SESSION_MINUTES` | `120` (1 to 120) | How long the player can load package files. |
| `SCORM_CONTENT_MODE` | `same-origin` | `same-origin` or `isolated`. |
| `SCORM_CONTENT_ORIGIN` | Empty | The separate origin for `isolated` mode. It must differ from `SCORM_LMS_ORIGIN`, share its parent domain, and use HTTPS in production. |
| `SCORM_LMS_ORIGIN` | Empty | The browser origin of the CMDX play page, used with `isolated` mode. |
| `SCORM_ALLOW_REMOTE_FONTS` | `false` | Whether packages may load fonts from other sites. |
| `SCORM_ALLOW_REMOTE_MEDIA` | `true` | Whether packages may load media from other sites. |

## Related

- [Learning item contract](../learning-item-contract.md)
- [Mastery data model](../../data-model/mastery.md)
- [Grades data model](../../data-model/grades.md)
