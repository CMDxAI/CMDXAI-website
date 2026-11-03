---
id: add-training
title: Add an instructor-led training
sidebar_label: Add a training
sidebar_position: 9
doc_type: how-to
audience: users
source_prd: none
ai_drafted: true
last_verified: 2026-11-03
tags: [learning-items, trainings, attendance]
---

Add a live training to a course, schedule its sessions, take attendance, and decide when learners complete it.

## Prerequisites

- You can edit the course, and it has at least one section. See [create a course](../create-a-course.md).
- Your role lets you create learning items. If you see **Permission denied** when you create the training, ask your administrator.
- For online sessions, a meeting link from Zoom, Google Meet, Microsoft Teams or a similar service.

:::note
Today the training editor, where you add sessions, enroll learners, take attendance and set completion, opens only for administrators. If you see **You don't have access to this area** after you create the training, ask an administrator to finish the steps from [Add sessions](#add-sessions) on.
:::

## Create the training

1. In **My Courses**, open the course and select the **Content** tab.
2. In the section where the training belongs, select **Drag a learning item here**.
3. Under **Choose type**, select **Training**.
4. Fill in the details:
   - **Title**: the name learners see.
   - **Description**: optional. Learners see it on the training.
   - **Section**: where the training appears. It starts as the section you chose.
   - **Max enrollment**: the most learners who can enroll. Leave it empty for no limit.
5. In the side panel, check **Count toward completion** and **Visible to learners**.
6. Select **Create & edit**.

![The New learning item screen with Training selected, a title, description and a maximum of 20 learners](/img/screens/add-training-1.png)

You set up sessions, enrollments and completion in the training editor after you create the training.

To open the training editor later, select the training in the content builder.

## Add sessions

A training needs at least one session before learners can take part.

1. In the training editor, select the **Sessions** tab, then **Add session**.
2. Enter a **Session title**.
3. Choose **Online** or **On-site**.
4. Set the **Date**, **Start time** and **End time**.
5. Optionally, set a **Capacity** for this session.
6. For an online session, paste the **Meeting link**. For an on-site session, choose the location. <!-- TODO: verify: on-site location picker not run live. -->
7. Select **Add session**.

![The Sessions tab with one scheduled online session and its Open meeting, Edit, Start session and Cancel session actions](/img/screens/add-training-2.png)

Each session shows its status. A new session is **Scheduled**:

| Action | What it does |
| --- | --- |
| **Open meeting** | Opens the meeting link. |
| **Edit** | Changes the session's details. |
| **Start session** | Marks the session **In progress** and opens attendance for it. |
| **End session** | Marks a session in progress as finished. |
| **Cancel session** | Cancels a session that hasn't happened. |

## Enroll learners

1. Select the **Enrollments** tab.
2. Select **Enroll learners**, choose the learners and select **Enroll**.

The tab shows how many learners are enrolled and how many places are left. To remove a learner, select **Unenroll** on their row. To enroll many learners at once, use **Bulk CSV import**. <!-- TODO: verify: Bulk CSV import not run live. -->

## Take attendance

Attendance opens once a session has started.

1. Select the **Attendance** tab. The attendance sheet lists each enrolled learner against each session.
2. Select a learner's cell for a session to mark them: **P** present, **A** absent, **L** late or **E** excused.
3. Select **Save attendance**.

Each learner's **Attendance %** updates. Learners marked late count as attending.

![The attendance sheet with one learner marked present and 100 percent attendance](/img/screens/add-training-3.png)

## Decide when learners complete the training

1. Select the **Completion** tab.
2. Choose **All of the following** or **Any of the following**.
3. Turn on one or more rules:
   - **Complete all required learning items**: the learner finishes the items you've attached to the training.
   - **Attend sessions**: the learner reaches a **Min. % of sessions**, or **Or at least (sessions)** a number of sessions.
   - **Manual marking by instructor**: you mark each learner complete yourself.
4. Select **Save criteria**.

![The Completion tab with Attend sessions turned on and a minimum of 100 percent of sessions](/img/screens/add-training-4.png)

The tab also lists each learner's progress against the rules and their status, such as **Completed**. A completed training counts toward the learner's course progress.

## Verify

1. Sign in as a learner enrolled in the training, or ask one to check.
2. Open the course and select the training. It shows the learner's status, sessions attended, attendance, and the list of sessions.

![The learner's view of the training with status Completed, one of one sessions attended and the session list](/img/screens/add-training-5.png)

:::note
How a new training's sessions are shown to learners is being settled. If learners see **Could not load sessions**, ask your administrator.
:::

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| **You don't have access to this area** when you open the training | The training editor opens only for administrators today. | Ask an administrator to add sessions and enroll learners. |
| The **Attendance** tab says attendance opens once a session has started | No session is in progress or finished yet. | Select **Start session** on the **Sessions** tab, then reload the page. |
| An online session can't be saved | It has no meeting link. | Paste the meeting link from your video-call service. |
| Learners see **Could not load sessions** | See the note in [Verify](#verify). | Ask your administrator. |

## Next steps

- [Enroll learners](../enroll-learners.md)
- [Grade submissions](../grading.md)
