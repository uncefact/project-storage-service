---
sidebar_position: 3
title: Installation
---

import Disclaimer from './../\_disclaimer.mdx';

<Disclaimer />

## Local Installation

Clone the [repository](https://github.com/uncefact/project-identity-resolver), install dependencies and run:

```bash
yarn install
yarn dev
```

## Using Pre-built Docker Images

Pre-built Docker images are available on [GitHub Container Registry](https://github.com/uncefact/project-identity-resolver/pkgs/container/project-identity-resolver).

Images support `linux/amd64` and `linux/arm64` architectures (Intel/AMD and Apple Silicon/ARM).

```bash
# Pull the latest image
docker pull ghcr.io/uncefact/project-identity-resolver:latest

# Alternatively, pull a specific version (e.g., 2.0.1)
# docker pull ghcr.io/uncefact/project-identity-resolver:2.0.1

# Copy and configure your environment file
cp .env.example .env
# Edit .env and set your API_KEY and other configuration

# Run the container using the 'latest' tag
docker run -d --env-file .env -p 3333:3333 \
  -v $(pwd)/uploads:/app/src/uploads:rw \
  ghcr.io/uncefact/project-identity-resolver:latest
```

## Building Docker Locally

Build and run with Docker:

```bash
# Build Docker image
docker build -t storage-service:latest .

# Copy and configure your environment file
cp .env.example .env
# Edit .env and set your API_KEY and other configuration

# Run a container based on the storage-service image built in the previous step
docker run -d --env-file .env -p 3333:3333 \
  -v $(pwd)/uploads:/app/src/uploads:rw \
  storage-service:latest
```

**Note**: Ensure your `.env` file contains the required `API_KEY` variable. The service will not start without it.

## Cloud Provider Setup

### Google Cloud Storage

Update your `.env` file:

```env
STORAGE_TYPE=gcp
GOOGLE_APPLICATION_CREDENTIALS=/tmp/service-account-file.json
```

Then run the container, mounting your service account file:

```bash
docker run -d --env-file .env -p 3333:3333 \
-v /path/to/local/gcp/service-account-file.json:/tmp/service-account-file.json \
storage-service:latest
```

### Amazon Web Services (AWS S3)

Update your `.env` file with AWS credentials:

```env
STORAGE_TYPE=aws
S3_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AVAILABLE_BUCKETS=verifiable-credentials,private-verifiable-credentials,epcis-events
```

Then run the container:

```bash
docker run -d --env-file .env -p 3333:3333 storage-service:latest
```

### S3-Compatible Storage Providers

The service supports any S3-compatible storage provider (MinIO, DigitalOcean Spaces, Cloudflare R2, Backblaze B2, Wasabi, etc.) by configuring a custom endpoint.

#### MinIO

Ideal for local development and self-hosted deployments:

```env
STORAGE_TYPE=aws
S3_ENDPOINT=http://minio:9000
S3_FORCE_PATH_STYLE=true
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AVAILABLE_BUCKETS=verifiable-credentials
```

#### DigitalOcean Spaces

```env
STORAGE_TYPE=aws
S3_ENDPOINT=https://syd1.digitaloceanspaces.com
AWS_ACCESS_KEY_ID=your-do-access-key-id
AWS_SECRET_ACCESS_KEY=your-do-secret-access-key
AVAILABLE_BUCKETS=verifiable-credentials
```

#### Cloudflare R2

```env
STORAGE_TYPE=aws
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_FORCE_PATH_STYLE=true
AWS_ACCESS_KEY_ID=your-r2-access-key-id
AWS_SECRET_ACCESS_KEY=your-r2-secret-access-key
AVAILABLE_BUCKETS=verifiable-credentials
```

### S3 Configuration Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `S3_REGION` | Yes (for AWS S3) | AWS region. Not required when using custom endpoint. |
| `S3_ENDPOINT` | No | Custom endpoint URL for S3-compatible providers. |
| `S3_FORCE_PATH_STYLE` | No | Set to `true` for path-style URLs (required for MinIO, R2). |
| `AWS_ACCESS_KEY_ID` | Yes | Access key for authentication. |
| `AWS_SECRET_ACCESS_KEY` | Yes | Secret key for authentication. |
