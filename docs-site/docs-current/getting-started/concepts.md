---
id: concepts
title: How CMDX organizes learning
sidebar_label: Concepts
sidebar_position: 2
doc_type: explanation
audience: all
source_prd: 112820225
ai_drafted: true
tags: [getting-started]
---

CMDX is built on five ideas:

- a **tenant** holds everything;
- **courses** give learning a structure;
- **learning items** hold the content;
- **categories** sort courses and learning items so people can find and manage them;
- **enrollments** give learners access.

One idea sets CMDX apart: content isn't copied into courses. You create a learning item once, then place it in every course that needs it.

## Everything lives in a tenant

```mermaid
flowchart LR
  accTitle: What a tenant contains
  accDescr: A tenant contains people, categories, learning items and courses. Categories sort both courses and learning items. Learning items are placed in courses. Learners enroll in courses.

  subgraph tenant[Tenant]
    direction LR
    categories["Categories<br/>sort courses and items"]
    items["Learning items<br/>videos, quizzes, SCORM packages, files"]
    courses["Courses<br/>divided into sections"]
    people["People<br/>learners, instructors, administrators"]
    categories -- sort --> items
    categories -- sort --> courses
    items -- placed in --> courses
    people -- learners enroll in --> courses
  end
```

A tenant is your own space in CMDX, set up for one company, school or team. Each tenant's people, courses and content are kept apart from every other tenant's.

- **People.** People join a tenant as members, and each member has a role there, such as learner, instructor or administrator. Members can be grouped into departments. A person can belong to more than one tenant, with a different role in each.
- **Categories.** A category works like a folder for courses and learning items, and categories can contain other categories. A category covers the whole tenant, or only the departments you choose. A sub-category takes its parent's departments unless you narrow them.
- **Courses.** Each course has one main category and can be added to others. Sections divide a course into parts. A section can contain other sections, up to three levels deep.
- **Learning items.** Videos, quizzes, SCORM packages, files and assignments. They belong to the tenant, not to a course, and can be in any number of categories.

## Content is placed, not copied

Say you build a fire safety quiz. New starters must take it in order as part of their induction. In the annual refresher it's optional. You don't make two quizzes. You place the same quiz in both courses, with different settings:

```mermaid
flowchart LR
  accTitle: One learning item in two courses
  accDescr: A fire safety quiz is placed in two courses. In the new starter induction course the placement makes it required and taken in order. In the annual refresher course the placement makes it optional and available in any order.

  quiz["Fire safety quiz<br/>one learning item"]
  subgraph induction[Course: New starter induction]
    p1["Placement<br/>required, in order"]
  end
  subgraph refresher[Course: Annual refresher]
    p2["Placement<br/>optional, any order"]
  end
  quiz --> p1
  quiz --> p2
```

A **placement** puts one learning item into one course or section. The item keeps the content. The placement keeps the settings that belong to that course:

- where the item appears in the course;
- whether learners must complete it;
- whether learners must take it in order, or can take it at any time. If the placement doesn't say, it follows the section, then the course;
- how much it counts toward the course grade;
- optionally, its own completion rule, such as a higher pass mark for this course.

An item can be placed in many courses, but only once in the same course or section.

## Categories and placements do different jobs

Both link a learning item to something else, so they're easy to mix up. A category says what the item is about. A placement says where learners take it.

| | Category | Placement |
| --- | --- | --- |
| Links | a course or learning item to a category | a learning item to a course or section |
| Used for | finding, grouping and managing content | taking the item as part of a course |
| How many | any number per item; a course has one main category | one per course or section |
| Changes for learners | how content is grouped when they browse | order, whether it's required, grading and completion |

Items placed in a course are listed under that course's category too, so you don't have to add them to it one by one. Roles given on a category normally apply to every course in it, including courses added to it as an extra category.

## Enrollment gives access

Learners enroll in a course, and that gives them access to the items placed in it.

A learning item doesn't have to be in a course. A **standalone** item has no placement, and learners enroll in the item itself. If you later place it in a course, the progress learners already made carries over.

## Progress is kept per course

CMDX tracks each learner's progress separately for every placement. A new starter who passes the fire safety quiz in the induction course hasn't completed it in the refresher yet.

There's one exception. For videos and other media, CMDX also records how much of the item each learner has watched. That record is called **mastery**. It belongs to the item, so it counts in every course the item is in.

## What this means in practice

- **Edit once, change everywhere.** A change to a learning item shows in every course that uses it. To change it for one course only, create a separate item.
- **Check the placement first.** When an item behaves differently in two courses, the difference is in the placement settings.
- **A course's category affects who manages it.** Roles given on a category apply to the courses in it, so moving a course to another category changes which roles apply.
- **Removing isn't deleting.** Removing an item from a course deletes the placement only. The item and its other placements stay.

For short definitions of these terms, see the [glossary](./glossary.md).
