---
id: coding-standards
title: Follow the coding standards
sidebar_label: Coding standards
sidebar_position: 2
doc_type: how-to
audience: developers
source_prd: none
ai_drafted: true
last_verified: 2026-10-28
tags: [contributing]
---

Check a change against the rules CI enforces in `CMDxAI/cmdx-LMS`, and the conventions reviewers expect, before you open a pull request.

## Prerequisites

- A development environment for `CMDxAI/cmdx-LMS`, as described in **Set up a development environment** in this section.

## Steps

1. Lint and format the backend with Ruff 0.15.7, the version CI pins. From the repository root:

   ```bash
   pip install "ruff==0.15.7"
   ruff check backend/
   ruff format --check backend/
   ```

   To fix what Ruff can fix itself, run `ruff check --fix backend/` and `ruff format backend/`.

2. Follow the backend conventions:

   - Lines are at most 100 characters. Strings use double quotes.
   - Code targets Python 3.11. Add type hints to every function.
   - Imports go in three groups: standard library, third-party, then CMDX. CMDX imports start at `core`, `modules`, `plugins` or `api`, never `backend.`, because the app runs from inside `backend/`.
   - Change the database through a migration, and apply migrations with `python -m scripts.migrate`. Any `create_all()` call passes `checkfirst=True`.
   - Keep the layers apart. See [Layers](../architecture/layers.md).

3. Use the existing security helpers, never your own crypto. CMDX supports FIPS 140-3 deployments, so every hash, signature, cipher and TLS connection goes through the system OpenSSL:

   | Need | Use |
   | --- | --- |
   | Hash a password | `core.security.hashing`: `hash_password`, `verify_password` |
   | Encrypt data at rest | `core.security.encryption`: `encrypt_json`, `decrypt_json` |
   | Issue or check a JWT | `core.security.jwt` |
   | Generate a token, code, ID or salt | Python's `secrets` module |
   | Open a TLS connection | `ssl.create_default_context()`, with verification on |

   Don't use MD5, SHA-1, bcrypt, scrypt or Argon2 for anything security-related. Don't use the `random` module, `uuid1` or timestamps for values an attacker shouldn't guess. Never turn off TLS certificate checks. Don't add libraries that bring their own crypto, such as `pycryptodome`, `PyNaCl` or `bcrypt`.

4. Run the backend tests from `backend/`:

   ```bash
   python -m pytest
   ```

   Add tests for the change in the module's `tests/` folder.

5. Check the frontend. From `frontend/`, run:

   ```bash
   npx tsc --noEmit
   npm run lint
   npm run lint:a11y
   npm test -- --ci
   ```

6. Write commit messages in the form `type(scope): what is now true (#issue)`:

   ```text
   fix(plugins): unload matches the plugin's router, not a shared endpoint (#777)
   ```

   | Part | Value |
   | --- | --- |
   | `type` | `fix`, `feat`, `test`, `docs`, `refactor`, `ci`, `chore` or `perf` |
   | `scope` | The area changed, such as `auth`, `plugins` or `config` |
   | Summary | Present tense, saying what is true after the change |
   | `(#issue)` | The issue the commit fixes or belongs to |

7. Open a pull request against `main`. Say what changed, why, and how you tested it, and link the issue.

## Verify

On the pull request, the CI checks pass:

| Workflow | Checks |
| --- | --- |
| Lint | `ruff check backend/` and `ruff format --check backend/` |
| Tests | Frontend types, ESLint and accessibility lint, when the change touches the frontend |

CI doesn't run the test suites on pull requests. Jest and pytest run only when someone starts the Tests workflow by hand, and a pytest failure doesn't fail the workflow. Run both yourself before you open the pull request.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Ruff reports different problems locally than in CI | Your Ruff version differs from 0.15.7. | Install `ruff==0.15.7`. |
| `ModuleNotFoundError: No module named 'backend'` | An import starts with `backend.`. | Start it at `core`, `modules`, `plugins` or `api`. |
| `pip install` fails building `python-ldap` | The OpenLDAP or SASL development headers are missing. | Install them, as described in **Set up a development environment**. |
