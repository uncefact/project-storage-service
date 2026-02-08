---
sidebar_position: 2
title: Getting Started
---

## Prerequisites

Before you begin, ensure you have installed:

- [Node.js](https://nodejs.org/) (v18.18.0)
- [Yarn](https://yarnpkg.com/) (>= 1.22.21)

## Basic Setup

1. Clone the [Storage Service repository](https://github.com/uncefact/project-identity-resolver)
2. Copy `.env.example` to `.env`
3. Configure your environment variables (see [Configuration section](/docs/getting-started/#configuration))
4. Install dependencies:

```bash
yarn install
```

## Configuration

The service can be configured through environment variables. If not specified, the following default values will be used:

### Server Configuration

| Variable        | Description          | Default     |
| --------------- | -------------------- | ----------- |
| `PROTOCOL`      | HTTP protocol to use | `http`      |
| `DOMAIN`        | Server domain        | `localhost` |
| `PORT`          | Server port number   | `3333`      |
| `EXTERNAL_PORT` | Port used in generated URLs (Swagger, storage URIs). Useful when the service runs behind a reverse proxy on a different port. | Value of `PORT` |

### Authentication Configuration

| Variable  | Description                                | Default | Required |
| --------- | ------------------------------------------ | ------- | -------- |
| `API_KEY` | API key for authenticating upload requests | None    | **Yes**  |

### Storage Configuration

| Variable          | Description                                 | Default   |
| ----------------- | ------------------------------------------- | --------- |
| `STORAGE_TYPE`    | Storage provider (`local`, `gcp`, or `aws`) | `local`   |
| `LOCAL_DIRECTORY` | Directory for local file storage            | `uploads` |


### Bucket Configuration

| Variable            | Description                                     | Default                  |
| ------------------- | ----------------------------------------------- | ------------------------ |
| `DEFAULT_BUCKET`    | Default storage bucket name                     | `verifiable-credentials` |
| `AVAILABLE_BUCKETS` | Comma-separated list of allowed storage buckets | `verifiable-credentials,files` |

### File Upload Configuration

| Variable              | Description                                      | Default                                                       |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------- |
| `MAX_UPLOAD_SIZE`     | Maximum file upload size in bytes                | `10485760` (10 MB)                                            |
| `ALLOWED_UPLOAD_TYPES` | Comma-separated list of allowed MIME types      | `image/png,image/jpeg,image/webp,application/pdf`   |

:::caution Disk space considerations for file uploads

Uploaded files are temporarily written to the OS temp directory before being forwarded to storage. Temp files are automatically cleaned up after each upload completes or fails.

When planning your deployment, ensure:
- **Temp directory disk space** can accommodate concurrent uploads at the configured `MAX_UPLOAD_SIZE`. For example, 10 concurrent 10 MB uploads require ~100 MB of temporary disk space.
- **`MAX_UPLOAD_SIZE`** is set appropriately for your use case — lower it if your files are typically smaller.

:::

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
DEFAULT_BUCKET=verifiable-credentials
AVAILABLE_BUCKETS=verifiable-credentials,private-verifiable-credentials
```

## Basic Usage

Start the service in development mode:

```bash
yarn dev
```

For production:

```bash
yarn build
yarn start
```

## Quick Test

You can test the service using `curl`. Note that all upload endpoints require authentication via the `X-API-Key` header:

```bash
curl -X POST http://localhost:3333/api/2.0.0/private \
-H "Content-Type: application/json" \
-H "X-API-Key: your-secure-api-key-here" \
-d '{
  "bucket": "verifiable-credentials",
  "data": {
    "field1": "value1"
  }
}'
```

The service will respond similarly to the data below:

```json
{
    "uri": "http://localhost:3333/api/2.0.0/verifiable-credentials/e8b32169-582c-421a-a03f-5d1a7ac62d51.json",
    "hash": "d6bb7b579925baa4fe1cec41152b6577003e6a9fde6850321e36ad4ac9b3f30a",
    "decryptionKey": "f3bee3dc18343aaab66d28fd70a03015d2ddbd5fd3b9ad38fff332c09014598d"
}
```
