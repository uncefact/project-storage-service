---
sidebar_position: 2
title: Release Process
---

This page describes the branch structure, versioning scheme, and step-by-step release workflow for the Storage Service.

## Branch Structure

| Branch          | Purpose                                                                |
| --------------- | ---------------------------------------------------------------------- |
| `main`          | Production. Always reflects the latest released version.               |
| `next`          | Development. All feature work and bug fixes are merged here first.     |
| `release/X.Y.Z` | Release preparation. Created from `next` when preparing a new release. |

## Version Files

The project maintains version information in three files:

- **`version.json`** -- Contains `version`, `apiVersion`, and `docVersion` fields:

```json
{
    "version": "MAJOR.MINOR.PATCH",
    "apiVersion": "MAJOR.MINOR.PATCH",
    "docVersion": "MAJOR.MINOR.PATCH",
    "dependencies": {}
}
```

- **`package.json`** -- The `version` field must match `version.json`.
- **`documentation/package.json`** -- The `version` field must match the `docVersion` in `version.json`.

All three files must be updated as part of the release process.

## Release Workflow

The release flow follows this path:

```
next -> release/X.Y.Z -> PR to main -> merge main back to next
```

## Step-by-Step Release Guide

1. **Create a release branch** from `next` with the version number as the branch name:

```bash
git checkout next
git pull origin next
git checkout -b release/X.Y.Z
```

2. **Update version files.** Set the new version number in:
    - `version.json` (`version`, `apiVersion` if the API has changed, `docVersion`)
    - `package.json` (`version`)
    - `documentation/package.json` (`version`, if `docVersion` changed)

3. **Generate a new documentation version** using the release script:

```bash
yarn release:doc
```

This reads the `docVersion` from `version.json` and creates a Docusaurus version snapshot.

4. **Check API documentation** and update if necessary (e.g. Swagger definitions).

5. **Commit the changes** and push the release branch:

```bash
git add .
git commit -m "chore(release): prepare X.Y.Z"
git push origin release/X.Y.Z
```

6. **Create a pull request** from the release branch to `main`.

7. **Merge the pull request** into `main`.

8. **Create a new release tag** with the version number:

```bash
git checkout main
git pull origin main
git tag X.Y.Z
git push origin X.Y.Z
```

9. **Merge `main` back into `next`** to ensure the development branch has all release changes:

```bash
git checkout next
git pull origin next
git merge main
git push origin next
```

## Creating a New Documentation Version

Documentation versions are managed through the `scripts/release-doc.js` script. This script:

- Reads the `docVersion` from `version.json`.
- Creates a Docusaurus versioned snapshot of the current documentation.

To create a new documentation version manually:

```bash
yarn release:doc
```

The documentation is automatically built and deployed to GitHub Pages via the `build_publish_docs.yml` pipeline, which triggers on manual workflow dispatch.
