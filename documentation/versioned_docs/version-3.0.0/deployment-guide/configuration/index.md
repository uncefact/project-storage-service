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

| Variable          | Description                                 | Default   |
| ----------------- | ------------------------------------------- | --------- |
| `STORAGE_TYPE`    | Storage provider (`local`, `gcp`, or `aws`) | `local`   |
| `LOCAL_DIRECTORY` | Directory for local file storage            | `uploads` |

For cloud storage provider configuration, see [Storage Providers](../storage-providers/).

## Bucket Configuration

| Variable            | Description                                     | Default           |
| ------------------- | ----------------------------------------------- | ----------------- |
| `DEFAULT_BUCKET`    | Default storage bucket name                     | `documents`       |
| `AVAILABLE_BUCKETS` | Comma-separated list of allowed storage buckets | `documents,files` |

## Upload Configuration

| Variable               | Description                                | Default                                           |
| ---------------------- | ------------------------------------------ | ------------------------------------------------- |
| `MAX_UPLOAD_SIZE`      | Maximum upload size in bytes               | `10485760` (10 MB)                                |
| `ALLOWED_UPLOAD_TYPES` | Comma-separated list of allowed MIME types | `image/png,image/jpeg,image/webp,application/pdf` |

:::info
`MAX_UPLOAD_SIZE` governs the maximum size for both JSON request bodies and multipart file uploads.
:::

## Google Cloud Storage Configuration

| Variable                         | Description                               | Default |
| -------------------------------- | ----------------------------------------- | ------- |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to the GCP service account JSON file | None    |

See [Storage Providers](../storage-providers/) for full Google Cloud Storage setup instructions.

:::caution Disk space considerations for file uploads

Uploaded files are temporarily written to the OS temp directory before being forwarded to storage. Temp files are automatically cleaned up after each upload completes or fails.

When planning your deployment, ensure:

- **Temp directory disk space** can accommodate concurrent uploads at the configured `MAX_UPLOAD_SIZE`. For example, 10 concurrent 10 MB uploads require approximately 100 MB of temporary disk space.
- **`MAX_UPLOAD_SIZE`** is set appropriately for your use case -- lower it if your files are typically smaller.

:::

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
```
