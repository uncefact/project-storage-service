---
sidebar_position: 1
title: API Reference
---

:::tip Choosing the Right Endpoint
Not sure which endpoint to use? See [How It Works](../../understanding/how-it-works) for guidance on when to use `/public` (no encryption) vs `/private` (automatic encryption).
:::

## Authentication

All upload operations require an API key passed via the `X-API-Key` header. The API key is configured by the service operator through the `API_KEY` environment variable.

```
X-API-Key: your-secure-api-key-here
```

## Store Public Data

- **Endpoint**: `POST /api/3.0.0/public`
- **Authentication**: Required (`X-API-Key` header)
- **Content Types**: `application/json` or `multipart/form-data`

Stores data or files without encryption. Returns a URI where the content can be accessed and a hash for integrity verification.

### JSON Upload

```bash
curl -X POST http://localhost:3333/api/3.0.0/public \
-H "Content-Type: application/json" \
-H "X-API-Key: your-secure-api-key-here" \
-d '{
  "bucket": "documents",
  "data": {
    "field1": "value1"
  }
}'
```

Example response:

```json
{
    "uri": "http://localhost:3333/api/3.0.0/documents/2ad789c7-e513-4523-a826-ab59e1c423cd.json",
    "hash": "d6bb7b579925baa4fe1cec41152b6577003e6a9fde6850321e36ad4ac9b3f30a"
}
```

### Binary File Upload

```bash
curl -X POST http://localhost:3333/api/3.0.0/public \
-H "X-API-Key: your-secure-api-key-here" \
-F "file=@/path/to/image.png" \
-F "bucket=files"
```

Example response:

```json
{
    "uri": "http://localhost:3333/api/3.0.0/files/123e4567-e89b-12d3-a456-426614174000.png",
    "hash": "d6bb7b579925baa4fe1cec41152b6577003e6a9fde6850321e36ad4ac9b3f30a"
}
```

### Request Payload (JSON)

| Field    | Description                                                             | Required |
| -------- | ----------------------------------------------------------------------- | -------- |
| `bucket` | Name of the bucket where the data will be stored.                       | Yes      |
| `data`   | The actual data to be stored, must be in JSON format.                   | Yes      |
| `id`     | Optional UUID for the document. If not provided, one will be generated. | No       |

### Request Payload (Binary)

| Field    | Description                                                         | Required |
| -------- | ------------------------------------------------------------------- | -------- |
| `file`   | The binary file to upload.                                          | Yes      |
| `bucket` | Name of the bucket where the file will be stored.                   | Yes      |
| `id`     | Optional UUID for the file. If not provided, one will be generated. | No       |

### Response Data

| Field  | Description                                                        |
| ------ | ------------------------------------------------------------------ |
| `uri`  | The link to the stored data.                                       |
| `hash` | A hash of the data, used to verify your data has not been changed. |

---

## Store Private Data

- **Endpoint**: `POST /api/3.0.0/private`
- **Authentication**: Required (`X-API-Key` header)
- **Content Types**: `application/json` or `multipart/form-data`

Automatically encrypts and stores data or files. Returns a URI, a hash, and a decryption key. The decryption key is returned only once -- store it securely.

### JSON Upload

```bash
curl -X POST http://localhost:3333/api/3.0.0/private \
-H "Content-Type: application/json" \
-H "X-API-Key: your-secure-api-key-here" \
-d '{
  "bucket": "documents",
  "data": {
    "field1": "value1"
  }
}'
```

Example response:

```json
{
    "uri": "http://localhost:3333/api/3.0.0/documents/e8b32169-582c-421a-a03f-5d1a7ac62d51.json",
    "hash": "d6bb7b579925baa4fe1cec41152b6577003e6a9fde6850321e36ad4ac9b3f30a",
    "decryptionKey": "f3bee3dc18343aaab66d28fd70a03015d2ddbd5fd3b9ad38fff332c09014598d"
}
```

### Binary File Upload

```bash
curl -X POST http://localhost:3333/api/3.0.0/private \
-H "X-API-Key: your-secure-api-key-here" \
-F "file=@/path/to/image.png" \
-F "bucket=files"
```

Example response:

```json
{
    "uri": "http://localhost:3333/api/3.0.0/files/123e4567-e89b-12d3-a456-426614174000.json",
    "hash": "d6bb7b579925baa4fe1cec41152b6577003e6a9fde6850321e36ad4ac9b3f30a",
    "decryptionKey": "a1bc2de3f4567890abcdef1234567890abcdef1234567890abcdef1234567890"
}
```

### Request Payload (JSON)

| Field    | Description                                                             | Required |
| -------- | ----------------------------------------------------------------------- | -------- |
| `bucket` | Name of the bucket where the data will be stored.                       | Yes      |
| `data`   | The actual data to be stored, must be in JSON format.                   | Yes      |
| `id`     | Optional UUID for the document. If not provided, one will be generated. | No       |

### Request Payload (Binary)

| Field    | Description                                                         | Required |
| -------- | ------------------------------------------------------------------- | -------- |
| `file`   | The binary file to upload.                                          | Yes      |
| `bucket` | Name of the bucket where the file will be stored.                   | Yes      |
| `id`     | Optional UUID for the file. If not provided, one will be generated. | No       |

### Response Data

| Field           | Description                                                        |
| --------------- | ------------------------------------------------------------------ |
| `uri`           | The link to the stored data.                                       |
| `hash`          | A hash of the data, used to verify your data has not been changed. |
| `decryptionKey` | The key required to decrypt the stored data.                       |

---

## Full API Documentation

Full API documentation including request/response schemas and error responses is available at `{your-deployment-url}/api-docs` from any running instance.

For local development: [http://localhost:3333/api-docs](http://localhost:3333/api-docs).
