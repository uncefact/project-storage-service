---
sidebar_position: 2
title: Release Process
---

This page describes the branching model, versioning scheme, and step-by-step release workflow for the Storage Service. The repository follows trunk-based development on `main`; releases are cut by tagging from `main`.

## Branching

There is one long-lived branch: `main`. Feature branches use `<conventional-type>/<short-kebab-case-description>` and merge to `main` via pull request. There are no `next`, `release/*`, or `hotfix/*` branches.

| Branch      | Purpose                                                            |
| ----------- | ------------------------------------------------------------------ |
| `main`      | The trunk. Always reflects the latest agreed state of the project. |
| `type/slug` | Short-lived feature branches; merged to `main` via PR.             |

## Version Files

The project maintains version information in three files:

- **`version.json`** -- Contains `version`, `apiVersion`, and `docVersion` fields:

```json
{
    "version": "MAJOR.MINOR.PATCH",
    "apiVersion": "MAJOR.MINOR",
    "docVersion": "MAJOR.MINOR.PATCH",
    "dependencies": {}
}
```

The `apiVersion` documents the API contract version as `MAJOR.MINOR`. It is kept in lockstep with the URL path segment (`/api/v<MAJOR>`, derived from the routes directory under `src/routes/v<MAJOR>/`): the MAJOR of `apiVersion` always matches the MAJOR in the URL. MINOR bumps document backwards-compatible additions to the API surface and do not change the URL.

- **`package.json`** -- The `version` field must match `version.json`.
- **`documentation/package.json`** -- The `version` field must match the `docVersion` in `version.json`.

## Release Notes And Changelog

Two files at the repository root capture release information; both are maintained by hand alongside the code that ships in the release.

- **`RELEASE_NOTES.md`** -- Human-facing per-release summary. Describes what changes for the operator or integrator. Consumers browse this file at the tagged commit for the release summary.
- **`CHANGELOG.md`** -- Technical per-release log in [Keep a Changelog](https://keepachangelog.com/) format (`Added` / `Changed` / `Removed` / `Fixed`).

## Pre-release Tags

Versions may carry a pre-release identifier for staged rollouts:

- `v<X.Y.Z>-rc.<n>` for release candidates.
- `v<X.Y.Z>-alpha.<n>` and `-beta.<n>` for earlier-stage previews.
- `v<X.Y.Z>-pre.<n>` for ad-hoc pre-release builds.

Pre-release tags push the semver-tagged Docker image but do not move the `:latest` pointer, so a pre-release does not become the default pull target.

## Release Workflow

The release flow is:

```
PRs -> main -> tag v<X.Y.Z> from main
```

### Step-by-step

1. **Confirm `main` is release-ready.** CI green, no in-flight breaking work that should land first, migration guides updated if this is a major release.

2. **Open a release-prep branch** from `main`:

```bash
git checkout main
git pull --ff-only
git checkout -b chore/release-X.Y.Z
```

3. **Bump the version** everywhere it appears:

- `version.json` -- update `version` (and `docVersion` if generating a docs cut).
- `package.json` -- update `version`.

4. **Update release notes and changelog.** Add a new top-level `## X.Y.Z` section to `RELEASE_NOTES.md` with the human-facing summary, and a new top-level `## [X.Y.Z] - YYYY-MM-DD` section to `CHANGELOG.md` in Keep a Changelog format.

5. **Generate a documentation snapshot** if `docVersion` changed:

```bash
yarn release:doc
```

6. **Commit and push the release-prep branch**, open a pull request against `main`, get it reviewed, and merge it.

7. **Tag the merge commit** with the release version (prefixed `v`):

```bash
git checkout main
git pull --ff-only
git tag vX.Y.Z
git push origin vX.Y.Z
```

The tag push triggers the **Docker** workflow, which builds and pushes `ghcr.io/uncefact/project-storage-service:X.Y.Z` and `:latest` (the `:latest` tag is suppressed for pre-release suffixes).

## Hotfix Workflow

For an urgent fix against a released version:

1. Branch from the affected release tag:

```bash
git checkout -b fix/short-description vX.Y.Z
```

2. Apply the fix and open a pull request against `main`.

3. After the PR merges, cut a new patch tag from `main` (`vX.Y.Z+1`).

If `main` has diverged enough that hotfixing directly from `main` is risky, tag the patch from the hotfix branch and push that tag (the docker workflow fires either way), then merge the fix back to `main` separately.

## Creating a New Documentation Version

Documentation versions are managed through the `scripts/release-doc.js` script. To create a new documentation version manually:

```bash
yarn release:doc
```

The documentation is automatically built and deployed to GitHub Pages via the `build_publish_docs.yml` pipeline, which triggers on push to `main`.
