---
id: glossary
title: Glossary
sidebar_label: Glossary
sidebar_position: 3
doc_type: reference
audience: all
source_prd: none
ai_drafted: true
tags: [getting-started]
---

The terms used across CMDX and its documentation. If you are coming from another learning management system, the last column lists the names it may have used.

## Terms

<!-- vale CMDX.Terminology = NO -->
<!-- vale CMDX.TerminologyAmbiguous = NO -->

| Term | Meaning | Elsewhere called |
| --- | --- | --- |
| administrator | A person who manages a tenant or a whole CMDX install: its users, roles and settings. | admin, superuser |
| category | A folder that sorts courses and learning items within a tenant. Categories can contain other categories, and a category can be limited to some departments. | course category, folder |
| course | The container learners enroll in. A course holds learning items, which can be grouped into sections. | class, program |
| enroll, enrollment | To enroll is to add a learner to a course. An enrollment is the record that the learner belongs to that course. | register |
| event | A notice that something happened in CMDX, such as a learner being enrolled in a course. Plugins subscribe to events the same way as to hooks, but an event reaches its handlers in the background, after it happened, so they can't stop it. | signal |
| feature flag | A setting that turns a CMDX feature on or off. Administrators change them on the **Feature flags** settings screen. | toggle, switch |
| hook | A named point in CMDX where plugin code can run, for example after a user registers. The handlers registered for a hook run in priority order. | trigger, listener |
| instructor | Anyone who builds or runs a course. | teacher, trainer, facilitator |
| learner | Anyone taking a course. | student, trainee |
| learning item | A reusable unit of learning content, such as a SCORM package, a video, a file or a quiz. You create it once and can place it in more than one course. | activity, module, resource, content item |
| mastery | A learner's record of how much of a learning item they have completed, kept per item rather than per course. Today, media items track it by how much has been watched. | completion score, progress |
| placement | A learning item placed in a course or a course section, with its position and whether learners must complete it. | instance, link, occurrence |
| plugin | Code that extends CMDX through its plugin system. A plugin is packaged and installed separately from CMDX. | extension, add-on |
| tenant | One isolated customer space in a CMDX install, with its own members, courses and settings. A person can be a member of more than one tenant. | organization, site, client |

<!-- vale CMDX.Terminology = YES -->
<!-- vale CMDX.TerminologyAmbiguous = YES -->

## Related

- [Concepts](./concepts.md): how tenants, courses, learning items and placements fit together.
