---
id: quiz
title: Quiz learning items
sidebar_label: Quiz
sidebar_position: 4
doc_type: explanation
audience: developers
source_prd: "151355393"
ai_drafted: true
last_verified: 2026-10-28
tags: [examples, learning-items, quizzes]
---

A quiz learning item asks questions, scores the answers, and passes the learner at a pass mark. It is a built-in type, `kind: "quiz"`, provided by the `quizzes` module through the [learning item contract](../learning-item-contract.md).

## How scoring works

Each question has a type, and each type has a grader. A grader takes a question and an answer and returns the points awarded, or says the answer needs grading by hand. Before a quiz is published, each grader also checks its questions are complete.

Graders fall into six families:

| Family | Question types |
| --- | --- |
| Choice | `single_choice`, `true_false`, `multi_choice` |
| Free text | `short_answer`, `subjective`, `numeric` |
| Sequence | `matching`, `ordering` |
| Slots | `drag_into_text`, `select_missing_words` |
| Image | `drag_onto_image` |
| Markers | `drag_markers` |

`description` is a 13th type that only shows text and scores nothing.

- `multi_choice` can score all-or-nothing, partially, or partially with deductions for wrong choices.
- `subjective` is always graded by hand. `short_answer` is graded by hand when it has no accepted answers.
- A question's type-specific settings and a learner's structured answers are stored as JSON.

## Quiz settings

| Setting | Default | Meaning |
| --- | --- | --- |
| `passing_score_pct` | `60` | The score, as a percentage, that passes an attempt. |
| `max_attempts` | Unlimited | How many attempts a learner may submit. |
| `scoring_method` | `best_score` | Which attempt counts: `best_score`, `first_score`, `latest_score`, `lowest_score` or `average_score`. |
| `time_limit_minutes`, `time_limit_seconds` | None | A time limit. Seconds wins when both are set. |
| `available_from`, `available_until` | None | When learners can start. |
| `shuffle_questions`, `shuffle_options` | `false` | Shuffle per attempt. |
| `review_mode` | `immediate` | When learners see their results: `immediate`, `after_close` or `never`. |
| `allow_revision` | `false` | Whether a returned attempt can be revised. |

The learning item's `grade_strategy` sets `scoring_method` when the quiz is created: `highest` to `best_score`, `first` to `first_score`, `last` to `latest_score`, `lowest` to `lowest_score` and `average` to `average_score`. Changing `scoring_method` after attempts have been scored needs `confirm_retroactive_scoring_change: true`.

The quiz has its own `draft`, `published` and `archived` status. Publishing the learning item doesn't publish the quiz.

## Attempts

1. **Start.** `POST .../quizzes/{id}/attempts` starts an attempt. The quiz must be published and open, the learner must have access, have no attempt in progress, and have attempts left.
2. **Answer.** `POST .../quizzes/{id}/attempts/{attempt_id}/answers` saves one answer at a time.
3. **Submit.** `POST .../quizzes/{id}/attempts/{attempt_id}/submit` grades the attempt.
   - If every answer can be scored automatically, the attempt becomes `graded`, with its score as a percentage, and passes when the score reaches `passing_score_pct`.
   - If any answer needs grading by hand, the attempt becomes `submitted` and waits.
4. **Time runs out.** The attempt's deadline is the earlier of its time limit and `available_until`. An attempt past its deadline is submitted the next time it's used, or by a background job every 5 minutes.
5. **Grade by hand.** A grader saves a draft or finalizes with `POST .../quizzes/{id}/attempts/{attempt_id}/grade`. Finalizing makes the attempt `graded`. Each re-grade is kept in the attempt's grade history.

Attempt statuses: `in_progress`, `submitted`, `graded` and `returned`.

## Completion and grades

The only completion criterion a quiz accepts is `score_gte`. The default criterion uses the learning item's `pass_mark_pct`, or else the quiz's `passing_score_pct`. A quiz also needs a passing attempt to be complete, so no criterion can complete it without a pass.

When an attempt is graded, CMDX updates the learner's grade and then their progress. It also fires the `attempt.submitted` and `submission.graded` events.

A quiz can't be published when a question fails its grader's checks, a background image is missing, a rubric's total doesn't match its question's points, or the quiz is worth 0 points.

## Endpoints

Paths are under `/api/v1/learning-items-api/quizzes`. To create or delete a quiz, create or delete its learning item.

| Method and path | Needs |
| --- | --- |
| `PATCH /{id}`; `GET /{id}/preview`, `/validate` | `quiz:author` |
| `GET`, `POST /{id}/questions`; `POST /{id}/questions/reorder`; `PATCH`, `DELETE /{id}/questions/{qid}` | `quiz:author` |
| `GET`, `PUT /{id}/questions/{qid}/rubric` | `quiz:author` |
| `POST /{id}/attempts`; `POST /{id}/attempts/{aid}/answers`, `/submit` | `quiz:attempt` |
| `GET /{id}/attempts/me`, `/scores/me`; `GET /{id}/attempts/{aid}/play` | `quiz:attempt` |
| `GET /{id}/attempts/{aid}`, `/result` | The attempt's owner, or `quiz:review_others` |
| `GET /{id}/attempts`, `/stats` | `quiz:review_others` |
| `GET /grading/queue`; `POST /{id}/attempts/{aid}/grade`, `/return`; `GET /{id}/attempts/{aid}/grade-history` | `quiz:grade` |

Answer saving and file uploads are limited to 5 requests a second. An answer file can be up to 10 MB, and a text answer up to 20,000 characters.

## Related

- [Learning item contract](../learning-item-contract.md)
- [Grades data model](../../data-model/grades.md)
