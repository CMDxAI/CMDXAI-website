# Docs screenshots

`screenshots.mjs` signs in to a running CMDX stack with Playwright, walks through the steps of each how-to page, and saves the screens to `static/img/screens/<page-id>-<n>.png` at 1440 × 900. Rerun it after a release to keep the screenshots current.

It runs on your machine for now. It isn't wired into CI.

## Before you run it

Start with a fresh stack: CMDX installed with the install wizard, with nothing else added except the demo data below. The script creates its own learning items and picks them by title, so leftovers from an earlier run end up in the screenshots.

The demo data:

- One tenant with three users: a tenant administrator, an instructor and a learner. The instructor's role needs the `learning_item:create` capability.
- A published course that the instructor teaches and the learner is enrolled in. It has two sections, **Week 1: Clear, concise emails** and **Week 2: Reports and proposals**.
- The calendar turned on for the tenant, with these events in the current month:
  - a live session for the course, titled **Live Q&A: writing for busy readers**, with a meeting link;
  - a tenant-wide announcement;
  - a break;
  - an assignment in the course with a due date.

## Run it

Install the browser once:

```bash
npx playwright install chromium
```

Set the environment variables, then run the script from `docs-site/`:

```bash
export CMDX_URL=http://127.0.0.1:8080   # the frontend; this is the default
export CMDX_COURSE_ID=<course id>
export CMDX_ADMIN_EMAIL=… CMDX_ADMIN_PASSWORD=…
export CMDX_INSTRUCTOR_EMAIL=… CMDX_INSTRUCTOR_PASSWORD=…
export CMDX_LEARNER_EMAIL=… CMDX_LEARNER_PASSWORD=…

npm run screenshots                     # every page
npm run screenshots -- add-url calendar # only these pages
```

The page ids are `add-assignment`, `add-feedback-form`, `add-html-page`, `add-url`, `add-media`, `add-training` and `calendar`.

A full run takes a few minutes. The backend limits how often a session can be refreshed, so the script spaces out page loads, and waits a minute if it hits the limit anyway.

If a step fails, the script saves what each signed-in user was looking at as `screenshot-failure-<role>.png` in `docs-site/`. Those files are ignored by git.

## Add a page

Add a flow to `flows` in `screenshots.mjs`, named after the page id. Follow the page's own steps, and find elements by the labels the page tells readers to select, so a renamed button breaks the script as well as the page. Call `shot(page, '<page-id>-<n>')` where the page shows a screenshot.
