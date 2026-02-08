---
sidebar_position: 4
title: Features
---

## API Endpoints

:::tip Choosing the Right Endpoint
Not sure which endpoint to use? See [Storage Options](/docs/storage-options) for guidance on when to use `/public` (no encryption) vs `/private` (automatic encryption).
:::

### Store Public Data

- **Endpoint**: `/api/2.0.0/public`
- **Method**: POST
- **Authentication**: Required (X-API-Key header)
- **Content Types**: `application/json` or `multipart/form-data`
- Stores data or files without encryption
- Returns URI and hash

#### JSON Upload

Test the service using `curl`:

```bash
curl -X POST http://localhost:3333/api/2.0.0/public \
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
    "uri": "http://localhost:3333/api/2.0.0/verifiable-credentials/2ad789c7-e513-4523-a826-ab59e1c423cd.json",
    "hash": "d6bb7b579925baa4fe1cec41152b6577003e6a9fde6850321e36ad4ac9b3f30a"
}
```

#### Binary File Upload

```bash
curl -X POST http://localhost:3333/api/2.0.0/public \
-H "X-API-Key: your-secure-api-key-here" \
-F "file=@/path/to/image.png" \
-F "bucket=files"
```

```json
{
    "uri": "http://localhost:3333/api/2.0.0/files/123e4567-e89b-12d3-a456-426614174000.png",
    "hash": "d6bb7b579925baa4fe1cec41152b6577003e6a9fde6850321e36ad4ac9b3f30a"
}
```

#### Request Payload (JSON)

| Field    | Description                                                             | Required |
| -------- | ----------------------------------------------------------------------- | -------- |
| `bucket` | Name of the bucket where the data will be stored.                       | Yes      |
| `data`   | The actual data to be stored, must be in JSON format.                   | Yes      |
| `id`     | Optional UUID for the document. If not provided, one will be generated. | No       |

#### Request Payload (Binary)

| Field    | Description                                                         | Required |
| -------- | ------------------------------------------------------------------- | -------- |
| `file`   | The binary file to upload.                                          | Yes      |
| `bucket` | Name of the bucket where the file will be stored.                   | Yes      |
| `id`     | Optional UUID for the file. If not provided, one will be generated. | No       |

#### Response Data

| Field  | Description                                                       |
| ------ | ----------------------------------------------------------------- |
| `uri`  | The link to the stored data.                                      |
| `hash` | A hash of the data, used to verify your data hasn't been changed. |

### Store Private Data

- **Endpoint**: `/api/2.0.0/private`
- **Method**: POST
- **Authentication**: Required (X-API-Key header)
- **Content Types**: `application/json` or `multipart/form-data`
- Automatically encrypts and stores data or files
- Returns URI, hash, and decryption key
- Adds a `contentType` field to the encrypted envelope for binary uploads

#### JSON Upload

Test the service using `curl`:

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

#### Binary File Upload

```bash
curl -X POST http://localhost:3333/api/2.0.0/private \
-H "X-API-Key: your-secure-api-key-here" \
-F "file=@/path/to/image.png" \
-F "bucket=files"
```

```json
{
    "uri": "http://localhost:3333/api/2.0.0/files/123e4567-e89b-12d3-a456-426614174000.json",
    "hash": "d6bb7b579925baa4fe1cec41152b6577003e6a9fde6850321e36ad4ac9b3f30a",
    "decryptionKey": "a1bc2de3f4567890abcdef1234567890abcdef1234567890abcdef1234567890"
}
```

#### Request Payload (JSON)

| Field    | Description                                                             | Required |
| -------- | ----------------------------------------------------------------------- | -------- |
| `bucket` | Name of the bucket where the data will be stored.                       | Yes      |
| `data`   | The actual data to be stored, must be in JSON format.                   | Yes      |
| `id`     | Optional UUID for the document. If not provided, one will be generated. | No       |

#### Request Payload (Binary)

| Field    | Description                                                         | Required |
| -------- | ------------------------------------------------------------------- | -------- |
| `file`   | The binary file to upload.                                          | Yes      |
| `bucket` | Name of the bucket where the file will be stored.                   | Yes      |
| `id`     | Optional UUID for the file. If not provided, one will be generated. | No       |

#### Response Data

| Field           | Description                                                       |
| --------------- | ----------------------------------------------------------------- |
| `uri`           | The link to the stored data.                                      |
| `hash`          | A hash of the data, used to verify your data hasn't been changed. |
| `decryptionKey` | The symmetric key used to decrypt the encrypted data.             |

## Storage Providers

- **Local Storage**: File system storage for development
- **Google Cloud Storage**: GCP bucket storage for production
- **Amazon S3**: AWS S3 and S3-compatible storage (e.g., MinIO, DigitalOcean Spaces, Cloudflare R2) for production

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
