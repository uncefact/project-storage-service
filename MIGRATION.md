# Migrating from 2.x to 3.0.0

This guide covers all breaking changes when upgrading from version 2.x to 3.0.0.

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

```
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

Update any code that reads the `key` field from `/credentials` responses to use `decryptionKey` from `/private` responses instead.

## Environment Variable Changes

### Renamed variables

| Before (2.x)           | After (3.0.0)          | Default                                           |
| ---------------------- | ---------------------- | ------------------------------------------------- |
| `MAX_BINARY_FILE_SIZE` | `MAX_UPLOAD_SIZE`      | `10485760` (10 MB)                                |
| `ALLOWED_BINARY_TYPES` | `ALLOWED_UPLOAD_TYPES` | `image/png,image/jpeg,image/webp,application/pdf` |

The old variable names are no longer recognised. Update your `.env` files and deployment configurations.

### Changed default bucket names

| Before (2.x)                                                                    | After (3.0.0)                       |
| ------------------------------------------------------------------------------- | ----------------------------------- |
| `DEFAULT_BUCKET=verifiable-credentials`                                         | `DEFAULT_BUCKET=documents`          |
| `AVAILABLE_BUCKETS=verifiable-credentials,files,private-verifiable-credentials` | `AVAILABLE_BUCKETS=documents,files` |

If you rely on the default bucket names, update your `AVAILABLE_BUCKETS` and `DEFAULT_BUCKET` environment variables. If you already set these explicitly, no change is needed.

## Node.js Version

The minimum Node.js version is now **22** (previously 18). Update your runtime environment, CI pipelines, and Docker base images accordingly.

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

The old image name (`project-identity-resolver`) will not receive new versions.

### GitHub Pages

Documentation has moved from `uncefact.github.io/project-identity-resolver` to `uncefact.github.io/project-storage-service`. The old URL redirects automatically, but you should update any bookmarks or links.

### What redirects automatically

- Git clone, fetch, and push (GitHub handles this indefinitely)
- Browser links to the repository, issues, and pull requests

### What does not redirect

- Docker image pulls (old image name will stop receiving updates)
- GitHub Pages URL (different subdirectory)
- Any hardcoded references to the old GHCR package name in CI pipelines

## Summary Checklist

- [ ] Update API endpoint paths (`/documents` → `/public`, `/files` → `/public`, `/credentials` → `/private`)
- [ ] Update API version in paths (`2.0.0` → `3.0.0`)
- [ ] Update response parsing (`key` → `decryptionKey` for private data)
- [ ] Rename environment variables (`MAX_BINARY_FILE_SIZE` → `MAX_UPLOAD_SIZE`, `ALLOWED_BINARY_TYPES` → `ALLOWED_UPLOAD_TYPES`)
- [ ] Review default bucket names if not explicitly configured
- [ ] Upgrade Node.js to v22+
- [ ] Update Docker image references to `ghcr.io/uncefact/project-storage-service`
- [ ] Update git remote URL (optional; old URL redirects)
- [ ] Update any bookmarks or links to the GitHub Pages documentation site
