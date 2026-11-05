---
id: add-html-page
title: Add an HTML page
sidebar_label: Add an HTML page
sidebar_position: 7
doc_type: how-to
audience: users
source_prd: none
ai_drafted: true
last_verified: 2026-11-03
tags: [learning-items, html-pages]
---

Add a reading page to a course section, written in HTML, that learners open in the course.

## Prerequisites

- You can edit the course, and it has at least one section. See [create a course](../create-a-course.md).
- Your role lets you create learning items. If you see **Permission denied** when you create the page, ask your administrator.
- You can write basic HTML, such as headings, paragraphs and lists.

:::note
Today the page editor that opens after you create a page is available only to administrators. Write the full content when you create the page, or ask an administrator to make later changes.
:::

## Create the page

1. In **My Courses**, open the course and select the **Content** tab.
2. In the section where the page belongs, select **Drag a learning item here**.
3. Under **Choose type**, select **HTML Page**.
4. Fill in the details:
   - **Section**: where the page appears. It starts as the section you chose.
   - **Title**: the name learners see.
   - **Summary**: optional. A short description shown in listings and above the page.
   - **Display mode**: **Inline** shows the page inside the course. <!-- TODO: verify: what New tab does for learners; only Inline was run live. -->
   - **Content**: the page itself, in HTML. Type it on the **Source** tab.

   ![The New learning item screen with HTML Page selected, a title, summary and HTML in the Source tab](/img/screens/add-html-page-1.png)

5. Select **Preview** to check how the content looks.

   ![The Preview tab showing the formatted heading, paragraph and numbered list](/img/screens/add-html-page-2.png)

6. In the side panel, check **Count toward completion** and **Visible to learners**:
   - **Visible to learners** starts on when the course is already published, and off when it's a draft.
   - When it's on, learners see the page as soon as you create it. When it's off, the page is saved as a draft.
7. Select **Create & edit**.

CMDX shows **Item created** and returns you to the content builder. The page appears in the section with the label **HTML Page**.

## What HTML you can use

CMDX cleans the HTML when you save, and removes anything not on this list:

- Headings (`h1` to `h6`), paragraphs, line breaks and horizontal rules.
- Text formatting: `strong`, `em`, `u`, `s`, `code`, `pre` and `blockquote`.
- Lists: `ul`, `ol` and `li`.
- Tables: `table`, `thead`, `tbody`, `tr`, `th`, `td` and `caption`.
- Links (`a`), images (`img`), and `div` and `span` for layout.
- Video embeds in an `iframe` from YouTube, Vimeo or Loom only.
- CSS in `style` attributes and `<style>` elements. Rules that load files, such as `url()` or `@import`, are removed.

Scripts, forms, form fields, `object` and `embed` are always removed.

## Change a published page

An administrator makes these changes in the page editor. Open it from the page in the content builder.

1. Select **Edit**. CMDX starts a new draft version of the page, for example **v2**.
2. Change the title, summary, display mode or content.
3. Select **Save**. The draft is saved, but learners don't see it yet.
4. Select **Publish** in **Page settings**. The new version replaces the old one for learners.

While a draft is open, learners keep seeing the last published version.

To see earlier versions, open the **History** tab. Each published version is listed with its date and who published it. The one learners see is marked **Current**.

## Archive a page

To retire a page, select **Archive** in **Page settings**. Learners can no longer open it.

:::warning
You can't undo archiving. To use the content again, create a new page.
:::

## How the page completes

A learner completes the page the first time they open it. The **Completions** tab in the page editor shows how many learners have viewed it.

## Verify

1. Sign in as a learner enrolled in the course, or ask one to check.
2. Open the course and select the page. The content appears below the title and summary, and the page shows **Completed**.

![The learner's view of the page, with the content and Completed shown](/img/screens/add-html-page-3.png)

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| **Permission denied** when you select **Create & edit** | Your role can't create learning items. | Ask your administrator. |
| **You don't have access to this area** when you open the page | The page editor is available only to administrators today. | Ask an administrator to make the change. |
| Part of the content is missing after you save | It used HTML that CMDX removes, such as a script, a form, or an embed from another site. | Use the [allowed HTML](#what-html-you-can-use), and embed videos from YouTube, Vimeo or Loom. |
| Learners can't see the page | **Visible to learners** was off, so the page is a draft, or the course isn't published. | Ask an administrator to publish the page, and publish the course. |

## Next steps

- [Create a quiz](./create-a-quiz.md)
- [Enroll learners](../enroll-learners.md)
