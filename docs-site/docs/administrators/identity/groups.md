---
id: groups
title: Manage groups
sidebar_label: Groups
sidebar_position: 6
doc_type: how-to
audience: administrators
source_prd: none
ai_drafted: true
last_verified: 2026-10-31
tags: [identity]
---

Create groups of people, such as cohorts, batches or teams, and reuse them across courses, notifications and reports. A group lives apart from any course, so one group can be enrolled in many courses.

## Prerequisites

You need the capabilities `group:create` and `membership:add`. Super Administrator, Administrator, Tenant Administrator, Program Manager and Course Manager have them.

## Steps

### Create a group

1. Go to **Users** > **Groups & Batches**.
2. Select the option to add a group.
3. Fill in the form:

   | Field | Required | Description |
   | --- | --- | --- |
   | **Group name** | Yes | The name people see |
   | **Type** | | Cohort, batch, department, team, program or custom |
   | **Owner** | Yes | The person or team responsible |
   | **Description** | | |
   | **Visible in reports** | | Shows the group as a filter on the reports screen |
   | **Notify on enrollment** | | Tells members when they are enrolled through the group |

4. Select **Create group**.

### Add members

Open the group, then add people one at a time or in bulk. You can also upload a CSV file. Each membership records how it was added: manual, CSV, API, self-join or dynamic.

Removing someone marks their membership as left. CMDX keeps the history.

### Use the group

- **Enroll a group in a course:** use **Enrollments** > **Groups**. See the enrollment pages for instructors.
- **Send to a group:** use **Notifications** > **Send**, and choose **Group or batch**.
- **Filter a report:** turn on **Visible in reports**.

## Dynamic groups

A dynamic group gets its members from rules on profile attributes, rather than by hand. For example, a rule can match people whose `profile_completion_pct` is greater than 50.

- CMDX adds people who match and removes people who stop matching. Members have the source `dynamic`.
- A sync runs on a schedule, and you can start one with `POST /api/v1/groups/<group-id>/sync`, which needs `dynamic_group:sync`.
- You can't edit the members of a dynamic group by hand. Adding, importing or removing someone returns HTTP 409.

## Visibility and joining

| Setting | Values |
| --- | --- |
| Visibility | `public`, `members_only` or `private` |
| Join policy | `open`, `invite` or `request` |

With `request`, people ask to join, and someone with `join_request:review` approves or rejects the request.

A group can have a capacity limit and a parent group. Member roles are `member`, `leader`, `coordinator` and `owner`.

## Verify

- The group appears on **Users** > **Groups & Batches**, with the right member count.
- A new member can see the courses the group is enrolled in.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Adding a member returns 409 | The group is dynamic. | Change the rules instead. |
| A dynamic group's members are out of date | The sync hasn't run. | Start a sync. Check that the scheduled tasks are running. See [scheduled tasks](../operations/scheduled-tasks.md). |
| A person isn't enrolled after you added them | Group enrollment depends on the group sync. | Wait for `enrollments.group_sync_reconciliation`, which runs every hour. |

## Related

- [Users and roles](./users-and-roles.md)
- [Permissions](./permissions.md)
