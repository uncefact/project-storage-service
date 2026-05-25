# Storage Service

The storage service directory contains an Express REST API
that provides endpoints to store, encrypt, and delete documents.

## Overview

The service offers the following functionality:

- **Digest Computation**:
  Computes a multibase-encoded multihash (`digestMultibase`) of the document so consumers can verify data integrity without out-of-band metadata about the algorithm or encoding.
- **Encryption**:
  Encrypts the document using AES-256-GCM for enhanced security.
- **Storage**:
  Stores the encrypted document using the specified storage adapter
  (local file system, AWS S3 and S3-compatible providers, or Google Cloud Storage).
- **Data Retrieval**:
  Upon successful storage, the service returns:
    - A multibase-encoded multihash (`digestMultibase`) of the original document.
    - A decryption key for the encrypted document (if applicable).
    - The URI of the stored encrypted document.

## Choosing Your Storage Endpoint

This service offers two ways to store data, depending on whether your data is public or private.

### Public Data → [`/public`](#store-public-data)

For data that doesn't require protection. Accepts both JSON (`application/json`) and binary files (`multipart/form-data`). The service stores your content as-is and returns:

- A **URI** (the location of your stored data)
- A **digestMultibase** (a multibase-encoded multihash fingerprint, used to verify the data hasn't changed)

Allowed file types and maximum upload size are [configurable](#file-upload-configuration).

### Private Data → [`/private`](#store-private-data)

For sensitive data that needs protection. Accepts both JSON (`application/json`) and binary files (`multipart/form-data`). The service automatically encrypts your data before storage — you don't need to encrypt it yourself.

The response includes:

- A **URI** (the location of your stored data)
- A **digestMultibase** (a multibase-encoded multihash fingerprint, used to verify the data hasn't changed)
- A **decryptionKey** (your unique decryption key)

**Save this key securely** — it's the only way to decrypt your data later.

### Deleting Data → `DELETE /:bucket/:id`

Remove any previously stored resource — public or encrypted — by specifying its bucket and ID. The service uses prefix matching to locate the resource regardless of file extension.

The response is `204 No Content` with no body.

→ [Learn more about storage options](https://uncefact.github.io/project-storage-service/docs/understanding/how-it-works)

## Prerequisites

- [Node.js](https://nodejs.org/) (v22)
- [Yarn](https://yarnpkg.com/) (>= 1.22.21)

## Environment Variables

An example environment file `.env.example` is provided in the storage service directory.
Copy and rename it to `.env`:

```bash
cp .env.example .env
```

Then modify the variables as required.
The default values should be sufficient for local development.

## Usage

```bash
# Install dependencies
yarn install

# Build the app
yarn build

# Run the app and watch for changes
yarn dev

# Start the server once built
yarn start

# Run linter
yarn lint

# Run unit tests
yarn test

# Run e2e tests (requires Docker)
yarn test:e2e
```

## Configuration

Configure the storage service using the following environment variables:

### Server Configuration

- `PROTOCOL`:
  HTTP protocol to use (default: `http`).
- `DOMAIN`:
  Server domain (default: `localhost`).
- `PORT`:
  Server port number (default: `3333`).
- `EXTERNAL_PORT`:
  Port used in generated URLs (Swagger UI, storage URIs). Useful when the service runs behind a reverse proxy on a different port. Defaults to the value of `PORT`.

### Authentication

- `API_KEY`:
  **Required**. The API key used to authenticate requests to `/public`, `/private`, and `DELETE /:bucket/:id` endpoints.
  The service will not start without this variable set.

### Storage Configuration

- `STORAGE_TYPE`:
  The type of storage to use (`local`, `gcp`, or `aws`).
- `LOCAL_DIRECTORY`:
  The directory for local storage (default: `uploads` in the current directory).
- `GOOGLE_APPLICATION_CREDENTIALS`:
  The path to the GCP service account file (if using GCP).

### File Upload Configuration

- `MAX_UPLOAD_SIZE`:
  Maximum file size in bytes for binary uploads (default: `10485760` — 10 MB).
- `ALLOWED_UPLOAD_TYPES`:
  Comma-separated list of permitted MIME types (default: `image/png,image/jpeg,image/webp,application/pdf`).

### Logging

The service emits structured JSON logs via [Pino](https://github.com/pinojs/pino). Every log line includes a `correlationId` matching the request that produced it.

- `LOG_LEVEL`:
  Minimum level emitted: `debug`, `info`, `warn`, or `error` (default: `info`).
- `LOG_PRETTY`:
  Set to `true` to format logs for human reading (uses `pino-pretty`). Off by default; production should leave this unset so logs stay structured JSON for ingestion by log pipelines.

### Correlation IDs

Every response carries an `x-correlation-id` header. Inbound `x-correlation-id` request headers are accepted and propagated when they pass validation (max 128 characters, charset `[A-Za-z0-9_-]`); invalid or missing values are replaced by a freshly minted UUID. Use this to trace a single logical request across services.

### OpenTelemetry

The service ships with the OpenTelemetry Node SDK and auto-instrumentations for HTTP, Express, and AWS SDK calls. Tracing is **opt-in**: the SDK starts only when `OTEL_EXPORTER_OTLP_ENDPOINT` is set. With no endpoint configured the service runs as before with zero SDK overhead.

Traces are exported over OTLP/gRPC by default. Set `OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf` to export over OTLP/HTTP instead, for example to reach a collector that accepts HTTP only.

- `OTEL_EXPORTER_OTLP_ENDPOINT`:
  Endpoint to export traces to. The SDK starts when this or the signal-specific `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` is set; with neither set it does not start. For gRPC use the base address (e.g. `http://localhost:4317`); for HTTP use the base URL (e.g. `http://localhost:4318`) and the exporter appends the `/v1/traces` path itself.
- `OTEL_EXPORTER_OTLP_PROTOCOL`:
  Export transport: `grpc` (default) or `http/protobuf`. An unrecognised value falls back to `grpc` and logs a warning.
- `OTEL_SERVICE_NAME`:
  Overrides the `service.name` resource attribute (default: `storage-service`). The standard OpenTelemetry env var the wider ecosystem expects.
- `DEPLOYMENT_ENVIRONMENT`:
  Resource attribute `deployment.environment.name`. Valid values are `development` (default; covers laptops and the deployed dev environment) and `production`. Set this to `production` in prod deployments so dashboards can tenant signals by environment.

When the collector sits behind mutual TLS, point the exporter at the `https://` endpoint and supply the client credentials via the standard OpenTelemetry env vars; the SDK reads the PEM files at the given paths (these apply to both transports):

- `OTEL_EXPORTER_OTLP_CLIENT_CERTIFICATE`: path to the client certificate (PEM) presented for mTLS.
- `OTEL_EXPORTER_OTLP_CLIENT_KEY`: path to the client private key (PEM) for that certificate.
- `OTEL_EXPORTER_OTLP_CERTIFICATE`: path to the CA certificate (PEM) used to verify the collector. Omit when the collector presents a publicly trusted certificate.

Resource attributes the SDK emits with every span:

| Attribute                     | Value                                                    |
| ----------------------------- | -------------------------------------------------------- |
| `service.name`                | `OTEL_SERVICE_NAME` env var (default `storage-service`)  |
| `service.version`             | Read from `package.json`                                 |
| `deployment.environment.name` | `DEPLOYMENT_ENVIRONMENT` env var (default `development`) |

### S3-Compatible Storage (AWS, MinIO, DigitalOcean Spaces, Cloudflare R2, etc.)

- `S3_REGION`:
  The AWS region (required for AWS S3, optional when using custom endpoint).
- `S3_ENDPOINT`:
  Custom endpoint URL for S3-compatible providers (e.g., `http://localhost:9000` for MinIO).
- `S3_FORCE_PATH_STYLE`:
  Set to `true` for path-style URLs (required for MinIO, Cloudflare R2).
- `AWS_ACCESS_KEY_ID`:
  The access key for S3-compatible storage.
- `AWS_SECRET_ACCESS_KEY`:
  The secret access key for S3-compatible storage.

## Storage Types

### Local Storage

For development purposes,
use the local storage service,
which stores files in the local file system.

Example:

```bash
# Set the storage type to local
export STORAGE_TYPE=local

# Run the app
yarn dev
```

The Swagger UI is available at `http://localhost:3333/api-docs`.

### Google Cloud Storage

For production environments,
use Google Cloud Storage to store files in a GCP bucket.

Example:

```bash
# Set the storage type to gcp
export STORAGE_TYPE=gcp

# Set the path to the GCP service account file
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-file.json

# Build the app
yarn build

# Run the app
yarn start
```

### Amazon Web Services (AWS)

For production, we recommend using IAM roles. See the [AWS documentation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html).

```bash
export STORAGE_TYPE=aws
export S3_REGION=ap-southeast-2
export AWS_ACCESS_KEY_ID=your-access-key      # Local development only
export AWS_SECRET_ACCESS_KEY=your-secret-key  # Local development only

yarn build && yarn start
```

### S3-Compatible Providers

The `aws` storage type supports any S3-compatible provider by configuring a custom endpoint.

**MinIO (local development):**

```bash
export STORAGE_TYPE=aws
export S3_ENDPOINT=http://localhost:9000
export S3_FORCE_PATH_STYLE=true
export AWS_ACCESS_KEY_ID=minioadmin
export AWS_SECRET_ACCESS_KEY=minioadmin

yarn build && yarn start
```

**DigitalOcean Spaces:**

```bash
export STORAGE_TYPE=aws
export S3_ENDPOINT=https://syd1.digitaloceanspaces.com
export AWS_ACCESS_KEY_ID=your-do-access-key
export AWS_SECRET_ACCESS_KEY=your-do-secret-key

yarn build && yarn start
```

**Cloudflare R2:**

```bash
export STORAGE_TYPE=aws
export S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
export S3_FORCE_PATH_STYLE=true
export AWS_ACCESS_KEY_ID=your-r2-access-key
export AWS_SECRET_ACCESS_KEY=your-r2-secret-key

yarn build && yarn start
```

## Cryptography

The cryptography service uses the following algorithms:

- **Hash Algorithm**:
  SHA-256
- **Encryption Algorithm**:
  AES-256-GCM

## Authentication

All endpoints require API key authentication via the `X-API-Key` header.

Examples:

```bash
# Store public JSON data (no encryption)
curl -X POST http://localhost:3333/api/v4/public \
-H "Content-Type: application/json" \
-H "X-API-Key: your-api-key-here" \
-d '{"bucket": "documents", "data": {"field1": "value1"}}'

# Store private JSON data (encrypted)
curl -X POST http://localhost:3333/api/v4/private \
-H "Content-Type: application/json" \
-H "X-API-Key: your-api-key-here" \
-d '{"bucket": "documents", "data": {"field1": "value1"}}'

# Upload a public binary file
curl -X POST http://localhost:3333/api/v4/public \
-H "X-API-Key: your-api-key-here" \
-F "bucket=files" \
-F "file=@/path/to/image.png"

# Delete a stored resource
curl -X DELETE http://localhost:3333/api/v4/documents/123e4567-e89b-12d3-a456-426614174000 \
-H "X-API-Key: your-api-key-here"
```

If the API key is missing or invalid, the service will return a `401 Unauthorized` response.

## Docker Images

Pre-built Docker images are available on [GitHub Container Registry](https://github.com/uncefact/project-storage-service/pkgs/container/project-storage-service).

Images support `linux/amd64` and `linux/arm64` architectures (Intel/AMD and Apple Silicon/ARM).

### Pulling Images

```bash
# Pull a specific version (e.g., 4.0.0)
docker pull ghcr.io/uncefact/project-storage-service:4.0.0

# Or pull the latest release
docker pull ghcr.io/uncefact/project-storage-service:latest

# Or pull the rolling head of main
docker pull ghcr.io/uncefact/project-storage-service:main

# Or pin to a specific main commit
docker pull ghcr.io/uncefact/project-storage-service:main-<short-sha>
```

### Building and Running Locally with Docker

```bash
# Build the image
docker build -t storage-service:latest .

# Start the container using local storage
# Configure your .env file first with API_KEY and other required variables
docker run -d --env-file .env -p 3333:3333 \
  storage-service:latest

# If exposing on a different port (e.g., 443), set EXTERNAL_PORT so
# Swagger and storage URIs reflect the external address:
# docker run -d --env-file .env -p 443:3333 -e EXTERNAL_PORT=443 \
#   storage-service:latest

# Start the container using Google Cloud Storage
# Update STORAGE_TYPE=gcp in your .env file and mount the service account file
docker run -d --env-file .env -p 3333:3333 \
-v /path/to/local/gcp/service-account-file.json:/tmp/service-account-file.json \
storage-service:latest

# Start the container using Amazon Web Services (AWS) or S3-compatible storage
# Update STORAGE_TYPE=aws and S3 credentials in your .env file
# For S3-compatible providers, also set S3_ENDPOINT and S3_FORCE_PATH_STYLE
docker run -d --env-file .env -p 3333:3333 \
storage-service:latest
```

## Documentation

Full documentation is available at [uncefact.github.io/project-storage-service](https://uncefact.github.io/project-storage-service/).

The documentation site covers:

- **Understanding** — what the service does and how it works
- **Developer Guide** — API reference with request/response examples
- **Deployment Guide** — installation, configuration, storage providers, and scaling
- **Contributing** — development setup, coding standards, and release process
