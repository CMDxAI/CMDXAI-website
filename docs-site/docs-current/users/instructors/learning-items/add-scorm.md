---
id: add-scorm
title: Add a SCORM package
sidebar_label: Add SCORM
sidebar_position: 1
doc_type: how-to
audience: users
source_prd: none
ai_drafted: true
last_verified: 2026-11-01
tags: [learning-items, scorm]
---

Upload a SCORM package and make it available in a course.

## Before you start

Prepare a valid SCORM package as a ZIP file. Confirm the package standard and the completion or mastery behaviour you expect.

## Add the package

1. Open the course builder.
2. Select **Add learning item**, then choose **SCORM**.
3. Enter the item title and description.
4. Upload the package.
5. Select the package standard and configure its attempt or completion settings.
6. Select **Save**.
7. Place the item in the intended course section.

Do not unpack or modify the package unless the package authoring tool requires it. Keep a copy of the original ZIP for support.

## Verify

Open the item as a learner and launch it. Confirm that the package loads, progress is recorded, and the completion result returns to CMDX.

## Troubleshooting

- **The package is rejected:** validate the ZIP and its manifest, then confirm that the selected standard matches the package.
- **The package launches but cannot save progress:** check the SCORM runtime configuration and browser access to the content origin.
- **The learner has no access:** confirm the course enrollment and item permissions.
