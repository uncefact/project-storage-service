# Release Management Guide

This document describes the release management strategy for the storage
service. The repository follows trunk-based development on `main`; releases
are cut by tagging from `main`.

---

## Table of Contents

1. [Release Overview](#release-overview)
2. [Branching](#branching)
3. [Versioning](#versioning)
4. [Version And Dependencies Management](#version-and-dependencies-management)
5. [Release Workflow](#release-workflow)
6. [Pipelines](#pipelines)

---

## Release Overview

Each release combines a coordinated set of changes that have already merged to
`main` into a tagged version. The maintainer:

1. Confirms `main` is in a release-ready state (CI green, no in-flight breaking work).
2. Bumps `version.json` (and `package.json`) on a release-prep PR.
3. Updates `RELEASE_NOTES.md` with the human-facing entry for the new version
   and `CHANGELOG.md` with the technical entry.
4. Opens the release-prep PR, gets it reviewed, and merges it to `main`.
5. Tags the merge commit `v<X.Y.Z>` and pushes the tag.
6. The docker pipeline builds and pushes the release image. The release is
   identified by the git tag and the published Docker image; consumers
   browse `RELEASE_NOTES.md` at the tagged commit for the human-facing
   summary.

No `next`, `release/*`, or `hotfix/*` branches. All work flows through PRs
against `main`.

---

## Branching

- `main` is the only long-lived branch. It always reflects the latest agreed
  state of the project.
- Feature branches use `<conventional-type>/<short-kebab-case-description>`
  (e.g. `feat/add-some-endpoint`, `fix/handle-edge-case`). They merge to
  `main` via pull request.
- Hotfixes branch from the relevant release tag (`v<X.Y.Z>`), apply the fix,
  and produce a new patch tag (`v<X.Y.Z+1>`). There is no dedicated `hotfix/*`
  branch convention; the fix lands on a normal feature branch and goes through
  the same PR-to-`main` flow.

---

## Versioning

The project follows Semantic Versioning (MAJOR.MINOR.PATCH):

- **MAJOR** when the API contract breaks (e.g. removing a response field,
  changing a path shape).
- **MINOR** when backwards-compatible functionality is added.
- **PATCH** for backwards-compatible bug fixes.

Pre-release identifiers may be appended for staged rollouts:

- `v<X.Y.Z>-rc.<n>` for release candidates.
- `v<X.Y.Z>-alpha.<n>` and `-beta.<n>` for earlier-stage previews.
- `v<X.Y.Z>-pre.<n>` for ad-hoc pre-release builds.

Pre-release tags push the semver-tagged Docker image but do not move the
`:latest` pointer, so a pre-release does not become the default pull target.
Consumers browse `RELEASE_NOTES.md` at the tagged commit for the human-facing
release summary.

### API Version And Repository Version

The `apiVersion` field in `version.json` records the API contract version as
`MAJOR.MINOR`. The MAJOR of `apiVersion` is kept in lockstep with the URL
path's `v<MAJOR>` segment (`/api/v<MAJOR>`, derived from
`src/routes/v<MAJOR>/`). MINOR bumps document backwards-compatible additions
to the API surface and do not change the URL.

When the API has a breaking change, both the repository MAJOR (`version`) and
the API MAJOR (`apiVersion`) move together, and the routes directory
(`src/routes/v<MAJOR>/`) lifts to match.

### Documentation Versioning

`docVersion` in `version.json` tracks the Docusaurus snapshot version
independently of `version`. Generate a new documentation snapshot when shipping
user-visible documentation changes by running `yarn release:doc` against the
new `docVersion`.

---

## Version And Dependencies Management

### Overview

`version.json` is a small metadata file that records:

- The current service `version` (must match the git tag and `package.json`).
- The `apiVersion` describing the API contract.
- The `docVersion` describing the documentation snapshot version.
- A `dependencies` map listing compatible versions of dependent services (optional).

### Example Structure

```
{
    "version": "MAJOR.MINOR.PATCH",
    "apiVersion": "MAJOR.MINOR",
    "docVersion": "MAJOR.MINOR.PATCH",
    "dependencies": {
        // Example dependency service
        "dependency-service": {
            "repoUrl": "https://github.com/repo/dependency-service.git",
            "versions": ["1.0.0", "1.0.1", "1.0.2"]
        }
    }
}
```

### Key Fields

- `version`: The version of the current service. Must align with the git tag (with the `v` prefix stripped) and `package.json`.
- `apiVersion`: The API contract version as `MAJOR.MINOR`. Kept in lockstep with the URL path segment (`/api/v<MAJOR>`, sourced from the routes directory `src/routes/v<MAJOR>/`); MINOR bumps document backwards-compatible additions to the API surface and do not change the URL.
- `docVersion`: The version of the documentation.
- `dependencies`: A list of dependent services with their repositories and compatible version list. Optional.

---

## Release Workflow

### Preparing a release

1. Confirm `main` is in a release-ready state:
    - CI green on the head commit.
    - No in-flight breaking work that should land first.
    - Migration guide(s) updated if this is a major release.
2. Open a release-prep branch (`chore/release-<X.Y.Z>` or similar) from `main`.
3. Bump the version everywhere it appears:
    - `version.json` → `version` (and `docVersion` if the docs cut new).
    - `package.json` → `version`.
4. Update release notes and changelog:
    - Add a new top-level `## <X.Y.Z>` section to `RELEASE_NOTES.md` with the
      human-facing summary (what changed for users / operators / integrators).
    - Add a new top-level `## [<X.Y.Z>] - <YYYY-MM-DD>` section to
      `CHANGELOG.md` in Keep a Changelog format
      (`Added` / `Changed` / `Removed` / `Fixed`).
5. If shipping a docs cut, generate the Docusaurus snapshot:
    ```bash
    yarn release:doc
    ```
6. Open the release-prep PR, get it reviewed, and merge it to `main`.

### Cutting the tag

After the release-prep PR has merged:

```bash
git checkout main
git pull --ff-only
git tag v<X.Y.Z>
git push origin v<X.Y.Z>
```

The tag push triggers the **Docker** workflow, which builds and pushes
`ghcr.io/uncefact/project-storage-service:<X.Y.Z>` and `:latest` (the
`:latest` tag is suppressed for pre-release suffixes).

### Hotfix workflow

1. Branch from the affected release tag:
    ```bash
    git checkout -b fix/<short-description> v<X.Y.Z>
    ```
2. Apply the fix; open a PR against `main`.
3. After the PR merges, cherry-pick or re-apply the fix on `main` if the
   branch diverged. Most hotfixes apply cleanly to `main`; if not, sequence
   the merge to `main` first and then derive the hotfix from `main`.
4. Cut a new patch tag from `main` (`v<X.Y.Z+1>`).

For urgent production fixes where `main` has drifted significantly,
hotfixing directly from the release tag is supported: after fixing, tag the
new patch from the hotfix branch and push that tag, then merge the fix back
to `main` separately.

---

## Pipelines

### Test and Build

Triggers on pull requests against `main` that touch application source code,
build config, or the workflow itself (`src/**`, `package.json`, `yarn.lock`,
`tsconfig.json`, `webpack.config.cjs`, `jest.config.js`, `Dockerfile`,
`.github/workflows/test_build.yml`). Runs format and lint checks, unit
tests, coverage reporting, build, and e2e tests.

### Build Docs

Triggers on pull requests against `main` that touch documentation source or
the workflow itself (`documentation/**`,
`.github/workflows/build_docs.yml`). Installs the documentation site's
dependencies and builds the Docusaurus output to validate that the docs
compile cleanly. Does not publish.

### Docker

Triggers on push to `main` and on `v<X.Y.Z>` tag pushes.

- Push to `main`: builds and pushes `ghcr.io/uncefact/project-storage-service:main`
  plus a `:main-<short-sha>` tag pinnable to the specific commit.
- Tag push: builds and pushes `:<X.Y.Z>` (the semver value) and `:latest`
  (suppressed for `-rc`, `-alpha`, `-beta`, `-pre` suffixes).
- `workflow_dispatch` with an explicit `version` input lets a maintainer
  rebuild a release image on demand.

Uses GitHub Actions cache scoped to this workflow (`docker-storage-service`)
so build layers persist across runs without colliding with other Docker
workflows in the repository.

### Build and Prepare Docs

Triggers on push to `main` that touches `documentation/**`. Builds the Docusaurus site and pushes the build output to the `gh-pages` branch. GitHub's own `pages build and deployment` workflow then fires on the `gh-pages` push and publishes the content to the public Pages URL.
