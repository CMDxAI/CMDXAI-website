---
id: calendar
title: Use your calendar
sidebar_label: Calendar
sidebar_position: 5
doc_type: how-to
audience: users
source_prd: none
ai_drafted: true
last_verified: 2026-11-03
tags: [learners, calendar]
---

See your live sessions, deadlines and announcements in one place, answer invitations, and add your CMDX calendar to Google Calendar, Outlook or Apple Calendar.

## Prerequisites

- You're enrolled in at least one course. The calendar shows events for your courses and for your whole organization.
- Your organization hasn't turned the calendar off. If **Calendar** isn't in the navigation, ask your administrator. <!-- TODO: verify: navigation when the calendar flag is off was not run live. -->

## Open your calendar

Select **Calendar** in the navigation. The page opens on the current month.

The bar at the top counts the events this month, this week, your live sessions and what's due this month.

## Find an event

- Use the arrows next to the month to move back or forward, and **Today** to return to the current month.
- Choose **Month** for a grid, or **Agenda** for a list of the month's events.
- Select a day in the month grid to list its events on the right.
- Select an event type to show or hide it: **Announcement**, **Deadline**, **Live session** or **Break**.
- Use the scope list to show **All scopes**, only **Tenant-wide** events for your whole organization, or only **Course-specific** events.

![The month grid with a live session selected on November 12 and its details in the day panel](/img/screens/calendar-1.png)

Times appear in your device's time zone. An event's details also show the time zone it was created in.

### Where events come from

| Event | Where it comes from |
| --- | --- |
| **Live session**, **Announcement**, **Break** | Created by your instructors or administrators. |
| **Deadline** marked **Assignment due** | Added by CMDX from an assignment's due date. |
| **Quiz window** | Added by CMDX from a quiz's open and close dates. |
| **Course date** | Added by CMDX from a course's start and end dates. |

Items that CMDX adds from your courses are read-only. To act on them, open the assignment, quiz or course.

![The Agenda view listing an announcement, a live session, an assignment deadline and a break](/img/screens/calendar-3.png)

## See an event and answer an invitation

1. Select the eye icon next to an event, in the day panel or in **Agenda**. The event details open.
2. Read **When**, **Scope**, **Timezone** and, for a live session, the **Link** to join.
3. Under **Will you attend?**, select **Going**, **Maybe** or **Not going**.

CMDX shows your answer, for example **You answered Going**. To change it, select another choice.

![The details of a live session with the meeting link and the Will you attend? choices](/img/screens/calendar-2.png)

## Download one event

Select the download icon next to an event. CMDX downloads it as an `.ics` file that you can open in your calendar app. Items that CMDX adds from your courses don't have this icon. <!-- TODO: verify: download not run live. -->

## Subscribe from another calendar app

A subscription link keeps your calendar app up to date with the events you see in CMDX.

1. Select **Subscribe**.
2. Select **Create subscription link**.
3. Select **Copy subscription link**, and save it somewhere safe.
4. In your calendar app, add a calendar from a URL, and paste the link.

![The Subscribe to this calendar dialog with the Create subscription link button](/img/screens/calendar-4.png)

:::warning
The link is shown only once. Anyone who has it can read your calendar, so treat it like a password and don't share it.
:::

If the link you copied starts with `/api/`, add your CMDX address in front of it, for example `https://lms.example.com/api/v1/calendar/feed.ics?token=…`.

To stop a subscription, open **Subscribe** and select **Revoke** next to it. Calendar apps using that link stop updating. The list shows when you added each link and whether it has been used.

## Verify

1. Open **Calendar** and find an event from one of your courses.
2. Open it and answer **Will you attend?**. The details show your answer.
3. If you subscribed, open your calendar app after it refreshes. The same events appear there.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| An event from a course is missing | You aren't enrolled in that course, or the event type is hidden. | Check **My Learning** for the course, and turn the event type back on. |
| An event's time looks wrong | Times appear in your device's time zone. | Check your device's time zone. The event details show the time zone it was created in. |
| Your calendar app won't accept the link | The link is missing your CMDX address, or it was revoked. | Add your CMDX address in front of a link that starts with `/api/`, or create a new link. |
| **Calendar** isn't in the navigation | Your organization turned the calendar off. | Ask your administrator. |

## Next steps

- [Take a course](./take-a-course.md)
- [Your grades](./your-grades.md)
