---
id: release-process
title: Release process
sidebar_label: Release process
sidebar_position: 4
doc_type: how-to
audience: developers
source_prd: none
ai_drafted: true
last_verified: 2026-10-28
tags: [contributing, releases]
---

What a CMDX version and image tag mean, which tag to deploy, and how a maintainer cuts a release of `CMDxAI/cmdx-LMS`.

:::note
No version has been released yet. Until the first release, every host runs the `main` images.
:::

## Versions

CMDX has one version for the backend, the web app and the mobile apps, in the form `MAJOR.MINOR.PATCH`. A release is a git tag `vX.Y.Z` on a commit on `main`.

| Bump | When |
| --- | --- |
| MAJOR | Deploying needs a manual step beyond pulling the new images, such as a breaking `.env` or Compose change or a migration that can't run unattended. Or a public API change breaks existing clients. |
| MINOR | New features, new endpoints, or new migrations that run on start-up. |
| PATCH | Fixes only. |

A release candidate is tagged `vX.Y.Z-rc.N`, before the release itself.

## Image tags

The four images, `backend`, `celery_worker`, `celery_beat` and `frontend`, are published to `ghcr.io/cmdxai/cmdx-lms/` with these tags:

| Tag | Published | What it is |
| --- | --- | --- |
| `main` and `latest` | On every merge to `main` | The newest code |
| `sha-<short>` | On every merge to `main` | One commit |
| `X.Y.Z` | When `vX.Y.Z` is tagged | One release |
| `X.Y` | When `vX.Y.Z` is tagged | The newest patch release of `X.Y` |
| `X.Y.Z-rc.N` | When `vX.Y.Z-rc.N` is tagged | One release candidate |

A host chooses its tag with `CMDX_IMAGE_TAG` in `.env`. With Watchtower running, a host on `main` updates after every merge, a host on `X.Y` takes only patch releases, and a host on `X.Y.Z` never updates by itself.

Pin production hosts to `X.Y.Z`, or to `X.Y` to take patch releases automatically. Keep development and demo hosts on `main`.

To move a host to a release, set the tag and recreate the containers:

```bash
# In .env: CMDX_IMAGE_TAG=X.Y.Z
docker compose pull && docker compose up -d
```

:::warning
Setting the tag back to an earlier release rolls back the images, not the database. If the newer release added migrations, the older code runs against the newer schema. Check what the release changed before you roll back across it.
:::

## Cut a release

These steps are for maintainers with permission to push tags.

### Prerequisites

- Everything for the release is merged into `main`.
- The Tests, Lint and Security workflows pass on the release commit.
- The Tests workflow has been run once by hand on `main`, because Jest and pytest don't run on pushes.
- The database migrations have a single head.

### Steps

1. Open a release pull request into `main` that:
   - sets `X.Y.Z` as `version` in `frontend/package.json`, by running `npm version X.Y.Z --no-git-tag-version` in `frontend/`;
   - sets `version` in `backend/pyproject.toml`;
   - sets the `APP_VERSION` default in `backend/core/config/settings.py`;
   - moves the `[Unreleased]` entries in `CHANGELOG.md` under `## [X.Y.Z] - <YYYY-MM-DD>`, including any manual deployment steps.

   Run `./scripts/check-version.sh` to confirm the three files agree.

2. Merge the pull request.

3. Tag the merge commit and push the tag:

   ```bash
   git switch main && git pull
   git tag -a vX.Y.Z -m "vX.Y.Z"
   git push origin vX.Y.Z
   ```

   For a release candidate, use `vX.Y.Z-rc.N`. The release pull request lands before the first candidate, so the candidates and the release tag commits that already carry `X.Y.Z`.

4. Wait for the **Build and Push Docker Images** workflow. It checks that the tag is on `main` and matches the three version files, then publishes the images.

5. Create a GitHub release for the tag, with the changelog section as its notes. Mark a release candidate as a pre-release.

## Verify

- The registry shows `X.Y.Z` for all four images.
- On a staging host pinned to `X.Y.Z`, `curl -s https://<host>/health` reports `"version": "X.Y.Z"`.
- An administrator, an instructor and a learner can each sign in and open their dashboard.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| The image build fails at the version check. | The tag and the three version files disagree, or the tag isn't on `main`. | Fix the version files in a new pull request, then tag its merge commit with the next version. |
| `/health` reports an older version after an upgrade. | The host's `.env` sets `APP_VERSION`, which overrides the version in the code. | Delete `APP_VERSION` from `.env` and recreate the containers. |
