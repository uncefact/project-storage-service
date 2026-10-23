# Storage service release notes

These are the user-facing release notes for the storage service. They focus on what changes for you, the operator or integrator, in each release. For a technical, per-change log see [CHANGELOG.md](./CHANGELOG.md).

## 4.0.2

This patch release changes the user the containers run as. The service image and the documentation site's image now run as the `node` user (uid 1000) instead of root, and both carry a Docker health check. The API contract and the configuration settings are unchanged. If you keep uploads on local storage, or mount a Google Cloud service account file, complete the steps under [Before you deploy 4.0.2](#before-you-deploy-402) first.

- Container image: `ghcr.io/uncefact/project-storage-service:4.0.2` (also tagged `:latest`)

### What changes

- Both images run as `node` (uid 1000). The service image creates `/app/src/uploads`, the default local storage directory, owned by that user.
- The service image checks `GET /health-check` on the container's `PORT` (default 3333) at a configured 30-second interval, with a 15-second start period. Failures during the start period do not count until the first successful check. After that, Docker marks the container unhealthy after three failed checks in a row. The documentation image, which you build from `documentation/Dockerfile`, checks its site root and allows 120 seconds for the first build. Docker and Docker Compose report this status. Kubernetes ignores image health checks, so keep your own probes there.
- The default local storage directories, `uploads` and `src/uploads`, are kept out of the Docker build context, so an image you build from a checkout no longer copies files that a local run stored there. If you set a custom `LOCAL_DIRECTORY`, add `src/<LOCAL_DIRECTORY>` to `.dockerignore` yourself.

### Before you deploy 4.0.2

If you run `:latest`, the next pull after this release fetches 4.0.2, and the next time the container is created or recreated it runs 4.0.2, for example after `docker compose pull` and `docker compose up`, through an automatic updater, or with `imagePullPolicy: Always`. Pin `:4.0.1`, or stop re-pulling `:latest`, until you have completed the steps below.

The container needs write access to its local storage directory as uid 1000. A directory or volume that an earlier image wrote to is owned by root, and 4.0.2 does not change that for you. If you skip these steps, the container starts and reports healthy, but uploads and deletes on local storage fail. Clients get a 500, and the service log shows `EACCES: permission denied`.

Steps 1 to 4 apply when `STORAGE_TYPE` is `local` or unset (`local` is the default). Step 5 applies when it is `gcp`. The `sudo` commands are for a Linux host running standard Docker. With rootless Docker, or with user-namespace remapping, container uid 1000 is a different uid on the host, so a host-side `sudo chown 1000` sets the wrong owner. The container form in step 2 changes the owner of files the container's root user can reach: anything an earlier image wrote and, on rootless Docker, a directory you created. With user-namespace remapping, give a directory you created on the host to the host uid that container uid 1000 maps to (the start of the `dockremap` range in `/etc/subuid` plus 1000).

These are Docker commands. On Kubernetes, give the pod `securityContext.fsGroup: 1000` where the volume type supports it, or an init container that changes the owner, for a volume claim that an earlier version wrote to, and mount the service account Secret with a mode that uid 1000 can read.

1. Stop the running container before you change any ownership, so that it writes no new root-owned files afterwards.

2. Change the owner of your existing uploads directory or volume to uid 1000. On a standard Docker host, for a bind-mounted directory:

    ```bash
    sudo chown -R 1000:1000 <path>
    ```

    The container form below works for a named volume, and for a bind-mounted directory that an earlier image wrote to. For a directory, give its absolute path in place of `<volume>`. By default Docker Compose prefixes a named volume with the project name, such as `myproject_uploads`, so check the real name with `docker volume ls` first. A wrong name creates a new, empty volume, and the command changes that one instead.

    ```bash
    docker run --rm -v <volume>:/data alpine chown -R 1000:1000 /data
    ```

3. For a new deployment with a bind-mounted directory, create the directory owned by uid 1000 before the first run, because Docker creates a missing bind-mount directory owned by root:

    ```bash
    mkdir -p uploads && sudo chown 1000:1000 uploads
    ```

    With rootless Docker, create the directory and change its owner with the container form from step 2 instead. With user-namespace remapping, give it to the mapped uid described above. A new named volume mounted at `/app/src/uploads` needs no preparation, because it takes its owner from the image.

4. If you set `LOCAL_DIRECTORY` to a value other than `uploads`, the image does not create that directory. Mount a directory or volume writable by uid 1000 at `/app/src/<LOCAL_DIRECTORY>`. Docker creates a new named volume at that path owned by root, so change its owner once with the container form in step 2.

5. If you use Google Cloud Storage with a mounted service account file, uid 1000 must be able to read it. A file that uid 1000 can already read needs no change. Otherwise, give the file to uid 1000 and keep it private to that user:

    ```bash
    sudo chown 1000 <key-file> && sudo chmod 600 <key-file>
    ```

    The health check does not read the key, so with an unreadable file the container still reports healthy, and the failure shows on the first storage request.

Then deploy 4.0.2. If you later roll back to 4.0.1, it runs as root again and can create root-owned files, so repeat step 2 before you deploy 4.0.2 again.

## 4.0.1

This is a security patch release. It clears every critical dependency advisory in the service's and the documentation site's lockfiles, moves the other dependencies named below to fixed releases, and closes four denial-of-service advisories in multer. The API contract is unchanged, but the upload endpoint now refuses some requests it used to accept.

- Container image: `ghcr.io/uncefact/project-storage-service:4.0.1` (also tagged `:latest`)

### Upload requests with bracketed field names

Uploads now refuse a multipart field name nested two or more levels deep, such as `a[b][c]`, or one with an array index above 0, such as `items[1]`. These requests get a 400 with a JSON `message`. None of the service's own upload fields uses brackets, so a client that sends only `bucket`, `id` and `file` is unaffected.

Three smaller upload changes come with multer 2.5.0:

- A file of exactly `MAX_UPLOAD_SIZE` bytes is now accepted. It used to get a 413.
- A file sent under the wrong field name is refused with "Unexpected file field" instead of "Unexpected field".
- A `MAX_UPLOAD_SIZE` such as `abc` or `-1` now stops the service at start-up with multer's own error, instead of the service's own configuration message.

### Dependency updates

The service lockfile now resolves axios 1.20.0, follow-redirects 1.16.1, form-data 2.5.6 and 4.0.6, @grpc/grpc-js 1.14.6, undici 6.29.1, fast-uri 3.1.9, proxy-addr 2.0.8 and multer 2.5.0. Development dependencies with critical advisories (handlebars, dompurify and shell-quote) move as well, and so do the documentation site's (proxy-addr, websocket-driver and shell-quote).

The image builds on `node:22-alpine`, so the 4.0.1 image carries the Node 22 release current when it was built, which includes the October 2026 Node security release.

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
