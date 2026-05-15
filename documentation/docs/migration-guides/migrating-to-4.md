---
sidebar_position: 1
title: Migrating to 4.0.0
---

This guide is for users upgrading from version 3.x to 4.0.0. Two breaking changes land together in the 4.0.0 release: the URL path version segment changes shape, and the legacy hex `hash` field is removed from store responses in favour of `digestMultibase`. Work through each section to ensure a smooth transition.

## API URL Path Version Segment

The version segment in the URL path changes from full SemVer (`/api/3.x.x/`) to major-only with a `v` prefix (`/api/v4/`).

### Why this changed

Embedding the full SemVer in the URL inverts what SemVer is for. Minor and patch bumps are non-breaking by definition, so URLs containing the full version forced clients to update on changes that should not have affected them. Major-only paths preserve the original intent: the path changes only when the contract changes.

### Before (3.x)

| Endpoint                            | Method | Path                           |
| ----------------------------------- | ------ | ------------------------------ |
| Store public data (JSON or binary)  | POST   | `/api/3.x.x/public`            |
| Store private data (JSON or binary) | POST   | `/api/3.x.x/private`           |
| Delete a stored resource            | DELETE | `/api/3.x.x/:bucket/:id`       |
| Retrieve a local-storage file       | GET    | `/api/3.x.x/:bucket/:filename` |

### After (4.0.0)

| Endpoint                            | Method | Path                        |
| ----------------------------------- | ------ | --------------------------- |
| Store public data (JSON or binary)  | POST   | `/api/v4/public`            |
| Store private data (JSON or binary) | POST   | `/api/v4/private`           |
| Delete a stored resource            | DELETE | `/api/v4/:bucket/:id`       |
| Retrieve a local-storage file       | GET    | `/api/v4/:bucket/:filename` |

### Migration steps

Replace the version segment in every URL your client calls:

```diff
- POST /api/3.1.0/public
+ POST /api/v4/public

- POST /api/3.1.0/private
+ POST /api/v4/private

- DELETE /api/3.1.0/documents/2ad789c7-e513-4523-a826-ab59e1c423cd
+ DELETE /api/v4/documents/2ad789c7-e513-4523-a826-ab59e1c423cd
```

:::warning
Requests to the old SemVer paths return `404 Not Found`. There is no server-side redirect; the legacy paths are gone, not aliased.
:::

### Stored URIs

If your client persists the `uri` returned from previous store calls, those URIs continue to reference the old path shape. Existing URIs that point at local storage (`http://.../api/3.x.x/<bucket>/<filename>`) will return 404 against a 4.0.0 deployment. Either re-store the data to receive a fresh URI, or rewrite the stored URIs in place to use `/api/v4/`.

URIs returned by S3 or GCS adapters point directly at the object store, not at the storage service, so they are unaffected by the path change.

## Response Field: `hash` Removed, `digestMultibase` Stays

The legacy hex SHA-256 `hash` field is removed from every store response. The `digestMultibase` field (a multibase-encoded multihash) is the sole content-integrity field returned.

### Why this changed

The hex `hash` and `digestMultibase` fields encoded the same digest in two different ways. Carrying both pushed consumers to choose, and the hex form has none of the self-describing properties of the multibase-encoded multihash form: the algorithm and the encoding are recoverable from the `digestMultibase` value alone, without out-of-band metadata.

The multibase-encoded multihash form is also what W3C Verifiable Credentials and the UNTP credentials vocabulary use for content integrity, so dropping the hex form aligns the storage service with the wider ecosystem.

### Before (3.2.x)

```json
{
    "uri": "https://example.com/api/3.1.0/documents/2ad789c7-e513-4523-a826-ab59e1c423cd.json",
    "hash": "d6bb7b579925baa4fe1cec41152b6577003e6a9fde6850321e36ad4ac9b3f30a",
    "digestMultibase": "zQmcnsmRVVuPbmPwesYza9zXSbn5GJMQU4x9RnFDAZdcKCD"
}
```

### After (4.0.0)

```json
{
    "uri": "https://example.com/api/v4/documents/2ad789c7-e513-4523-a826-ab59e1c423cd.json",
    "digestMultibase": "zQmcnsmRVVuPbmPwesYza9zXSbn5GJMQU4x9RnFDAZdcKCD"
}
```

### Migration steps

Update every consumer that reads `response.hash` to read `response.digestMultibase` instead.

```diff
- const integrity = response.hash;
+ const integrity = response.digestMultibase;
```

If you specifically need a hex SHA-256 for legacy interop, decode the multibase digest in your code (base58btc-decode the value, strip the two-byte multihash prefix `0x12 0x20` for sha2-256, and hex-encode the remaining 32 bytes). The W3C VC ecosystem reads `digestMultibase` directly, so this transformation is only needed if a downstream system you do not control still requires hex.

:::warning
The `digestMultibase` value is a multibase-encoded multihash, not a raw hash. Treat it as a self-describing string and use a multibase / multihash library to decode it. Stripping the leading `z` does not give you a hex hash.
:::

## Version File Internals

The `apiVersion` field has been removed from `version.json`. The path segment now lives in the URL routing (`src/routes/v4/`) and no longer needs a separate field.

```diff
// version.json
 {
     "version": "4.0.0",
-    "apiVersion": "3.1.0",
     "docVersion": "4.0.0",
     "dependencies": {}
 }
```

If you have CI or tooling that reads `apiVersion` from `version.json`, update it to read the URL segment from the routing layer or drop the dependency altogether. The new convention is: the URL path version is `v<MAJOR>`, derived from the latest route directory under `src/routes/`.

## Docker images

Pull the 4.0.0 image:

```bash
docker pull ghcr.io/uncefact/project-storage-service:4.0.0
```

The previous `3.x.x` images continue to serve the old URL shape and the old response field. Switching deployments to 4.0.0 is a coordinated client-side update.
