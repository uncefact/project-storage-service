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

The service ships with the OpenTelemetry Node SDK and auto-instrumentations for HTTP, Express, and AWS SDK calls. Tracing is **opt-in**: the SDK starts only when `OTEL_EXPORTER_OTLP_ENDPOINT` is set. With no endpoint configured the service runs with zero SDK overhead.

| Variable                      | Description                                                                                                      | Default                 |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP gRPC endpoint to export traces to (e.g. `http://localhost:4317`). When unset, the SDK does not start.       | _(unset; SDK disabled)_ |
| `OTEL_SERVICE_NAME`           | Overrides the `service.name` resource attribute. The standard OpenTelemetry env var the wider ecosystem expects. | `storage-service`       |
| `DEPLOYMENT_ENVIRONMENT`      | Sets the `deployment.environment.name` resource attribute. Recognised values: `development`, `production`.       | `development`           |

Resource attributes emitted by the service:

| Attribute                     | Source                                                   |
| ----------------------------- | -------------------------------------------------------- |
| `service.name`                | `OTEL_SERVICE_NAME` env var (default `storage-service`)  |
| `service.version`             | `version` field in `package.json`                        |
| `deployment.environment.name` | `DEPLOYMENT_ENVIRONMENT` env var (default `development`) |

## Example Environment File

Example `.env` file for local development:

```env
# Server
PROTOCOL=http
DOMAIN=localhost
PORT=3333
# EXTERNAL_PORT=443

# Authentication (Required)
API_KEY=your-secure-api-key-here

# Storage
STORAGE_TYPE=local
LOCAL_DIRECTORY=uploads

# Buckets
DEFAULT_BUCKET=documents
AVAILABLE_BUCKETS=documents,files

# Logging
# LOG_LEVEL=info        # debug | info | warn | error | fatal
# LOG_PRETTY=true       # Defaults to on in NODE_ENV=development

# OpenTelemetry (opt-in; SDK starts only when OTEL_EXPORTER_OTLP_ENDPOINT is set)
# OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
# OTEL_SERVICE_NAME=storage-service
# DEPLOYMENT_ENVIRONMENT=development
```
