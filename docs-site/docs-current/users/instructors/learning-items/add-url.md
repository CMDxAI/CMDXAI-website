---
id: add-url
title: Add a link to an external resource
sidebar_label: Add a link
sidebar_position: 8
doc_type: how-to
audience: users
source_prd: none
ai_drafted: true
last_verified: 2026-11-03
tags: [learning-items, links]
---

Add a link to a web page outside CMDX, such as an article or a guide, so learners can open it from the course and get credit for visiting it.

## Prerequisites

- You can edit the course, and it has at least one section. See [create a course](../create-a-course.md).
- Your role lets you create learning items. If you see **Permission denied** when you create the link, ask your administrator.
- The link starts with `http://` or `https://`.

## Create the link

1. In **My Courses**, open the course and select the **Content** tab.
2. In the section where the link belongs, select **Drag a learning item here**.
3. Under **Choose type**, select **URL Resource**.
4. Fill in the details:
   - **Title**: the name learners see.
   - **Description**: optional. Tell learners what to read and why.
   - **Section**: where the link appears. It starts as the section you chose.
   - **Link**: the full web address.
   - **Display mode**: how learners open the link. See [Display modes](#display-modes).
5. In the side panel, check **Count toward completion** and **Visible to learners**. **Visible to learners** starts on when the course is already published, and off when it's a draft.
6. Select **Create & edit**.

![The New learning item screen with URL Resource selected, a title, description, link and Display mode set to New tab](/img/screens/add-url-1.png)

CMDX shows **Item created** and returns you to the content builder. The link appears in the section with the label **URL**.

You can also drag the **URL / Link** card from the **Content library** panel onto a section. CMDX asks for the link first, then creates the item.

## Display modes

| Mode | What learners see |
| --- | --- |
| **New tab** | An **Open resource** button that opens the link in a new browser tab. |
| **Embedded (iframe)** | The web page inside the course. Many sites don't allow this. If the site refuses, learners see the **Open resource** button instead. |
| **Redirect** | An **Open resource** button that opens the link outside CMDX, like **New tab**. |

The **Open in new tab** switch is saved with the link but doesn't change anything yet. Links always open outside CMDX.

## Change the link

1. In the content builder, select the link to open it.
2. Change the title, section, description, link, display mode or **Position**.
3. Select **Save changes**.

![The link's settings with the link, display mode, position, link status and the Visited completion rule](/img/screens/add-url-2.png)

**Link status** is separate from the item's **Status**. Turn on **Archive link** to stop learners from opening the link, while the item stays in the course. <!-- TODO: verify: whether an archived link can be restored by turning the switch off. -->

## How the link completes

A link has one completion rule: **Visited**. It counts as complete for a learner when they select **Open resource**. With **Embedded (iframe)**, it counts when the embedded page loads.

## Verify

1. Sign in as a learner enrolled in the course, or ask one to check.
2. Open the course and select the link. The description and an **External resource** card with the address appear.
3. Select **Open resource**. The web page opens in a new tab, and the link shows **Completed** in the course.

![The learner's view of the link with the External resource card and the Open resource button](/img/screens/add-url-3.png)

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| **Enter a link starting with http:// or https://** | The link is missing its `http://` or `https://` part. | Enter the full address, for example `https://example.com`. |
| An embedded link shows a blank frame | The site doesn't allow other sites to embed it. | Use **New tab**, or tell learners to select **Open resource**. |
| **Permission denied** when you select **Create & edit** | Your role can't create learning items. | Ask your administrator. |
| Learners can't see the link | The item is a draft, the course isn't published, or the link is archived. | Set the item's **Status** to **Open**, publish the course, and check **Link status**. |

## Next steps

- [Create a quiz](./create-a-quiz.md)
- [Enroll learners](../enroll-learners.md)
