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
# Pull by version
docker pull ghcr.io/uncefact/project-identity-resolver:1.1.0

# Copy and configure your environment file
cp .env.example .env
# Edit .env and set your API_KEY and other configuration

# Run the container
docker run -d --env-file .env -p 3333:3333 \
  -v $(pwd)/uploads:/app/src/uploads:rw \
  ghcr.io/uncefact/project-identity-resolver:1.1.0
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

### Amazon Web Services

Update your `.env` file with AWS credentials:

```env
STORAGE_TYPE=aws
REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AVAILABLE_BUCKETS=verifiable-credentials,private-verifiable-credentials,epcis-events
```

Then run the container:

```bash
docker run -d --env-file .env -p 3333:3333 storage-service:latest
```

### Digital Ocean

Update your `.env` file with Digital Ocean credentials:

```env
STORAGE_TYPE=digital_ocean
REGION=syd1
AWS_ACCESS_KEY_ID=your-do-access-key-id
AWS_SECRET_ACCESS_KEY=your-do-secret-access-key
AVAILABLE_BUCKETS=verifiable-credentials,private-verifiable-credentials,epcis-events
```

Then run the container:

```bash
docker run -d --env-file .env -p 3333:3333 storage-service:latest
```
