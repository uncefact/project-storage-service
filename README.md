# Storage Service

The storage service directory contains an Express REST API
that provides endpoints to encrypt and store documents.

## Overview

The service offers the following functionality:

- **Hash Computation**:
  Computes the SHA-256 hash of a given document to ensure data integrity.
- **Encryption**:
  Encrypts the document using AES-256-GCM for enhanced security.
- **Storage**:
  Stores the encrypted document using the specified storage adapter
  (local file system, AWS S3 and S3-compatible providers, or Google Cloud Storage).
- **Data Retrieval**:
  Upon successful storage, the service returns:
    - The hash of the original document.
    - A decryption key for the encrypted document (if applicable).
    - The URI of the stored encrypted document.

## Choosing Your Storage Endpoint

This service offers two ways to store data, depending on whether your data is public or private.

### Public Data → [`/public`](#store-public-data)

For data that doesn't require protection. Accepts both JSON (`application/json`) and binary files (`multipart/form-data`). The service stores your content as-is and returns:

- A **URI** (the location of your stored data)
- A **hash** (a fingerprint to verify the data hasn't changed)

Allowed file types and maximum upload size are [configurable](#file-upload-configuration).

### Private Data → [`/private`](#store-private-data)

For sensitive data that needs protection. Accepts both JSON (`application/json`) and binary files (`multipart/form-data`). The service automatically encrypts your data before storage — you don't need to encrypt it yourself.

The response includes:

- A **URI** (the location of your stored data)
- A **hash** (a fingerprint to verify the data hasn't changed)
- A **decryptionKey** (your unique decryption key)

**Save this key securely** — it's the only way to decrypt your data later.

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
  **Required**. The API key used to authenticate upload requests to `/public` and `/private` endpoints.
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

All upload endpoints (`POST /public` and `POST /private`) require API key authentication via the `X-API-Key` header.

Examples:

```bash
# Store public JSON data (no encryption)
curl -X POST http://localhost:3333/api/3.0.0/public \
-H "Content-Type: application/json" \
-H "X-API-Key: your-api-key-here" \
-d '{"bucket": "documents", "data": {"field1": "value1"}}'

# Store private JSON data (encrypted)
curl -X POST http://localhost:3333/api/3.0.0/private \
-H "Content-Type: application/json" \
-H "X-API-Key: your-api-key-here" \
-d '{"bucket": "documents", "data": {"field1": "value1"}}'

# Upload a public binary file
curl -X POST http://localhost:3333/api/3.0.0/public \
-H "X-API-Key: your-api-key-here" \
-F "bucket=files" \
-F "file=@/path/to/image.png"
```

If the API key is missing or invalid, the service will return a `401 Unauthorized` response.

## Docker Images

Pre-built Docker images are available on [GitHub Container Registry](https://github.com/uncefact/project-storage-service/pkgs/container/project-storage-service).

Images support `linux/amd64` and `linux/arm64` architectures (Intel/AMD and Apple Silicon/ARM).

### Pulling Images

```bash
# Pull a specific version (e.g., 3.0.0)
docker pull ghcr.io/uncefact/project-storage-service:3.0.0

# Or pull the latest release
docker pull ghcr.io/uncefact/project-storage-service:latest

# Or pull the latest development image from the next branch
docker pull ghcr.io/uncefact/project-storage-service:next
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
