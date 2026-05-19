# ADR: Trunk-based development with tag-driven releases

- **Date:** 2026-05-19
- **Status:** accepted

## Context

Through 3.2.x the storage service used a multi-branch release model managed by `release-please`. The `main` branch held production state, `next` was the integration branch, and short-lived `release/<X.Y.Z>` and `hotfix/<X.Y.Z>` branches mediated cuts. The `release-please` action watched merges to `next` (and to the `release/*` / `hotfix/*` branches) for conventional-commit-typed changes, opened a release PR that bumped `version.json`, regenerated `CHANGELOG.md`, and (when the release PR merged to `main`) created the git tag and the GitHub release. A separate `package-next.yml` workflow produced rolling `:next` Docker images on every `next` merge; `package.yml` produced release Docker images after `release.yml` completed on `main`.

This served at the start but accumulated friction. Three long-lived branches plus two ephemeral branch families meant every change crossed two PR boundaries on its way to production, and contributors had to learn the convention before they could meaningfully contribute. The machine-generated `CHANGELOG.md` was faithful to the commit log but read as a mechanical dump of conventional-commit subjects; it did not communicate the user-facing impact of a release, and there was no separate human-facing artefact. The release-PR loop produced repeated noise: small PRs created small release-please PRs, which had to be reviewed, merged, and sometimes rebased when other work landed during the open release-PR window. And the infrastructure was load-bearing on a third-party action whose behaviour (versioning algorithm, PR title conventions, changelog formatting) the project did not own and could not easily customise.

The wider organisation (e.g. `tests-untp/untp-playground`) has moved to a trunk-based model with tags as the release signal. Aligning the storage service with that pattern reduces the cross-project context cost.

## Decision

The repository moves to trunk-based development with tag-driven releases. The single long-lived branch is `main`: feature branches branch from `main`, PR to `main`, merge to `main`. There is no `next`, no `release/*`, and no `hotfix/*` branch convention.

Releases are cut by tagging from `main`. A release-prep PR bumps `version.json` and `package.json`, adds the new entries to `RELEASE_NOTES.md` and `CHANGELOG.md`, and merges to `main`. The maintainer then tags the merge commit `v<X.Y.Z>` and pushes the tag. `release-please` is removed entirely; versioning and changelog updates are maintainer-driven in the release-prep PR.

Two release artefacts on disk are maintained by hand. `RELEASE_NOTES.md` is the human-facing per-release summary, describing what changes for an operator or integrator. `CHANGELOG.md` is the technical per-release log in Keep a Changelog format (`Added` / `Changed` / `Removed` / `Fixed`).

The tag is the release signal. The Docker workflow produces release images on tag push (semver tag plus `:latest`, with `:latest` suppressed for pre-release suffixes `-rc`, `-alpha`, `-beta`, `-pre`). No GitHub release is auto-created; consumers browse `RELEASE_NOTES.md` at the tagged commit for the human-facing summary.

Pipelines are path-filtered and SHA-pinned. Each workflow only runs when its inputs change (source code for Docker and Test and Build, documentation for Build Docs and Deploy to GitHub Pages). Each checkout pins to `${{ github.sha }}` so a parallel push cannot move the working tree under a running job.

Hotfixes branch from the relevant release tag, PR to `main`, and produce a new patch tag from `main` after merge. There is no dedicated `hotfix/*` branch convention.

## Consequences

**What becomes easier:**

- Contributors have one mental model: branch from `main`, PR to `main`, done. They do not need to learn `next`, the release-PR cadence, or `release-please`'s conventions before their first change.
- Release notes communicate user-facing impact. The human-written `RELEASE_NOTES.md` entry is the single artefact consumers read at the tagged commit; it is not constrained by what conventional-commit subjects happened to be in the diff.
- Customising release behaviour is local. Changing how a release is cut is a workflow edit rather than a third-party action configuration.
- Pipeline scope is honest. Build Docs only runs when docs change; the Docker workflow only runs when something that goes into the image changes. Less wasted CI, faster signal.
- The Docker tag set is more useful day-to-day. Push to `main` produces both `:main` (rolling) and `:main-<short-sha>` (pinnable per commit), so an operator pulling from `main` can record exactly which build they ran.

**What becomes more difficult:**

- The maintainer is responsible for keeping `RELEASE_NOTES.md` and `CHANGELOG.md` in sync with the diff. A bot no longer fills them. Both files live next to the code, and review of the release-prep PR is where this drift is caught.
- Pre-release identifiers (`-rc`, `-alpha`, `-beta`, `-pre`) and the `:latest` suppression rules are encoded in the Docker metadata-action pattern. A new pre-release suffix requires updating the workflow's `enable` predicate to keep `:latest` from advancing onto a pre-release tag.
- Tag-driven hotfixes assume `main` is in a state where the fix applies cleanly. When `main` has diverged, the hotfix is tagged from the fix branch directly and merged to `main` separately; that path is mechanical but the team has to remember it.

## Alternatives Considered

### Keep release-please on the existing `main` + `next` model

Rejected. The release-PR loop's main value (mechanical bumping of `version.json` and `CHANGELOG.md` from conventional commits) is largely clerical work that the release-prep PR can do without bot mediation. The costs (mechanical-feeling changelog, two-PR boundary for every change, dependency on an external action's behaviour) outweigh the value at this project's size.

### Trunk-based on `main` but keep release-please for changelog generation

Rejected. `release-please` is tightly coupled to its PR-driven release flow. Adopting only the changelog generation while skipping the release-PR cycle leaves the tool half-used and still pinning the project to its conventions (commit-type sections, version-bump heuristics). A hand-maintained Keep-a-Changelog file is more honest and the cost of writing it during the release-prep PR is small.

### Continue auto-creating a GitHub release at the tag

Rejected. The release artefact set (`RELEASE_NOTES.md` at the tagged commit and the published Docker image) already covers the same surface area as a GitHub release does, without requiring a workflow to slice content out of `RELEASE_NOTES.md` and call `gh release create`. Removing the auto-create step eliminates a moving part and a place for body formatting to drift between sources.

### Run all pipelines on every push (no path filtering)

Rejected. The Docker image build is the most expensive workflow in the repository; running it on documentation-only changes wastes minutes of CI per change. Path-filtered triggers keep the signal honest: a pipeline that ran says something about its inputs.

### Use the branch ref (`refs/heads/main`) for the checkout instead of `github.sha`

Rejected. When the workflow runs in response to a push, the canonical "what was pushed" identifier is the SHA in the push event payload. Using the branch ref means a parallel push that lands during the checkout window changes the working tree under the running job, producing an image labelled with one commit but built from another's source.

## References

- #115 (URL path major-only), #116, #117, #118 (logging + OTel work that lands as part of the 4.0.0 cut)
- `RELEASE_MANAGEMENT_GUIDE.md` at the repository root (operational detail for maintainers)
- `documentation/docs/contributing/release-process/index.md` (the user-facing release process docs)
- [`tests-untp/untp-playground` docker workflow](https://github.com/uncefact/tests-untp/blob/next/.github/workflows/docker-playground.yml) (the pattern this work mirrors)
