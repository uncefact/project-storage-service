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

1. **Branch from `main`.** Use the convention `<conventional-type>/<short-kebab-case-description>` (e.g. `feat/add-foo`, `fix/handle-bar`).
2. **Submit your PR against `main`.** The repository follows trunk-based development; there is no `next`, `release/*`, or `hotfix/*` branch.
3. **Ensure tests pass.** All existing and new tests must pass before a PR will be reviewed.
4. **Keep PRs focused.** Each pull request should address a single concern -- one feature, one bug fix, or one refactoring effort.

## Commit Conventions

The project follows the [Conventional Commits](https://www.conventionalcommits.org/) format. Conventional commit messages make the change history easier to scan and let reviewers infer intent without reading the diff first.

```
type(scope): description
```

Common types:

| Type       | Use When                                                   |
| ---------- | ---------------------------------------------------------- |
| `feat`     | Adding new functionality                                   |
| `fix`      | Fixing something that does not work as documented          |
| `docs`     | Documentation-only changes                                 |
| `chore`    | Maintenance work (dependency bumps, build config, tooling) |
| `refactor` | Code changes that neither fix a bug nor add functionality  |
| `test`     | Adding or revising tests                                   |
| `style`    | Formatting changes that do not affect meaning              |

Versioning is maintainer-driven; bumps are made in a release-prep PR rather than inferred from commit types. See the [Release Process](../release-process/) for the full flow.

### Breaking Changes

Add `!` after the type or scope to signal a breaking change. This makes the breaking nature of the commit obvious to reviewers and helps the maintainer place the change in the correct `CHANGELOG.md` section at release time.

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

When a PR is squash-merged, GitHub uses the PR title as the merge commit message. A consistent conventional-commit format on PR titles makes the merge log easier to scan and helps the maintainer assemble the `Added` / `Changed` / `Removed` / `Fixed` sections of `CHANGELOG.md` at release time.

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
