---
id: glossary
title: Glossary
sidebar_label: Glossary
sidebar_position: 3
doc_type: reference
audience: all
source_prd: none
ai_drafted: true
last_verified: 2026-10-24
tags: [glossary, terminology]
---

The terms used across CMDX and its documentation. If you are coming from another learning management system, the last column lists the names it may have used.

## Terms

<!-- vale off -->

| Term | Meaning | Elsewhere called |
| --- | --- | --- |
| administrator | A person who manages a tenant or a whole CMDX install: its users, roles and settings. | admin, superuser |
| course | The container learners enroll in. A course holds learning items, which can be grouped into sections. | class, program |
| enroll, enrollment | To enroll is to add a learner to a course. An enrollment is the record that the learner belongs to that course. | register |
| event | A notice that something happened in CMDX, such as a learner being enrolled in a course, that other parts of CMDX can react to. <!-- TODO: verify: how events differ from hooks; Phase 0 says hooks are synchronous and events asynchronous, the backend hooks doc calls hooks the in-process event bus --> | signal |
| feature flag | A setting that turns a CMDX feature on or off. Administrators change them on the **Feature flags** settings screen. | toggle, switch |
| hook | A named point in CMDX where plugin code can run, for example after a user registers. Every handler registered for a hook runs, in priority order. | trigger, listener |
| instructor | Anyone who builds or runs a course. | teacher, trainer, facilitator |
| learner | Anyone taking a course. | student, trainee |
| learning item | A reusable unit of learning content, such as a SCORM package, a video, a file or a quiz. You create it once and can place it in more than one course. | activity, module, resource, content item |
| mastery | A learner's record of how much of a learning item they have completed, kept per item rather than per course. Today, media items track it by how much has been watched. | completion score, progress |
| placement | A learning item placed in a course or a course section, with its position and whether learners must complete it. | instance, link, occurrence |
| plugin | Code that extends CMDX through its plugin system. A plugin is packaged and installed separately from CMDX. | extension, add-on, module |
| tenant | One isolated customer space in a CMDX deployment, with its own members, courses and settings. A person can be a member of more than one tenant. | organization, site, instance, client |

<!-- vale on -->

## Related

- [Concepts](./concepts.md): how tenants, courses, learning items and placements fit together.
