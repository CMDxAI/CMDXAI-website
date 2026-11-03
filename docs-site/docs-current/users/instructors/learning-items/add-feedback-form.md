---
id: add-feedback-form
title: Add a feedback form
sidebar_label: Add a feedback form
sidebar_position: 6
doc_type: how-to
audience: users
source_prd: none
ai_drafted: true
last_verified: 2026-11-03
tags: [learning-items, feedback]
---

Add a feedback form to a course section, so learners can rate the course, pick options and leave comments, and you can see the results.

## Prerequisites

- You can edit the course, and it has at least one section. See [create a course](../create-a-course.md).
- Your role lets you create learning items. If you see **Permission denied** when you create the form, ask your administrator.

:::note
Today the feedback builder, where you add questions, publish the form and see results, opens only for administrators. If you see **You don't have access to this area** after you create the form, ask an administrator to finish the steps from [Add questions](#add-questions) on.
:::

## Create the form

1. In **My Courses**, open the course and select the **Content** tab.
2. In the section where the form belongs, select **Drag a learning item here**.
3. Under **Choose type**, select **Feedback**.
4. Enter a **Title** and, optionally, a **Description**. Learners see both above the form. Check the **Section**.
5. In the side panel, leave **Count toward completion** on if the form should count toward course progress.
6. Select **Create & edit**.

![The New learning item screen with Feedback selected and the title and description filled in](/img/screens/add-feedback-form-1.png)

CMDX creates the form as a draft and opens the feedback builder. You add questions after the form is created.

To come back to the builder later, open the form in the content builder, select the **Content** tab, then select **Open feedback builder**.

## Add questions

1. In the feedback builder, on the **Questions** tab, select **Add**.
2. Choose a question type:
   - **Rating**: learners pick a value on a scale.
   - **Multiple choice**: learners pick from options you write.
   - **Open text**: learners type an answer.
3. Enter the **Question label**, and optionally **Help text**.
4. Leave **Required** on if learners must answer, or turn it off.
5. Fill in the settings for the question type, described below.
6. Select **Save question**.

![A new Rating question with a 1 to 5 scale shown as stars, and the labels Not useful and Very useful](/img/screens/add-feedback-form-2.png)

Repeat for each question. To change the order, drag a question by its grip in the list. To remove one, select its delete icon.

![The Questions tab listing a rating, a multiple choice and an open text question](/img/screens/add-feedback-form-3.png)

### Rating settings

| Setting | What it does |
| --- | --- |
| **Scale min**, **Scale max**, **Step** | The range learners choose from. The defaults are 1, 5 and 1. |
| **Display** | How the scale appears to learners, for example **Stars**. |
| **Low label**, **High label** | Optional words at each end of the scale, such as "Not useful" and "Very useful". |

### Multiple choice settings

| Setting | What it does |
| --- | --- |
| **Selection** | **Single choice** lets learners pick one option. **Multiple select** lets them pick several. |
| **Allow "Other" free-text answer** | Adds an "Other" option where learners type their own answer. <!-- TODO: verify: not run live. --> |
| **Options** | The choices. A new question starts with two; select **Add option** for more. |

### Open text settings

| Setting | What it does |
| --- | --- |
| **Min length**, **Max length** | The answer's length in characters. The defaults are 0 and 5000. |
| **Placeholder** | Optional hint text shown in the empty answer box. |

## Set up the form

1. In the feedback builder, select **Edit**. The **Settings** tab opens.
2. Under **Feedback form settings**, choose:
   - **Anonymous submissions**: responses aren't linked to the learner. Learners see that their response is anonymous before they start.
   - **Allow multiple submissions per learner**: learners can fill in the form more than once.
   - **Show results to learners**: learners can see the combined results. <!-- TODO: verify: learner results view not run live. -->
   - **Opens** and **Closes**: optional dates. Learners can respond only between them. **Closes** must be after **Opens**.
3. Select **Save settings**.

![The Settings tab with Anonymous submissions on, a close date, and the Publish card](/img/screens/add-feedback-form-4.png)

## Publish the form

1. On the **Settings** tab, in the **Publish** card, select **Publish form**. A form needs at least one question before you can publish it.
2. CMDX shows **Feedback form published**, and the card says the form is accepting responses.

Publishing the form also publishes it in the course. Learners see it once the course is published and they're enrolled.

## See responses and results

In the feedback builder:

- **Responses** lists each submission with the respondent, the time it was submitted and its status. For an anonymous form, the respondent shows as **Anonymous**.
- **Results** shows the combined answers: the average and spread for each rating question, the count and percentage for each option, and the text of each open answer.

![The Responses tab with one anonymous, complete response](/img/screens/add-feedback-form-5.png)

## Close the form

When you have enough responses, open the **Settings** tab and select **Close form** in the **Publish** card. The form stops accepting new responses. You can still see responses and results.

:::warning
You can't reopen a closed form.
:::

## How the form completes

A learner completes the form when they submit a response, including on an anonymous form.

## Verify

1. Sign in as a learner enrolled in the course, or ask one to check.
2. Open the course. The form appears in its section with the label **Feedback**.
3. Select **Give feedback**, answer the questions and select **Submit feedback**. CMDX shows **Thank you for your feedback!**
4. Back in the feedback builder, the header shows one more response, and it appears on the **Responses** tab.

![The learner's view of the form, showing that responses are anonymous and the Give feedback button](/img/screens/add-feedback-form-6.png)

## Troubleshooting

<!-- TODO: verify: the open/closed messages come from the backend; how the learner screen shows them wasn't run live. -->

| Symptom | Cause | Fix |
| --- | --- | --- |
| **You don't have access to this area** after **Create & edit** or **Open feedback builder** | The feedback builder opens only for administrators today. | Ask an administrator to add the questions and publish the form. |
| **Cannot publish a form without questions** | The form has no questions. | Add at least one question, then publish. |
| **close_date must be after open_date** | **Closes** is earlier than **Opens**. | Move one of the dates. |
| Learners see **Feedback form is not yet open** | The **Opens** date is in the future. | Wait, or clear or change **Opens**. |
| Learners see **Feedback form is no longer open** or **Feedback form is closed** | The **Closes** date has passed, or the form was closed. | Use a later **Closes** date for a form that's still open. A closed form can't reopen. |

## Next steps

- [Enroll learners](../enroll-learners.md)
- [Reports](../reports.md)
