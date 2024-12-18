---
sidebar_position: 2
title: Getting Started
---

import Disclaimer from './../_disclaimer.mdx';

<Disclaimer />

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

| Variable | Description | Default |
|----------|-------------|---------|
| `API_VERSION` | API version identifier | `v1` |
| `PROTOCOL` | HTTP protocol to use | `http` |
| `DOMAIN` | Server domain | `localhost` |
| `PORT` | Server port number | `3333` |

### Storage Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `STORAGE_TYPE` | Storage provider (`local`, `gcp`, or `aws`) | `local` |
| `LOCAL_DIRECTORY` | Directory for local file storage | `uploads` |
| `REGION` | AWS/GCP region | `ap-southeast-2` |

### Bucket Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DEFAULT_BUCKET` | Default storage bucket name | `verifiable-credentials` |
| `AVAILABLE_BUCKETS` | Comma-separated list of allowed storage buckets | `verifiable-credentials` |

Example `.env` file for local development:

```env
API_VERSION=v1
PROTOCOL=http
DOMAIN=localhost
PORT=3333
STORAGE_TYPE=local
LOCAL_DIRECTORY=uploads
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

You can test the service using `curl`:

```bash
curl -X POST http://localhost:3333/v1/credentials \
-H "Content-Type: application/json" \
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
  "uri": "http://localhost:3333/v1/verifiable-credentials/e8b32169-582c-421a-a03f-5d1a7ac62d51.json",
  "hash": "d6bb7b579925baa4fe1cec41152b6577003e6a9fde6850321e36ad4ac9b3f30a",
  "key": "f3bee3dc18343aaab66d28fd70a03015d2ddbd5fd3b9ad38fff332c09014598d"
}
```