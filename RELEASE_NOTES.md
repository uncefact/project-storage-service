# Storage service release notes

These are the user-facing release notes for the storage service. They focus on what changes for you, the operator or integrator, in each release. For a technical, per-change log see [CHANGELOG.md](./CHANGELOG.md).

## 4.0.0

This release introduces two breaking changes to the API contract and lands a substantial round of observability work. Plan a coordinated update of any client that calls the storage service.

- Migration guide: [Migrating to 4.0.0](./documentation/docs/migration-guides/migrating-to-4.md)
- Container image: `ghcr.io/uncefact/project-storage-service:4.0.0` (also tagged `:latest`)

### URL paths now use a major-only version segment

The path version segment changes from full [SemVer](https://semver.org/) (`/api/3.x.x/...`) to `v<MAJOR>`:

```
Before: POST /api/3.1.0/public
After:  POST /api/v4/public
```

Minor and patch bumps to the API are non-breaking by definition, so URLs no longer change when the contract has not changed.

This URI change only affects deployments using the **local storage adapter**: persisted URIs that point at `http://.../api/3.x.x/<bucket>/<filename>` return 404 against a 4.0.0 deployment. There is no server-side redirect; either re-store the data to receive a fresh URI or rewrite the stored URIs in place. URIs returned by the S3 and GCS adapters point directly at the object store, not at the storage service, so they are unaffected by the path change.

### Response field: `hash` is gone, `digestMultibase` is the integrity field

The hex SHA-256 `hash` field is removed from every store response and replaced by `digestMultibase`, a [multibase](https://github.com/multiformats/multibase)-encoded [multihash](https://github.com/multiformats/multihash). The multibase form is self-describing (the algorithm and the encoding are recoverable from the value alone), so you can verify content integrity without out-of-band metadata about which algorithm or which encoding was used.

```jsonc
// Before (3.2.x)
{ "uri": "...", "hash": "d6bb7b...9b3f30a" }

// After (4.0.0)
{ "uri": "...", "digestMultibase": "zQmcnsmRVVuPbmPwesYza9zXSbn5GJMQU4x9RnFDAZdcKCD" }
```

If a downstream system you do not control still needs hex SHA-256, decode the multibase digest in your code (base58btc-decode, strip the two-byte multihash prefix `0x12 0x20` for sha2-256, hex-encode the remaining 32 bytes).

### Structured logging with correlation IDs

Every log line is now structured JSON, emitted by [Pino](https://github.com/pinojs/pino). Each line carries a `correlationId` field; either the value of the inbound `x-correlation-id` header (after validation) or a freshly minted UUID when the header is absent or malformed. The same id is echoed on the response so your client can trace the request without parsing the body. Inbound header values are length-capped at 128 characters and restricted to `[A-Za-z0-9_-]`; malformed values are replaced with a fresh UUID and the rejection is recorded as a warning.

Sensitive fields are redacted from log output: the `decryptionKey` returned by private uploads and the `x-api-key`, `authorization`, and `cookie` request headers if they are ever logged. Pretty-formatted output is enabled automatically in development (`NODE_ENV=development`); production and test environments emit raw JSON.

### Opt-in OpenTelemetry traces

The service can now emit OpenTelemetry traces over OTLP/gRPC, with HTTP and Express auto-instrumentation enabled out of the box. The SDK starts only when `OTEL_EXPORTER_OTLP_ENDPOINT` is set; deployments that have not adopted observability tooling run unchanged. Each span carries resource attributes (`service.name`, `service.version`, `deployment.environment.name`) that let your backend tenant signals correctly. See the README's Observability section for the full env-var contract.

### Trunk-based release flow

We have moved to trunk-based development with a single `main` branch. Releases are cut by tagging from `main` (`v<X.Y.Z>`); the Docker workflow builds and pushes the release image, and the human-facing release notes you are reading now live in this file at the tagged commit. `release-please` is gone; release notes and the changelog are maintained by hand alongside the code change. See `RELEASE_MANAGEMENT_GUIDE.md` for the flow.

### Dependency security sweep

A coordinated set of dependency updates closes the open dependabot alerts on the root `yarn.lock` (criticals + highs + mediums + lows) and the high alerts on `documentation/yarn.lock`. Notable transitive bumps include `axios`, `protobufjs`, `fast-xml-parser`, `handlebars`, `undici`, `lodash`, and `dompurify`. No application code changes flowed from this work; the bumps are driven by GHSA advisories pinned via `package.json` `resolutions` entries.

### Docker images

- `ghcr.io/uncefact/project-storage-service:4.0.0`
- `ghcr.io/uncefact/project-storage-service:latest`
- `ghcr.io/uncefact/project-storage-service:main` (rolling head of `main`)
- `ghcr.io/uncefact/project-storage-service:main-<short-sha>` (pinnable per commit on the main branch)

Existing `3.x.x` images continue to serve the old URL shape and the old response field unchanged.
