// Captures the docs screenshots from a running CMDX demo stack.
// Usage: node scripts/screenshots.mjs [page-id ...]   (no ids = every page)
// Needs the demo data and environment variables described in scripts/README.md.
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const need = (k) => {
  const v = process.env[k];
  if (!v) throw new Error(`Set ${k}; see scripts/README.md`);
  return v;
};
const BASE = (process.env.CMDX_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
const COURSE = need('CMDX_COURSE_ID');
const USERS = {
  admin: [need('CMDX_ADMIN_EMAIL'), need('CMDX_ADMIN_PASSWORD')],
  instructor: [need('CMDX_INSTRUCTOR_EMAIL'), need('CMDX_INSTRUCTOR_PASSWORD')],
  learner: [need('CMDX_LEARNER_EMAIL'), need('CMDX_LEARNER_PASSWORD')],
};
const OUT = new URL('../static/img/screens/', import.meta.url);

const browser = await chromium.launch();
const pages = {};

// One signed-in page per role, reused across flows.
async function as(role) {
  if (pages[role]) return pages[role];
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: 'en-US',
    timezoneId: 'UTC',
  });
  await throttle();
  await page.goto(`${BASE}/login`);
  await page.getByPlaceholder('name@organization.com').fill(USERS[role][0]);
  await page.getByPlaceholder('Enter your password').fill(USERS[role][1]);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
  pages[role] = page;
  return page;
}

// Every full page load refreshes the session token, and the backend allows 10 refreshes
// a minute per client IP. ponytail: sliding window of 8 loads/minute; a full run takes a few minutes.
const loads = [];
async function throttle() {
  while (loads.length >= 8 && Date.now() - loads[0] < 60_000) {
    await new Promise((r) => setTimeout(r, 60_000 - (Date.now() - loads[0]) + 250));
    loads.shift();
  }
  loads.push(Date.now());
}

async function go(page, path) {
  await throttle();
  await page.goto(BASE + path);
  await page.waitForLoadState('networkidle');
  // Over the limit anyway (another run in the same minute): wait it out and reload.
  if (await page.getByText("Can't reach the server").isVisible()) {
    console.log('  token refresh limited; waiting a minute');
    await page.waitForTimeout(61_000);
    loads.length = 0;
    await go(page, path);
  }
}

async function shot(page, name) {
  // Embedded players never go network-idle; settle for 5 s of trying.
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(800); // toasts appear a moment after the action that caused them
  for (const b of await page.getByRole('status').or(page.getByRole('alert')).getByRole('button', { name: 'Dismiss' }).all()) {
    await b.click();
  }
  await page.waitForTimeout(500); // ponytail: let animations settle; swap for a locator wait if a shot flakes
  await page.screenshot({ path: new URL(`${name}.png`, OUT).pathname });
  console.log(`  ${name}.png`);
}

// Unlabelled inputs (React Native web): the first input after a visible label.
const after = (page, label) => page.getByText(label, { exact: true }).locator('xpath=following::input[1] | following::textarea[1]').first();

// The steps every how-to starts with: open the builder, add an item to the first section, pick its type.
async function newItem(page, type) {
  await go(page, `/teacher/courses/${COURSE}/builder`);
  await page.getByRole('button', { name: 'Add a learning item' }).first().click();
  await page.getByRole('button', { name: type, exact: true }).click();
}

// "Create & edit" and "Save changes" return to the builder; open the item again from there.
async function create(page, title, button = 'Create & edit') {
  await page.getByRole('button', { name: button }).click();
  await page.waitForURL(/\/builder$/);
  await page.getByText(title, { exact: true }).last().click();
  await page.waitForURL(/\/item\/|[?&]id=/);
  await page.waitForLoadState('networkidle');
}

// The learner side of each Verify section: open the course and select the item.
// ponytail: picks the newest item with this title; run on a fresh demo stack so titles are unique.
async function asLearnerOpen(title) {
  const l = await as('learner');
  await go(l, `/learner/courses/${COURSE}/learn`);
  await l.getByRole('button', { name: title, exact: true }).last().click();
  await l.waitForLoadState('networkidle');
  return l;
}

