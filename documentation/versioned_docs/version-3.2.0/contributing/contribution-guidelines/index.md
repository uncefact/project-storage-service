---
sidebar_position: 3
title: Contribution Guidelines
---

This page outlines the code style, commit conventions, and pull request process for contributing to the Storage Service.

## Code Style

The project uses:

- **TypeScript** as the primary language.
- **ESLint** for static analysis and enforcing code quality rules.
- **Prettier** for consistent code formatting.

An ESLint configuration is included in the repository. Prettier is configured to work alongside ESLint without conflicting rules (via `eslint-config-prettier`).

## Pre-commit Hooks

The project uses **Husky** and **lint-staged** to enforce code quality before every commit. When you commit, the following checks run automatically on staged `.ts` files:

1. **Prettier** -- formats the code.
2. **ESLint** -- checks for linting errors.

If either check fails, the commit is blocked until the issues are resolved. You can run these checks manually at any time:

```bash
# Check formatting
yarn format:check

# Fix formatting
yarn format:fix

# Run linter
yarn lint:check
```

## Pull Request Process

1. **Branch from `next`.** All feature branches should be created from the `next` branch.
2. **Submit your PR to `next`.** Pull requests should target the `next` branch, not `main`.
3. **Ensure tests pass.** All existing and new tests must pass before a PR will be reviewed.
4. **Keep PRs focused.** Each pull request should address a single concern -- one feature, one bug fix, or one refactoring effort.

## Commit Conventions

The project follows the [Conventional Commits](https://www.conventionalcommits.org/) format. This is not just a style preference; the release tooling reads commit messages to automatically determine version bumps and generate changelogs. A `feat` commit triggers a minor version bump, a `fix` triggers a patch bump, and a breaking change triggers a major bump.

```
type(scope): description
```

Common types:

| Type       | Version Bump  | Changelog Section |
| ---------- | ------------- | ----------------- |
| `feat`     | Minor (1.x.0) | Features          |
| `fix`      | Patch (1.0.x) | Bug Fixes         |
| `docs`     | Patch         | Documentation     |
| `chore`    | None          | Hidden            |
| `refactor` | None          | Hidden            |
| `test`     | None          | Hidden            |
| `style`    | None          | Hidden            |

### Breaking Changes

Add `!` after the type or scope to signal a breaking change. This triggers a major version bump (x.0.0) and appears prominently in the changelog.

```
feat(api)!: rename storage endpoints

BREAKING CHANGE: /store is now /public and /encrypt is now /private.
```

You can also include a `BREAKING CHANGE:` footer in the commit body to describe what changed and how consumers should migrate.

### Examples

```
feat(routes): add file upload support to public endpoint
fix(storage): handle missing bucket gracefully
docs(readme): update installation instructions
test(e2e): add S3-compatible storage tests
feat(config)!: rename REGION to S3_REGION
```

### Why This Matters

When a PR is squash-merged, GitHub uses the PR title as the merge commit message. If a feature PR title is missing the `feat:` prefix, the release tooling will not detect it as a feature. This results in an incorrect patch bump instead of a minor bump. Always ensure PR titles follow the conventional commit format.

## Testing Expectations

All modified and added functionality must have tests:

- **New features** must include unit tests covering the expected behaviour and edge cases.
- **Bug fixes** must include a regression test that would have caught the bug.
- **Refactoring** must ensure existing tests continue to pass. Add tests if coverage gaps are identified.

Run the test suite locally before submitting a pull request:

```bash
# Unit tests
yarn test

# E2E tests (requires Docker)
yarn test:e2e
```
