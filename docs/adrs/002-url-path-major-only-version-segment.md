# ADR: URL path version segment is major-only, sourced from the routes directory

- **Date:** 2026-05-19
- **Status:** accepted

## Context

Through 3.2.x, the storage service embedded the full SemVer of the API in every URL path: `/api/3.1.0/public`, `/api/3.2.1/:bucket/:id`, and so on. The runtime read the value from an `apiVersion` field in `version.json` at startup and used it as the URL prefix.

This shape inverts what SemVer is for. Minor and patch bumps are non-breaking by definition; the API contract is, by definition, unchanged for clients. But embedding the full SemVer in the path means a minor or patch bump produces new URLs, which forces every client to update on bumps that do not affect them. Either the contract guarantee is meaningless or the URL is structured wrong; the URL is structured wrong.

A second observation: deriving the URL prefix from a runtime config value (the `apiVersion` field) made the routing layer dependent on a file read at startup. The actual source of truth for "what API major does this service expose" lives in the routes themselves; the config value duplicates that information and creates room for the two to drift.

The decision needs to cover the URL shape, where the URL prefix is sourced from, and what (if anything) keeps `apiVersion` in `version.json` doing.

## Decision

Three coupled changes:

1. **URL path version segment becomes `v<MAJOR>`.** `/api/3.1.0/public` becomes `/api/v4/public`. The path changes only when the API contract changes (i.e. on a MAJOR bump).
2. **The URL prefix is sourced from the routes directory.** The router that mounts `/api/v4` imports from `src/routes/v4/`. There is no runtime read of a config value to determine which version segment appears in the URL; the directory layout is the source of truth, and route imports are static.
3. **`apiVersion` in `version.json` switches from full SemVer to `MAJOR.MINOR`.** It documents the API contract version as published to consumers. The MAJOR of `apiVersion` is kept in lockstep with the URL path's `v<MAJOR>` (human responsibility, not enforced at runtime). The MINOR bumps when backwards-compatible additions land on the API surface and do not change the URL. The value is read once at startup and bound to the Swagger `info.version` field so the published OpenAPI document carries the same contract version that `version.json` records.

The result: the URL is determined by where the routes live, and `apiVersion` is a small documentation surface that propagates the contract version through to the published OpenAPI document. The two are intentionally separate concerns kept aligned by a small, visible rule.

## Consequences

**What becomes easier:**

- Clients only update URLs when the contract genuinely breaks. Minor and patch bumps are invisible at the URL level.
- The routes directory is the canonical answer to "what API version does this service expose." Adding a new major version means adding a directory and a router; deleting an old one means deleting the directory. There is no parallel config to update.
- Swagger `info.version` is sourced from `version.json`, so consumers reading the OpenAPI document see the same version string the repository records.

**What becomes more difficult:**

- This is a breaking change. Existing URIs that point at `/api/3.x.x/...` (notably those persisted by clients of the local-storage adapter) return 404 against a 4.0.0 deployment. Mitigation is documented in the 4.0.0 migration guide; there is no server-side redirect.
- The lockstep between the URL's `v<MAJOR>` and `apiVersion`'s MAJOR is a human responsibility. Nothing at runtime enforces it. A reviewer must catch the case where someone bumps `apiVersion` to `5.0` without also adding `src/routes/v5/`, or vice versa.
- Rolling a new major now requires creating a new routes directory rather than bumping a config string. This is a small extra step but it is mechanical, and it is the cost of making the directory the source of truth.

## Alternatives Considered

### Keep full SemVer in the URL

Rejected. Defeats the purpose of SemVer. Minor and patch bumps are non-breaking by definition, so URLs containing the full version force clients to update on bumps that should be invisible to them.

### Major-only URL, but source the value from `version.json` (or an env var) at runtime

Rejected. Once the URL is major-only, the routes directory is the natural source of truth: the major appears in the directory name (`src/routes/v<MAJOR>/`) and in the route registration. Introducing a runtime read of a config string adds an indirection that can drift from the routes layout and offers no benefit; the URL is determined by where the code lives, not by a string in a file.

### Dynamically discover routes from the filesystem at startup

Rejected. Static imports keep startup behaviour predictable, keep the dependency graph visible to tooling and bundlers, and avoid coupling the routing layer to filesystem shape. Filesystem-driven discovery also makes it harder to reason about what is mounted where without running the service.

### Remove `apiVersion` from `version.json` entirely; inline `"4.0"` in `src/app.ts` for Swagger

Considered, then rejected after review. The runtime cost of reading `version.json` once at startup is negligible, and keeping `apiVersion` in `version.json` gives a single, file-based source of truth for the contract version that flows through to the published OpenAPI document. Inlining the value would create a second place that has to be updated when MINOR moves, and the file is the more discoverable home (it's already where consumers and CI tooling look for version information).

### Carry both URL shapes during a transition (`/api/3.x.x/...` and `/api/v4/...`)

Rejected. The point of the major-only URL is that path changes signal contract changes; introducing the same surface under two paths for a transition window blurs the signal, doubles the routing surface to maintain, and lengthens the deprecation cycle. The migration is mechanical (clients change the prefix), so a clean cut is the simpler path.

## References

- #115 (PR introducing the URL path change)
- `src/routes/v4/`
- `src/config.ts` (`getApiVersion`, `API_VERSION`)
- `src/app.ts` (Swagger `info.version` binding)
- `documentation/docs/migration-guides/migrating-to-4.md`
