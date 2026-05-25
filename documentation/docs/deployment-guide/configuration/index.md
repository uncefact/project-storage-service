---
sidebar_position: 2
title: Configuration
---

The service is configured through environment variables. If not specified, default values are used.

## Server Configuration

| Variable        | Description                                                                                                                   | Default         |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `PROTOCOL`      | HTTP protocol to use                                                                                                          | `http`          |
| `DOMAIN`        | Server domain                                                                                                                 | `localhost`     |
| `PORT`          | Server port number                                                                                                            | `3333`          |
| `EXTERNAL_PORT` | Port used in generated URLs (Swagger, storage URIs). Useful when the service runs behind a reverse proxy on a different port. | Value of `PORT` |

## Authentication Configuration

| Variable  | Description                                | Default | Required |
| --------- | ------------------------------------------ | ------- | -------- |
| `API_KEY` | API key for authenticating upload requests | None    | **Yes**  |

The service will not start without `API_KEY` set.

## Storage Configuration

| Variable          | Description                                                                                  | Default     |
| ----------------- | -------------------------------------------------------------------------------------------- | ----------- |
| `STORAGE_TYPE`    | Storage provider (`local`, `gcp`, or `aws`)                                                  | `local`     |
| `LOCAL_DIRECTORY` | Directory for local file storage                                                             | `uploads`   |
| `PUBLIC_URL`      | Override base URL for document URIs returned to clients. Applies to `aws` and `gcp` storage. | _(not set)_ |

For cloud storage provider configuration, see [Storage Providers](../storage-providers/).

## Bucket Configuration

| Variable            | Description                                                                                                                                                                                       | Default           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| `DEFAULT_BUCKET`    | Fallback bucket used when a request does not include a `bucket` field. If unset, requests without a bucket return a 400 error. Automatically added to `AVAILABLE_BUCKETS` if not already present. | _(not set)_       |
| `AVAILABLE_BUCKETS` | Comma-separated list of allowed storage buckets                                                                                                                                                   | `documents,files` |

## Upload Configuration

| Variable               | Description                                | Default                                           |
| ---------------------- | ------------------------------------------ | ------------------------------------------------- |
| `MAX_UPLOAD_SIZE`      | Maximum upload size in bytes               | `10485760` (10 MB)                                |
| `ALLOWED_UPLOAD_TYPES` | Comma-separated list of allowed MIME types | `image/png,image/jpeg,image/webp,application/pdf` |

:::info
`MAX_UPLOAD_SIZE` governs the maximum size for both JSON request bodies and multipart file uploads.
:::

:::caution Disk space considerations for file uploads

Uploaded files are temporarily written to the OS temp directory before being forwarded to storage. Temp files are automatically cleaned up after each upload completes or fails.

When planning your deployment, ensure:

- **Temp directory disk space** can accommodate concurrent uploads at the configured `MAX_UPLOAD_SIZE`. For example, 10 concurrent 10 MB uploads require approximately 100 MB of temporary disk space.
- **`MAX_UPLOAD_SIZE`** is set appropriately for your use case -- lower it if your files are typically smaller.

:::

## Google Cloud Storage Configuration

| Variable                         | Description                               | Default |
| -------------------------------- | ----------------------------------------- | ------- |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to the GCP service account JSON file | None    |

See [Storage Providers](../storage-providers/) for full Google Cloud Storage setup instructions.

## Logging Configuration