const flows = {
  'add-assignment': async () => {
    const p = await as('instructor');
    await go(p, `/teacher/courses/${COURSE}/builder`);
    await shot(p, 'add-assignment-1');
    await newItem(p, 'Assignment');
    await p.getByPlaceholder('Item title').fill('Rewrite a long email');
    await p.getByPlaceholder('Describe what learners need to submit…').fill(
      'Rewrite the attached 400-word email in under 150 words. Keep every request and deadline.',
    );
    await p.getByRole('button', { name: 'Text entry' }).click();
    await shot(p, 'add-assignment-2');
    await create(p, 'Rewrite a long email');
    await p.getByRole('button', { name: /^Grading & deadline/ }).click();
    await p.getByPlaceholder('100').last().fill('50');
    await p.getByPlaceholder('Unlimited').fill('3');
    await p.getByRole('textbox', { name: 'Due date' }).fill('2026-11-20');
    await p.getByRole('button', { name: 'Block after due date' }).click();
    await p.getByRole('button', { name: /^Grading & deadline/ }).scrollIntoViewIfNeeded();
    await shot(p, 'add-assignment-3');
    await create(p, 'Rewrite a long email', 'Save changes');
    await p.getByRole('tab', { name: 'Rubric' }).click();
    for (const [n, label] of [[0, 'Clarity and length'], [1, 'Keeps every request and deadline']]) {
      await p.getByRole('button', { name: 'Add criterion' }).click();
      await p.getByRole('textbox', { name: 'Criterion label' }).nth(n).fill(label);
      await p.getByRole('textbox', { name: 'Points' }).nth(n).fill('25');
    }
    await shot(p, 'add-assignment-4');
    await create(p, 'Rewrite a long email', 'Save changes');
    await p.getByRole('button', { name: 'Status' }).click();
    await p.getByRole('option', { name: 'Open' }).click();
    await shot(p, 'add-assignment-5');
    await p.getByRole('button', { name: 'Save changes' }).click();
    await p.waitForURL(/\/builder$/);
  },

  'add-feedback-form': async () => {
    const p = await as('instructor');
    await newItem(p, 'Feedback');
    await p.getByPlaceholder('Item title').fill('Course feedback: Week 1');
    await p.getByPlaceholder('Optional description').fill('Tell us what helped and what to improve. It takes two minutes.');
    await shot(p, 'add-feedback-form-1');
    await p.getByRole('button', { name: 'Create & edit' }).click();
    await p.waitForURL(/\/admin\/items\/feedback\?id=/);
    // The feedback builder opens only for administrators today; the page's :::note says so.
    const a = await as('admin');
    await go(a, new URL(p.url()).pathname + new URL(p.url()).search);
    await a.getByRole('button', { name: 'Add', exact: true }).click();
    await a.getByRole('button', { name: 'Add a Rating question' }).click();
    await a.getByPlaceholder('Question text').fill('How useful was this week?');
    await after(a, 'Low label').fill('Not useful');
    await after(a, 'High label').fill('Very useful');
    await shot(a, 'add-feedback-form-2');
    await a.getByRole('button', { name: 'Save question' }).click();
    await a.getByRole('button', { name: 'Add', exact: true }).click();
    await a.getByRole('button', { name: 'Add a Multiple choice question' }).click();
    await a.getByPlaceholder('Question text').fill('Which part helped most?');
    await a.getByPlaceholder('Option 1').fill('The examples');
    await a.getByPlaceholder('Option 2').fill('The practice tasks');
    await a.getByRole('button', { name: 'Save question' }).click();
    await a.getByRole('button', { name: 'Add', exact: true }).click();
    await a.getByRole('button', { name: 'Add a Open text question' }).click();
    await a.getByPlaceholder('Question text').fill('What should we change?');
    await a.getByRole('button', { name: 'Save question' }).click();
    await shot(a, 'add-feedback-form-3');
    await a.getByRole('button', { name: 'Edit' }).click();
    await a.getByRole('switch').first().click(); // Anonymous submissions
    await a.getByRole('textbox', { name: 'Closes' }).fill('2026-11-30');
    await a.getByRole('button', { name: 'Save settings' }).click();
    await shot(a, 'add-feedback-form-4');
    await a.getByRole('button', { name: 'Publish form' }).click();
    await a.getByRole('button', { name: 'Close form' }).waitFor();
    const formUrl = a.url();

    const l = await as('learner');
    await go(l, `/learner/courses/${COURSE}/learn`);
    await l.getByRole('button', { name: 'Course feedback: Week 1', exact: true }).last().click();
    await shot(l, 'add-feedback-form-6');
    await l.getByRole('button', { name: 'Give feedback' }).click();
    await l.getByRole('radio', { name: /^Rate 4 out of 5/ }).click();
    await l.getByRole('button', { name: 'Next' }).click();
    await l.getByText('The examples', { exact: true }).click();
    await l.getByRole('button', { name: 'Next' }).click();
    await l.getByRole('textbox').fill('More examples of short status updates, please.');
    await l.getByRole('button', { name: 'Submit feedback' }).click();
    await l.getByText('Thank you for your feedback!').waitFor();

    await go(a, new URL(formUrl).pathname + new URL(formUrl).search);
    await a.getByRole('tab', { name: 'Responses' }).click();
    await shot(a, 'add-feedback-form-5');
  },

  'add-html-page': async () => {
    const p = await as('instructor');
    await newItem(p, 'HTML Page');
    await p.getByPlaceholder('Page title').fill('Subject lines that get read');
    await p.getByPlaceholder('Summary').fill('Five rules for subject lines, with examples.');
    await p.getByPlaceholder(/^<h1>Welcome/).fill(
      '<h2>Write the subject line last</h2>\n<p>Once the email is written, you know what it asks for.</p>\n' +
        '<ol>\n  <li>Put the request first.</li>\n  <li>Add a date if there is one.</li>\n  <li>Keep it under eight words.</li>\n</ol>',
    );
    await shot(p, 'add-html-page-1');
    await p.getByRole('button', { name: 'Preview', exact: true }).click();
    await shot(p, 'add-html-page-2');
    await create(p, 'Subject lines that get read');
    const l = await asLearnerOpen('Subject lines that get read');
    await l.getByText('Completed').first().waitFor();
    await shot(l, 'add-html-page-3');
  },

  'add-url': async () => {
    const p = await as('instructor');
    await newItem(p, 'URL Resource');
    await p.getByPlaceholder('Item title').fill('Plain language guidelines');
    await p.getByPlaceholder('Optional description').fill('Read the sections on short sentences and active voice.');
    await p.getByPlaceholder('https://example.com').fill('https://www.plainlanguage.gov/guidelines/');
    await shot(p, 'add-url-1');
    await create(p, 'Plain language guidelines');
    await p.getByRole('radio', { name: /^Visited/ }).scrollIntoViewIfNeeded();
    await shot(p, 'add-url-2');
    const l = await asLearnerOpen('Plain language guidelines');
    await shot(l, 'add-url-3');
  },

  'add-media': async () => {
    const p = await as('instructor');
    await newItem(p, 'Media');
    await p.getByPlaceholder('Item title').fill('Writing subject lines that get read');
    await p.getByPlaceholder('Optional description').fill('A short walkthrough. Watch it before the email assignment.');
    await p.getByRole('button', { name: 'YouTube / Vimeo' }).click();
    await p.getByPlaceholder('https://www.youtube.com/watch?v=…').fill('https://www.youtube.com/watch?v=aqz-KE-bpKQ');
    await p.getByPlaceholder('90').fill('80');
    await shot(p, 'add-media-1');
    await create(p, 'Writing subject lines that get read');
    await p.getByRole('tab', { name: 'Completion' }).click();
    await p.getByRole('radio', { name: /^Watched/ }).click();
    await shot(p, 'add-media-2');
    const l = await asLearnerOpen('Writing subject lines that get read');
    await l.frameLocator('iframe[src*="youtube"]').getByText('Watch on').waitFor(); // player loaded
    await shot(l, 'add-media-3');
  },

  'add-training': async () => {
    const p = await as('instructor');
    await newItem(p, 'Training');
    await p.getByPlaceholder('Item title').fill('Live workshop: writing for busy readers');
    await p.getByPlaceholder('Optional description').fill('A one-hour online workshop. Bring one email you want feedback on.');
    await p.getByPlaceholder('30').fill('20');
    await shot(p, 'add-training-1');
    await create(p, 'Live workshop: writing for busy readers');
    // The training editor opens only for administrators today; the page's :::note says so.
    const a = await as('admin');
    await go(a, new URL(p.url()).pathname + new URL(p.url()).search);
    await a.getByRole('tab', { name: 'Sessions' }).click();
    await a.getByRole('button', { name: 'Add session' }).first().click();
    const d = a.getByRole('dialog', { name: 'Add session' });
    await d.getByPlaceholder('e.g. Kickoff workshop').fill('Writing for busy readers');
    await d.getByRole('textbox', { name: 'Date' }).fill('2026-11-19');
    for (const [which, hour, n] of [['Start', '3', 0], ['End', '4', 1]]) {
      await d.getByRole('button', { name: `${which} time hour` }).click();
      await a.getByRole('option', { name: hour, exact: true }).click();
      await d.getByRole('button', { name: `${which} time minute` }).click();
      await a.getByRole('option').first().click(); // :00
      await d.getByRole('button', { name: 'PM' }).nth(n).click();
    }
    await d.getByPlaceholder('https://…').fill('https://zoom.us/j/1234567890');
    await d.getByRole('button', { name: 'Add session' }).click();
    await d.waitFor({ state: 'hidden' });
    await shot(a, 'add-training-2');
    await a.getByRole('tab', { name: 'Enrollments' }).click();
    await a.getByRole('button', { name: 'Enroll learners' }).first().click();
    const e = a.getByRole('dialog', { name: 'Enroll learners' });
    await e.getByRole('checkbox', { name: USERS.learner[0] }).click();
    await e.getByRole('button', { name: 'Enroll' }).click();
    await e.waitFor({ state: 'hidden' });
    await a.getByRole('tab', { name: 'Sessions' }).click();
    await a.getByRole('button', { name: 'Start session' }).first().click();
    await a.getByText('Session started.').waitFor();
    await go(a, new URL(a.url()).pathname + new URL(a.url()).search); // reload so the sheet sees the started session
    await a.getByRole('tab', { name: 'Attendance' }).click();
    await a.getByRole('button', { name: /, session 1: not marked$/ }).click(); // one click marks P
    await a.getByRole('button', { name: 'Save attendance' }).click();
    await a.getByRole('button', { name: 'Save attendance' }).and(a.locator('[aria-disabled="true"], [disabled]')).waitFor();
    await shot(a, 'add-training-3');
    await a.getByRole('tab', { name: 'Completion' }).click();
    await a.getByRole('switch', { name: 'Attend sessions' }).click();
    await after(a, 'Min. % of sessions').fill('100');
    await shot(a, 'add-training-4');
    await a.getByRole('button', { name: 'Save criteria' }).click();
    await a.waitForLoadState('networkidle');

    const l = await asLearnerOpen('Live workshop: writing for busy readers');
    await shot(l, 'add-training-5');
  },

  calendar: async () => {
    const l = await as('learner');
    await go(l, '/learner/calendar');
    const live = 'Live Q&A: writing for busy readers'; // demo data, see README
    await l.getByRole('button', { name: /^\w+ \d+, \d{4}, \d+ events?$/ }).filter({ hasText: live }).click();
    await shot(l, 'calendar-1');
    await l.getByLabel(`View ${live}`).click();
    await l.getByRole('button', { name: 'Going', exact: true }).click();
    await l.getByText('You answered Going').waitFor();
    await shot(l, 'calendar-2');
    await l.getByRole('button', { name: 'Close', exact: true }).last().click();
    await l.getByRole('button', { name: 'Agenda' }).click();
    await shot(l, 'calendar-3');
    await l.getByRole('button', { name: 'Subscribe' }).click();
    await l.getByRole('button', { name: 'Create subscription link' }).waitFor();
    await shot(l, 'calendar-4');
  },
};

await mkdir(OUT, { recursive: true });
const wanted = process.argv.slice(2);
for (const id of wanted.length ? wanted : Object.keys(flows)) {
  if (!flows[id]) throw new Error(`Unknown page id ${id}. Known: ${Object.keys(flows).join(', ')}`);
  console.log(id);
  try {
    await flows[id]();
  } catch (err) {
    // Leave the failing screen behind for debugging; it's outside static/ so it never ships.
    for (const [role, page] of Object.entries(pages)) {
      await page.screenshot({ path: `screenshot-failure-${role}.png` });
      console.error(`${role} was on ${page.url()}`);
    }
    await browser.close();
    throw err;
  }
}
await browser.close();
