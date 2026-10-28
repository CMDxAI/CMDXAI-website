---
id: docs-contribution
title: Contribute to the docs
sidebar_label: Docs contribution
sidebar_position: 3
doc_type: how-to
audience: developers
source_prd: none
ai_drafted: true
last_verified: 2026-10-28
tags: [contributing]
---

Write or fix a page on this site, check it locally, and send it for review. The site's source is in the public [CMDxAI/CMDXAI-website](https://github.com/CMDxAI/CMDXAI-website) repository, in the `docs-site` folder.

For a small fix, select **Edit this page** at the bottom of any page. GitHub opens the file, and you can propose the change from there. For anything larger, follow the steps below.

## Prerequisites

- A GitHub account.
- Git.
- Node.js 20 or later, with npm.

## Steps

1. Fork the repository on GitHub, clone your fork, and create a branch from `main`:

   ```bash
   git clone https://github.com/<your-account>/CMDXAI-website.git
   cd CMDXAI-website
   git switch -c docs/<short-name>
   ```

2. Install the site's dependencies and start it:

   ```bash
   cd docs-site
   npm ci
   npm start
   ```

   The site opens at `http://localhost:3000/docs/` and reloads when you save a file.

3. Put the page in the folder for its readers:

   | Readers | Folder in `docs-site/` |
   | --- | --- |
   | Developers | `docs/developers/` |
   | Administrators | `docs/administrators/` |
   | Anyone new to CMDX | `docs-current/getting-started/` |
   | Instructors | `docs-current/users/instructors/` |
   | Learners | `docs-current/users/learners/` |

   The sidebar is built from the folders. In a new folder, add a `_category_.json` to set its sidebar `label` and `position`.

4. Pick one page type and keep to it:

   | Type | Answers | Shape |
   | --- | --- | --- |
   | `tutorial` | "Teach me, step by step." | One path to one result, with no choices. |
   | `how-to` | "How do I do this?" | Prerequisites, numbered steps, a Verify section and, when a failure is known, Troubleshooting. |
   | `reference` | "What exactly is this?" | Tables, fields, defaults and signatures. No story. |
   | `explanation` | "Why is it like this?" | Background, design and trade-offs. |

   If a page needs two types, write two pages and link them.

5. Start the file with this front matter:

   ```yaml
   ---
   id: enable-sso
   title: Enable SSO for a tenant
   sidebar_label: Enable SSO
   sidebar_position: 2
   doc_type: how-to
   audience: administrators
   source_prd: none
   ai_drafted: false
   tags: [sso, tenants]
   ---
   ```

   | Field | Value |
   | --- | --- |
   | `id` | Lowercase words joined by hyphens, unique in the folder. |
   | `title` | Sentence case. |
   | `sidebar_label` | A short form of the title. |
   | `sidebar_position` | The page's place in its folder. |
   | `doc_type` | `tutorial`, `how-to`, `reference` or `explanation`. |
   | `audience` | `developers`, `administrators`, `users` or `all`. |
   | `source_prd` | `none`, unless a maintainer gives you a reference. |
   | `ai_drafted` | `true` if an AI tool wrote the draft. A person who reviews and edits the page sets it to `false`. |
   | `tags` | A few lowercase words. |

6. Write the page:

   - Address the reader as "you", in the present tense.
   - Keep sentences short, with one idea each.
   - Write headings in sentence case, and use only `##` and `###`.
   - Put UI labels in bold, such as **Save**. Put code, paths, keys and values in backticks. Write placeholders as `<tenant-id>`.
   - Use the terms in the [glossary](/getting-started/glossary): "learner", not "student"; "instructor", not "teacher"; "learning item", not "activity".
   - Link to other pages with relative paths to their `.md` files, such as `../architecture/plugin-system.md`.
   - Check every fact about the product against its code or ask a maintainer. Don't guess a default or a permission name.
   - Don't name other learning management systems. Write "your previous LMS".
   - Never include passwords, tokens, keys or other secrets, even as examples.

7. From the repository root, run the same checks as CI:

   ```bash
   npm ci
   npm run check
   cd docs-site
   npm run typecheck
   npm run build
   ```

   `npm run build` fails if any link points to a page or file that doesn't exist.

8. Commit, push your branch, and open a pull request against `main`. In the description, say what the page covers and how you checked its facts.

## Verify

- The page appears in the right sidebar at `http://localhost:3000/docs/` and its links work.
- On the pull request, the CI checks pass: `npm run check` at the root, and `npm run typecheck` and `npm run build` in `docs-site`.

A maintainer reviews the pull request and merges it. The site is published when `main` changes.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `Docusaurus found broken links!` | A link points to a page or file that doesn't exist, or to a page by its URL instead of its file. | Link to the `.md` file with a relative path, and check the target exists on your branch. |
| The page isn't in the sidebar. | It's outside the folders in step 3. | Move it into one of them. |