The service emits structured JSON logs via [Pino](https://github.com/pinojs/pino). Every log line carries a `correlationId` matching the request that produced it.

| Variable     | Description                                                                                                                                                                                                                                            | Default   |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| `LOG_LEVEL`  | Minimum log level (`debug`, `info`, `warn`, `error`, `fatal`).                                                                                                                                                                                         | `info`    |
| `LOG_PRETTY` | Set to `true` to format logs for human reading (via `pino-pretty`). When unset, pretty output is enabled automatically only in `NODE_ENV=development`. Production should leave this unset so logs stay structured JSON for ingestion by log pipelines. | _(unset)_ |

### Correlation IDs

Every response carries an `x-correlation-id` header. Inbound `x-correlation-id` request headers are accepted and propagated when they pass validation (max 128 characters, charset `[A-Za-z0-9_-]`); invalid or missing values are replaced by a freshly minted UUID. Use this to trace a single logical request across services.

The `decryptionKey` field returned by `/private` uploads and the `x-api-key`, `authorization`, and `cookie` request headers are redacted from log output as a safety measure if they are ever logged.

## OpenTelemetry Configuration

The service ships with the OpenTelemetry Node SDK and auto-instrumentations for HTTP, Express, and AWS SDK calls. Tracing is **opt-in**: the SDK starts only when an OTLP endpoint (`OTEL_EXPORTER_OTLP_ENDPOINT` or `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`) is set. With no endpoint configured the service runs with zero SDK overhead. Traces export over OTLP/gRPC by default; set `OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf` to export over OTLP/HTTP, for example to reach a collector that accepts HTTP only.

| Variable                                | Description                                                                                                                                                                                                                                                                                              | Default                 |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`           | Endpoint to export traces to. The SDK starts when this or `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` is set; with neither set it does not start. For gRPC use the base address (e.g. `http://localhost:4317`); for HTTP use the base URL (e.g. `http://localhost:4318`) and the exporter appends `/v1/traces`. | _(unset; SDK disabled)_ |
| `OTEL_EXPORTER_OTLP_PROTOCOL`           | Export transport: `grpc` or `http/protobuf`. An unrecognised value falls back to `grpc` and logs a warning.                                                                                                                                                                                              | `grpc`                  |
| `OTEL_SERVICE_NAME`                     | Overrides the `service.name` resource attribute. The standard OpenTelemetry env var the wider ecosystem expects.                                                                                                                                                                                         | `storage-service`       |
| `DEPLOYMENT_ENVIRONMENT`                | Sets the `deployment.environment.name` resource attribute. Recognised values: `development`, `production`.                                                                                                                                                                                               | `development`           |
| `OTEL_EXPORTER_OTLP_CLIENT_CERTIFICATE` | Path to the client certificate (PEM) presented for mutual TLS. Required only when the collector enforces mTLS.                                                                                                                                                                                           | _(unset)_               |
| `OTEL_EXPORTER_OTLP_CLIENT_KEY`         | Path to the client private key (PEM) for the mTLS client certificate.                                                                                                                                                                                                                                    | _(unset)_               |
| `OTEL_EXPORTER_OTLP_CERTIFICATE`        | Path to the CA certificate (PEM) used to verify the collector. Omit when the collector presents a publicly trusted certificate.                                                                                                                                                                          | _(unset)_               |

For a collector behind mutual TLS, use an `https://` endpoint and set the three certificate paths above; the SDK reads the PEM files at those paths and presents the client certificate on each export. This applies to both transports.

:::note
The `/v1/traces` path is appended only to the base `OTEL_EXPORTER_OTLP_ENDPOINT`. If you instead set the signal-specific `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, it is used verbatim, so that value must already include the full path.
:::

Resource attributes emitted by the service:

| Attribute                     | Source                                                   |
| ----------------------------- | -------------------------------------------------------- |
| `service.name`                | `OTEL_SERVICE_NAME` env var (default `storage-service`)  |
| `service.version`             | `version` field in `package.json`                        |
| `deployment.environment.name` | `DEPLOYMENT_ENVIRONMENT` env var (default `development`) |

## Example Environment File

Example `.env` file for local development:

```env
# Server Configuration
PROTOCOL=http
DOMAIN=localhost
PORT=3333
# EXTERNAL_PORT=443

# Authentication (Required)
# The API key used to authenticate upload requests
API_KEY=your-secure-api-key-here

# Storage Configuration
# Options: local | gcp | aws
STORAGE_TYPE=local
LOCAL_DIRECTORY=uploads

# Bucket Configuration
# DEFAULT_BUCKET is used as a fallback when a request does not include a bucket.
# If unset, requests without a bucket will receive a 400 error.
DEFAULT_BUCKET=documents
AVAILABLE_BUCKETS=documents,files

# Public URL Override
# When using a CDN or custom domain, override the base URL for document URIs returned to clients.
# Uploads still go to the configured storage provider. Only the URI in API responses changes.
# Applies to: aws, gcp (ignored for local storage)
# PUBLIC_URL=https://cdn.example.com

# Cloud Provider Credentials (if using cloud storage)

# Google Cloud Platform
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-file.json

# AWS S3 / S3-Compatible Providers (MinIO, DigitalOcean Spaces, Cloudflare R2, etc.)
# S3_REGION=ap-southeast-2           # Required for AWS S3, optional with custom endpoint
# S3_ENDPOINT=http://localhost:9000  # Custom endpoint for S3-compatible providers
# S3_FORCE_PATH_STYLE=true           # Required for MinIO, Cloudflare R2
# AWS_ACCESS_KEY_ID=your-access-key-id
# AWS_SECRET_ACCESS_KEY=your-secret-access-key

# File Upload Configuration
# MAX_UPLOAD_SIZE=10485760
# ALLOWED_UPLOAD_TYPES=image/png,image/jpeg,image/webp,application/pdf

# Logging Configuration
# LOG_LEVEL=info        # debug | info | warn | error | fatal
# LOG_PRETTY=true       # Pretty-format logs via pino-pretty.
                        # Defaults to on in NODE_ENV=development; leave unset in production.

# OpenTelemetry Configuration (opt-in)
# Set OTEL_EXPORTER_OTLP_ENDPOINT to enable tracing; the SDK does nothing when
# unset. Traces export over OTLP/gRPC by default; set OTEL_EXPORTER_OTLP_PROTOCOL
# to http/protobuf to export over OTLP/HTTP instead.
# For gRPC use the base address; for HTTP use the base URL (the exporter appends
# /v1/traces itself).
# OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
# OTEL_EXPORTER_OTLP_PROTOCOL=grpc   # grpc | http/protobuf
# OTEL_SERVICE_NAME=storage-service
# DEPLOYMENT_ENVIRONMENT=development   # development | production
#
# When the collector requires mutual TLS, use an https:// endpoint and point
# these at the PEM files the SDK should present / trust (both transports):
# OTEL_EXPORTER_OTLP_CLIENT_CERTIFICATE=/path/to/client.crt
# OTEL_EXPORTER_OTLP_CLIENT_KEY=/path/to/client.key
# OTEL_EXPORTER_OTLP_CERTIFICATE=/path/to/ca.crt
```
