---
id: add-media
title: Add a video
sidebar_label: Add a video
sidebar_position: 2
doc_type: how-to
audience: users
source_prd: none
ai_drafted: true
last_verified: 2026-11-03
tags: [learning-items, video]
---

Add a video to a course section, from YouTube, Vimeo, another video site or a file you upload, and choose when it counts as complete.

## Prerequisites

- You can edit the course, and it has at least one section. See [create a course](../create-a-course.md).
- Your role lets you create learning items. If you see **Permission denied** when you create the video, ask your administrator.
- A YouTube or Vimeo link, an embed code from another video site, or a video file in MP4, WebM, MOV or MKV format.

## Create the video

1. In **My Courses**, open the course and select the **Content** tab.
2. In the section where the video belongs, select **Drag a learning item here**.
3. Under **Choose type**, select **Media**.
4. Fill in the details:
   - **Title**: the name learners see.
   - **Description**: optional. Learners see it above the video.
   - **Section**: where the video appears. It starts as the section you chose.
5. Under **Source**, choose where the video comes from:
   - **YouTube / Vimeo**: paste the video's web address, for example `https://www.youtube.com/watch?v=…`.
   - **Embed code**: paste the `<iframe>` embed code from YouTube, Vimeo or another video site.
   - **Upload file**: upload an MP4, WebM, MOV or MKV file, up to your organization's upload limit. <!-- TODO: verify: upload path not run live. -->
6. In **Completion threshold**, enter the percentage of the video a learner must watch for it to count as complete. The default is 90.
7. In the side panel, check **Count toward completion** and **Visible to learners**. **Visible to learners** starts on when the course is already published, and off when it's a draft.
8. Select **Create & edit**.

![The New learning item screen with Media selected, a title, description, a YouTube link and a completion threshold of 80](/img/screens/add-media-1.png)

CMDX shows **Item created** and returns you to the content builder.

You can also drag the **Media** card from the **Content library** panel onto a section. CMDX asks for the video link first, then creates the item.

## Choose how the video completes

1. In the content builder, select the video to open it.
2. Select the **Completion** tab.
3. Choose a rule:
   - **Watched**: the learner watches at least **Minimum %** of the video. This is the default, and the percentage starts at the completion threshold you set.
   - **Viewed**: the learner opens the video.
   - **Marked complete**: the learner marks the item complete themselves.
4. Select **Save completion rule**.

![The Completion tab with Watched selected and a minimum of 80 percent](/img/screens/add-media-2.png)

CMDX can measure how much was watched only for YouTube, Vimeo and uploaded videos. For an embed code from any other site, choose **Viewed** or **Marked complete**, or learners can't complete the video.

## Change the video

1. In the content builder, select the video to open it.
2. On the **Settings** tab, change the title, section, description or completion threshold.
3. On the **Content** tab, change the source or the link.
4. Select **Save changes**.

## Verify

1. Sign in as a learner enrolled in the course, or ask one to check.
2. Open the course and select the video. It plays inside the course, below the title and description.
3. Watch past the completion threshold. The video shows as complete in the course outline. <!-- TODO: verify: playback to the threshold was not run live. -->

![The learner's view of the video embedded in the course](/img/screens/add-media-3.png)

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| **Enter a video link or embed code — the link must start with http:// or https://** | The link or embed code doesn't contain a full web address. | Paste the full address, or the full `<iframe>` code. |
| **Upload a video file to continue.** | **Upload file** is selected, but no file was uploaded. | Upload the file, or choose another source. |
| Learners watch the whole video but it doesn't complete | The video comes from an embed code for a site CMDX can't track. | Set the completion rule to **Viewed** or **Marked complete**. |
| **Permission denied** when you select **Create & edit** | Your role can't create learning items. | Ask your administrator. |

## Next steps

- [Create a quiz](./create-a-quiz.md)
- [Enroll learners](../enroll-learners.md)
