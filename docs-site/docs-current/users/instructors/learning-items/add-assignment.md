---
id: add-assignment
title: Add an assignment
sidebar_label: Add an assignment
sidebar_position: 5
doc_type: how-to
audience: users
source_prd: none
ai_drafted: true
last_verified: 2026-11-03
tags: [learning-items, assignments]
---

Add an assignment to a course section so learners can submit text, a file or a link for you to grade.

## Prerequisites

- You can edit the course, and it has at least one section. See [create a course](../create-a-course.md).
- Your role lets you create learning items. If you see **Permission denied** when you create the assignment, ask your administrator. Administrators can check the roles on the [permissions](/administrators/identity/permissions) page.

## Create the assignment

1. In **My Courses**, open the course and select the **Content** tab.
2. In the section where the assignment belongs, select **Drag a learning item here**.

   ![The content builder with two sections and the Content library panel on the right](/img/screens/add-assignment-1.png)

   You can also drag the **Assignment** card from the **Content library** panel onto a section. That creates an assignment with a default title, which you then open and edit.

3. Under **Choose type**, select **Assignment**.
4. Fill in the details:
   - **Title**: the name learners see in the course.
   - **Description**: optional.
   - **Section**: where the assignment appears. It starts as the section you chose.
   - **Instructions**: what learners must do and submit. You can format them later on the **Instructions** tab.
   - **Submission type**: **File upload**, **Text entry** or **URL**.
5. In the side panel, set:
   - **Points**: the maximum score. The default is 100.
   - **Due date**: optional.
   - **Count toward completion**: on by default. Turn it off if the assignment shouldn't count toward course progress.
   - **Visible to learners**: off by default, so the assignment starts as a draft that learners can't see.
   - **Allow late submissions**: on by default. Turn it off to stop submissions after the due date.

   ![The New learning item screen with Assignment selected, the title, section, instructions and Text entry filled in](/img/screens/add-assignment-2.png)

6. Select **Create & edit**.

CMDX shows **Item created** and returns you to the content builder. The assignment appears in the section with the label **Assignment**.

## Set grading and the deadline

1. In the content builder, select the assignment to open it. The **Settings** tab opens.
2. Expand **Grading & deadline** and set:
   - **Points**: the maximum score.
   - **Max attempts**: how many times a learner can submit. Leave it empty for unlimited attempts.
   - **Opens**: optional. The date learners can start submitting.
   - **Due date**: optional. It can't be earlier than **Opens**.
   - **Late submissions**: **Allow (no penalty)** or **Block after due date**.

   ![The Grading and deadline section with 50 points, 3 attempts, a due date and Block after due date selected](/img/screens/add-assignment-3.png)

   :::note
   Late penalties aren't available from this screen yet. Choose **Allow (no penalty)** or **Block after due date**.
   :::

3. If **Submission type** is **File upload**, expand **File restrictions** and set:
   - **Max file size (MB)**: leave it empty to use the server's upload limit.
   - **Allowed file types**: choose from **Images (JPG, PNG, GIF, WebP)**, **PDF**, **Word documents**, **Excel spreadsheets** and **Text and CSV**. Choose none to allow every type the server accepts.
4. Select **Save changes**.

## Write the instructions

1. Open the assignment and select the **Instructions** tab.
2. Write or edit the instructions. The toolbar adds bold, italic, links, tables, horizontal rules and lists.
3. Select **Preview** to check how learners will see them.
4. Select **Save changes**.

## Add a rubric

A rubric splits the score into criteria. You score each criterion when you grade. An assignment without criteria has no rubric.

1. Open the assignment and select the **Rubric** tab.
2. Select **Add criterion**.
3. Enter the criterion in **Criterion label**, and its maximum score in **Points**. Each new criterion starts at 10 points.
4. Repeat for each criterion. The total appears at the top right of the card.
5. Select **Save changes**.

The criteria can't add up to more than the assignment's **Points**.

![The Rubric tab with two criteria worth 25 points each, 50 points in total](/img/screens/add-assignment-4.png)

## Check how the assignment completes

Open the **Completion** tab. An assignment has one completion rule: **Graded**. It counts as complete for a learner once you grade their submission.

## Publish the assignment

1. Open the assignment and select the **Settings** tab.
2. Under **Status & visibility**, set **Status** to **Open**. **Visible to learners** turns on.
3. Select **Save changes**.

![The Status and visibility card with Status set to Open and Visible to learners on](/img/screens/add-assignment-5.png)

Learners see the assignment once the course is also published.

## Check submissions for AI-generated text

CMDX can estimate whether a submission's text was written by an AI tool. The result is advisory: review the work yourself before you act on it. Learners never see the result.

The check is available only after your administrator turns on the AI check and connects an AI provider. Until then, the check reports **Skipped**.

To run it:

1. In the instructor navigation, select **Assignments** and open the assignment.
2. Select the **Submissions** tab.
3. On a submitted learner's row, select **Grade**. The **Grade submission** dialog opens.
4. In the **AI content check** card, select **Run check**. After a check has run, the button reads **Re-run check**.

<!-- TODO: verify: the AI check steps come from the frontend code on main; they weren't run against a live submission. -->

The card shows one of these states:

| State | Meaning |
| --- | --- |
| **Not run yet** | Nobody has run the check on this submission. |
| **Running…** | The check is in progress. The card updates when it finishes. |
| **Completed** | The result is ready. |
| **Failed** | The check couldn't finish. The card shows the reason. Run it again. |
| **Skipped** | The AI check isn't turned on. Ask your administrator. |

A completed check shows:

- A verdict: **Likely human-written**, **Likely AI-generated** or **Uncertain**.
- The estimated likelihood, as a percentage, that AI wrote the text.
- How confident the check is, and its reasoning.
- The AI provider and model that ran it.

The check reads only the text the learner submitted.

## Verify

1. Open the course's **Content** tab. The assignment is in the section you chose, labelled **Assignment**.
2. Open the assignment. The labels under its title show **Assignment**, **Open**, the points and the section.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| **Permission denied** when you select **Create & edit** | Your role can't create learning items. | Ask your administrator to give you a role that can. |
| **Pass mark cannot exceed max points** when you create the assignment | A new assignment has a pass mark of 40 points, so **Points** must be at least 40. | Enter 40 or more in **Points**. <!-- TODO: verify whether a lower value can be saved from the Settings tab afterwards. --> |
| **Late penalty percentage is required when late policy is penalize** | **Allow with penalty** is selected. | Choose **Allow (no penalty)** or **Block after due date**. |
| **Sum of rubric criterion max points cannot exceed assignment max points** | The rubric criteria add up to more than **Points**. | Lower the criteria points, or raise **Points**. |
| **Due date cannot be before available from** | **Due date** is earlier than **Opens**. | Move one of the dates. |
| Learners can't see the assignment | Its status is **Draft**, or the course isn't published. | Set **Status** to **Open**, and publish the course. |

## Next steps

- [Grade submissions](../grading.md)
- [Enroll learners](../enroll-learners.md)
