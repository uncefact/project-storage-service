---
sidebar_position: 4
title: Docker Image Workflow
---

## Overview

The Docker workflow (`docker.yml`) builds and pushes multi-platform Docker images for the Storage Service to GitHub Container Registry (GHCR).

## Triggers

The workflow runs on:

- **Push to `main`** -- when application source code or build configuration changes (path-filtered).
- **Tag push matching `v*`** -- on a release tag pushed from `main`.
- **`workflow_dispatch`** -- manual rebuild on demand, with an optional `version` input.

## Multi-Platform Support

Images are built for multiple architectures:

- `linux/amd64` (Intel/AMD)
- `linux/arm64` (Apple Silicon, ARM servers)

## Image Tags

| Tag Pattern        | Example        | Description                                                 |
| ------------------ | -------------- | ----------------------------------------------------------- |
| `main`             | `main`         | Rolling head of the `main` branch                           |
| `main-{short-sha}` | `main-251a89d` | Pinnable image for a specific commit on `main`              |
| `{version}`        | `4.0.0`        | Version-tagged image from a `v{version}` git tag            |
| `latest`           | `latest`       | Latest stable release (suppressed for pre-release suffixes) |

Pre-release tag pushes (`v4.0.0-rc.1`, `-alpha.1`, `-beta.1`, `-pre.1`) push the semver-tagged image but do not move the `:latest` pointer, so a pre-release does not become the default pull target.

## Pulling Images

```bash
# Latest stable release
docker pull ghcr.io/uncefact/project-storage-service:latest

# Specific release version
docker pull ghcr.io/uncefact/project-storage-service:4.0.0

# Rolling head of main
docker pull ghcr.io/uncefact/project-storage-service:main

# Pinned to a specific main commit
docker pull ghcr.io/uncefact/project-storage-service:main-251a89d
```

## Workflow Steps

1. **Checkout** -- fetches the repository at the specific commit SHA that triggered the workflow, so a parallel push cannot move the tree under the running job.
2. **Set up QEMU** -- enables cross-architecture emulation for multi-platform builds.
3. **Set up Docker Buildx** -- prepares the buildx environment.
4. **Log in to GHCR** -- authenticates with the registry using `GITHUB_TOKEN`.
5. **Docker metadata** -- generates the tag set from the trigger (branch push, tag push, or dispatch).
6. **Build and push** -- builds and pushes the image for both platforms. Uses a scoped GitHub Actions cache (`docker-storage-service`) so build layers persist across runs.

## Dependencies

- `actions/checkout@v4`
- `docker/setup-qemu-action@v3`
- `docker/setup-buildx-action@v3`
- `docker/login-action@v3`
- `docker/metadata-action@v5`
- `docker/build-push-action@v6`
