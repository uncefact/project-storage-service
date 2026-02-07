---
name: project-release
description: Use when releasing changes from next branch to main, creating hotfixes, or managing version bumps. Triggers include requests to "release", "create a release", "hotfix", "bump version", or when preparing changes on next for production.
---

# Project Release Process

## Overview

This skill guides releases following the repository's release management workflow. The key principle is **thoroughness over speed** - verify every step before proceeding.

## Version Strategy

This repo uses semantic versioning with three tracked versions:

| Field | Purpose | When to Update |
|-------|---------|----------------|
| `version` | Repository/package version | Every release |
| `apiVersion` | API contract version | Only when API endpoints change |
| `docVersion` | Documentation version | When new versioned docs are generated |

**Location of versions:**
- `package.json` - repository version
- `version.json` - all three versions
- `documentation/package.json` - should match docVersion

## Determining Version Bump

Analyze commits on `next` not yet in `main`:

```bash
git log next --not origin/main --oneline
```

| Commit Pattern | Version Bump |
|----------------|--------------|
| "feat!:" or "BREAKING CHANGE:" in body | MAJOR |
| `feat:` | MINOR |
| `fix:`, `docs:`, `ci:`, etc. | PATCH |

The "!" after the type indicates a breaking change.

## Standard Release Process

### 1. Preparation

```bash
git checkout next && git pull origin next
git log next --not origin/main --oneline  # Review what's being released
```

Verify all feature PRs are merged and tests pass on `next`.

### 2. Create Release Branch

```bash
git checkout -b release/X.Y.Z
```

### 3. Update Versions

Update ALL version files:
- `package.json` - version field
- `version.json` - version and docVersion fields
- `documentation/package.json` - version field (match docVersion)

**Do NOT manually edit:**
- `.github/workflows/.release-please-manifest.json` - managed by release-please
- `documentation/versions.json` - managed by release:doc script

### 4. Verify Code

Run ALL verification steps:
```bash
yarn lint        # Linting
yarn test        # Unit tests
yarn test:e2e    # E2E tests
yarn build       # Compilation check
```

### 5. Review and Generate Documentation

**Only generate new versioned docs if documentation has changed.**

**Before generating**, manually review source docs:
- Read each page in `documentation/docs/`
- Check README.md for consistency
- Verify any breaking changes are already documented

If documentation needs updating, fix source docs first. Then generate:
```bash
yarn release:doc
```

This copies source docs to `documentation/versioned_docs/version-X.Y.Z/`.

After generating, review the new versioned docs to confirm they're correct.

### 6. Commit Release Preparation

**Important**: Do NOT include "BREAKING CHANGE:" in the release commit message if the original feature commit already has "!" or "BREAKING CHANGE:". This causes duplicate entries in the changelog.

```bash
git add -A
git commit -m "chore(release): prepare release X.Y.Z

- Bump version to X.Y.Z
- Generate documentation version X.Y.Z"  # Only include if docs were generated
```

### 7. Push and Wait for Changelog

```bash
git push -u origin release/X.Y.Z
```

The changelog pipeline will auto-generate a PR. Review it for:
- Correct categorization of changes
- No duplicate BREAKING CHANGE entries
- No unwanted commits (chore commits should be hidden)

Merge the changelog PR to the release branch.

### 8. Create PR to Main

Create PR from `release/X.Y.Z` to `main`. Use **merge commit** (not squash).

### 9. Post-Release

After merging to main:
```bash
git checkout next && git pull origin next
git merge origin/main --no-edit
git push origin next
```

## Hotfix Process

For critical fixes to production:

### 1. Create from Main

```bash
git checkout -b hotfix/X.Y.Z origin/main
```

### 2. Make Fixes and Bump Version

- Fix the issues
- Bump PATCH version in `package.json` and `version.json`
- If fixing documentation, update both source docs AND the versioned docs being fixed
- `docVersion` stays at the version being fixed (don't create new doc version for doc-only fixes)

### 3. PR to Main, Then Sync

Same as standard release - PR to main, merge, then merge main back to next.

## Common Pitfalls

### Documentation Generation

**Problem**: Versioned docs generated with outdated content.
**Cause**: Source docs (`documentation/docs/`) weren't updated before running `release:doc`.
**Prevention**: Always verify source docs are current before generating.

### Duplicate Breaking Changes

**Problem**: Changelog shows same breaking change twice.
**Cause**: Release commit includes "BREAKING CHANGE:" when original commit already had "!".
**Prevention**: Only document breaking changes once, in the original feature commit.

### Missing Version Updates

**Problem**: Versions inconsistent across files.
**Cause**: Forgetting `documentation/package.json` or other version files.
**Prevention**: Update ALL version files listed in section 3.

### Rushing to Commit

**Problem**: Mistakes discovered after committing/pushing.
**Cause**: Skipping manual verification steps.
**Prevention**: Read every changed file before committing. No shortcuts.

## Reference Documents

For detailed procedures, see:
- `RELEASE_GUIDE.md` - Step-by-step checklist
- `RELEASE_MANAGEMENT_GUIDE.md` - Strategy and versioning details
