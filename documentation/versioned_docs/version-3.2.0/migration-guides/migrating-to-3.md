---
sidebar_position: 1
title: Migrating to 3.0.0
---

This guide is for users upgrading from version 2.x to 3.0.0. It covers all breaking changes, including endpoint consolidation, environment variable renames, and infrastructure updates. Work through each section to ensure a smooth transition.

## API Endpoint Changes

The three separate endpoints have been consolidated into two, organised by data sensitivity rather than content type.

### Before (2.x)

| Endpoint                      | Purpose                             |
| ----------------------------- | ----------------------------------- |
| `POST /api/2.0.0/documents`   | Store public JSON data              |
| `POST /api/2.0.0/files`       | Store public binary files           |
| `POST /api/2.0.0/credentials` | Store and encrypt private JSON data |

### After (3.0.0)

| Endpoint                  | Purpose                                         |
| ------------------------- | ----------------------------------------------- |
| `POST /api/3.0.0/public`  | Store public data (JSON or binary)              |
| `POST /api/3.0.0/private` | Store and encrypt private data (JSON or binary) |

**What changed:**

- `/documents` and `/files` are merged into `/public`. It accepts both `application/json` and `multipart/form-data`.
- `/credentials` is renamed to `/private`. It now also accepts `multipart/form-data` (binary files are base64-encoded before encryption).
- The API version in the path changed from `2.0.0` to `3.0.0`.

### Migration steps

Replace all API calls:

```diff
# Public JSON data
- POST /api/2.0.0/documents
+ POST /api/3.0.0/public

# Public binary files
- POST /api/2.0.0/files
+ POST /api/3.0.0/public

# Private data (JSON or binary)
- POST /api/2.0.0/credentials
+ POST /api/3.0.0/private
```

## Response Field Rename

The `/private` endpoint response field for the decryption key has been renamed for clarity.

```json
// Before (2.x)
{
    "uri": "...",
    "hash": "...",
    "key": "..."
}

// After (3.0.0)
{
    "uri": "...",
    "hash": "...",
    "decryptionKey": "..."
}
```

:::warning
Update any code that reads the `key` field from `/credentials` responses to use `decryptionKey` from `/private` responses instead. Failing to update this will cause errors wherever decryption keys are parsed from the API response.
:::

## Environment Variable Changes

### Renamed variables

| Before (2.x)           | After (3.0.0)          | Default                                           |
| ---------------------- | ---------------------- | ------------------------------------------------- |
| `MAX_BINARY_FILE_SIZE` | `MAX_UPLOAD_SIZE`      | `10485760` (10 MB)                                |
| `ALLOWED_BINARY_TYPES` | `ALLOWED_UPLOAD_TYPES` | `image/png,image/jpeg,image/webp,application/pdf` |

:::warning
The old variable names are no longer recognised. Update your `.env` files and deployment configurations before upgrading.
:::

For the full list of environment variables and their defaults, see [Configuration](../deployment-guide/configuration/).

### Changed default bucket names

| Before (2.x)                                                                    | After (3.0.0)                       |
| ------------------------------------------------------------------------------- | ----------------------------------- |
| `DEFAULT_BUCKET=verifiable-credentials`                                         | `DEFAULT_BUCKET=documents`          |
| `AVAILABLE_BUCKETS=verifiable-credentials,files,private-verifiable-credentials` | `AVAILABLE_BUCKETS=documents,files` |

:::info
If you already set `DEFAULT_BUCKET` and `AVAILABLE_BUCKETS` explicitly in your configuration, no change is needed. This only affects deployments relying on the default values.
:::

## Node.js Version

The minimum Node.js version is now **22** (previously 18). Update your runtime environment, CI pipelines, and Docker base images accordingly.

See [Installation](../deployment-guide/installation/) for up-to-date prerequisites and setup instructions.

## Repository Rename

The repository has been renamed from `project-identity-resolver` to `project-storage-service` to reflect its actual scope.

### Git remotes

GitHub redirects old URLs indefinitely, so existing clones continue to work. To update your remote explicitly:

```bash
git remote set-url origin https://github.com/uncefact/project-storage-service.git
```

### Docker images

Images are now published under the new repository name:

```bash
# Before
docker pull ghcr.io/uncefact/project-identity-resolver:latest

# After
docker pull ghcr.io/uncefact/project-storage-service:3.0.0
```

:::warning
The old image name (`project-identity-resolver`) will not receive new versions. Update your deployment scripts and CI pipelines to pull from `ghcr.io/uncefact/project-storage-service`.
:::

### GitHub Pages

Documentation has moved from `uncefact.github.io/project-identity-resolver` to `uncefact.github.io/project-storage-service`. The old URL redirects automatically, but you should update any bookmarks or links.

### What redirects

- GitHub Pages root URL (redirects to the new site, but deep links will 404)

### What does not redirect

- Git clone, fetch, and push (the old repo name now points to a redirect-only repository)
- Browser links to the old repository, issues, and pull requests
- Docker image pulls (old image name will stop receiving updates)
- Deep links to specific documentation pages
- Any hardcoded references to the old GHCR package name in CI pipelines
