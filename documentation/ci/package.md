---
sidebar_position: 1
title: Package Workflow
---

## Overview

The Package workflow builds and pushes Docker images for the Storage Service application to GitHub Container Registry (GHCR).

## Trigger

This workflow is triggered on:

- Push of tags matching the pattern `*.*.*` (e.g., `1.1.0`)
- Manual trigger via `workflow_dispatch`
- Completion of the `Release` workflow

## Docker Images

The workflow builds a single image variant using the root `Dockerfile`.

### Multi-Platform Support

Images are built for multiple architectures:
- `linux/amd64` (Intel/AMD)
- `linux/arm64` (Apple Silicon, ARM servers)

### Image Tags

| Tag Pattern | Example | Description |
|-------------|---------|-------------|
| `{version}` | `1.1.0` | Version-tagged image |
| `latest` | `latest` | Latest release |
| `sha-{hash}` | `sha-f30ab65` | Commit-specific image |

## Pulling Images

```bash
# Latest release by version
docker pull ghcr.io/uncefact/project-identity-resolver:1.1.0

# Or use latest tag
docker pull ghcr.io/uncefact/project-identity-resolver:latest
```

## Workflow Steps

1. **Checkout**: Fetches the repository code
2. **Get version**: Reads version from `version.json` for `workflow_run` triggers
3. **Docker meta**: Generates image tags
4. **Set up QEMU**: Enables multi-platform builds
5. **Set up Docker Buildx**: Prepares the Docker buildx environment
6. **Login to GHCR**: Authenticates with GitHub Container Registry
7. **Build and Push Release**: Builds and pushes the image

## Dependencies

- `actions/checkout@v4`
- `docker/metadata-action@v5`
- `docker/setup-qemu-action@v3`
- `docker/setup-buildx-action@v3`
- `docker/login-action@v3`
- `docker/build-push-action@v5`
