---
sidebar_position: 4
title: Features
---

import Disclaimer from './../\_disclaimer.mdx';

<Disclaimer />

## API Endpoints

:::tip Choosing the Right Endpoint
Not sure which endpoint to use? See [Storage Options](/docs/storage-options) for guidance on when to use `/credentials` (private data with encryption) vs `/documents` (public data without encryption).
:::

### Store Credential (Private Data)

- **Endpoint**: `/api/1.0.0/credentials`
- **Method**: POST
- **Authentication**: Required (X-API-Key header)
- Stores encrypted credentials with optional ID
- Returns URI, hash, and encryption key

Test the service using `curl`:

```bash
curl -X POST http://localhost:3333/api/1.0.0/credentials \
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
    "uri": "http://localhost:3333/api/1.0.0/verifiable-credentials/e8b32169-582c-421a-a03f-5d1a7ac62d51.json",
    "hash": "d6bb7b579925baa4fe1cec41152b6577003e6a9fde6850321e36ad4ac9b3f30a",
    "key": "f3bee3dc18343aaab66d28fd70a03015d2ddbd5fd3b9ad38fff332c09014598d"
}
```

#### Request Payload

| Field    | Description                                           | Required |
| -------- | ----------------------------------------------------- | -------- |
| `bucket` | Name of the bucket where the data will be stored.     | Yes      |
| `data`   | The actual data to be stored, must be in JSON format. | Yes      |

#### Response Data

| Field  | Description                                                       |
| ------ | ----------------------------------------------------------------- |
| `uri`  | The link to the stored data.                                      |
| `hash` | A hash of the data, used to verify your data hasn't been changed. |
| `key`  | The symmetric key used to decrypt the encrypted data.             |

### Store Document (Public Data)

- **Endpoint**: `/api/1.0.0/documents`
- **Method**: POST
- **Authentication**: Required (X-API-Key header)
- Stores documents with computed hash
- Returns URI and document hash

Test the service using `curl`:

```bash
curl -X POST http://localhost:3333/api/1.0.0/documents \
-H "Content-Type: application/json" \
-H "X-API-Key: your-secure-api-key-here" \
-d '{
  "bucket": "test-verifiable-credentials",
  "data": {
    "field1": "value1"
  }
}'
```

The service will respond similarly to the data below:

```json
{
    "uri": "http://localhost:3333/api/1.0.0/test-verifiable-credentials/2ad789c7-e513-4523-a826-ab59e1c423cd.json",
    "hash": "d6bb7b579925baa4fe1cec41152b6577003e6a9fde6850321e36ad4ac9b3f30a"
}
```

#### Request Payload

| Field    | Description                                           | Required |
| -------- | ----------------------------------------------------- | -------- |
| `bucket` | Name of the bucket where the data will be stored.     | Yes      |
| `data`   | The actual data to be stored, must be in JSON format. | Yes      |

#### Response Data

| Field  | Description                                                       |
| ------ | ----------------------------------------------------------------- |
| `uri`  | The link to the stored data.                                      |
| `hash` | A hash of the data, used to verify your data hasn't been changed. |

## Storage Providers

- **Local Storage**: File system storage for development
- **Google Cloud Storage**: GCP bucket storage for production
- **Amazon S3**: AWS S3 bucket storage for production
- **Digital Ocean Object Storage**: Digital Ocean object storage for production

## Security Features

### Authentication

- API key authentication via `X-API-Key` header
- Required for all upload operations

### Cryptography

- SHA-256 hash computation
- AES-256-GCM encryption
- Secure key management
- Data integrity verification

### Configuration Options

- Flexible storage provider selection
- Environment-based configuration
- Secure credential management
