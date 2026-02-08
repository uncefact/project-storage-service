---
sidebar_position: 3
title: Storage Options
---

## Understanding Your Storage Options

This service offers two ways to store data, depending on whether your data is public or private. Both endpoints accept JSON (`application/json`) and binary files (`multipart/form-data`).

| Use Case | Endpoint | What Happens |
|----------|----------|--------------|
| Public data (JSON or binary) | `/public` | Stored as-is, without encryption |
| Private data (JSON or binary) | `/private` | Automatically encrypted |

## The Lockbox Analogy

Think of the `/private` endpoint like a secure lockbox service.

When you store private data:
1. You hand over your data
2. The service locks it in a secure box
3. You receive the only key

Without that key, no one — including us — can open the box. This is why it's critical to save your key immediately when you receive it.

## How Each Endpoint Works

### Public Data: `/public`

Use this endpoint for data or files you're happy to share publicly. Content is stored unencrypted at a public URI, so it can be read by anyone who obtains the link. This endpoint accepts both JSON payloads (`application/json`) and binary file uploads (`multipart/form-data`).

**What happens:**
1. You send your data or file to the service
2. The service stores it exactly as you sent it
3. You receive back:
   - A **URI** — the location where your content is stored
   - A **hash** — a fingerprint to verify your content hasn't changed

```
Your Data/File → Store → URI + Hash
```

### Private Data: `/private`

Use this endpoint for any sensitive or private information that should be protected. Like `/public`, this endpoint accepts both JSON payloads (`application/json`) and binary file uploads (`multipart/form-data`). For binary uploads, the encrypted envelope includes a `contentType` field to preserve the original file type.

**What happens:**
1. You send your data or file to the service
2. The service encrypts your content automatically (you don't need to encrypt it yourself)
3. The encrypted content is stored
4. You receive back:
   - A **URI** — the location where your encrypted content is stored
   - A **hash** — a fingerprint to verify your data hasn't changed
   - A **decryptionKey** — your unique decryption key

```
Your Data/File → Encrypt → Store → URI + Hash + Decryption Key
```

:::warning Save Your Key

The decryption key is returned only once when you store your data.

**If you lose this key, your data cannot be recovered — not even by us.**

Store it securely immediately after receiving it.

:::

## When to Use Which Endpoint

| Scenario | Recommended Endpoint |
|----------|---------------------|
| Public data (JSON or binary) | `/public` |
| Private or sensitive data (JSON or binary) | `/private` |

:::info Note on Data Discovery

All endpoints use UUIDs as identifiers. UUIDs are designed to be practically impossible to guess or enumerate, so discovery is unlikely. However, if someone does obtain a URI:

- **`/public`**: The data or file can be read directly
- **`/private`**: The data is encrypted and unreadable without the corresponding decryption key

This is why encryption matters for sensitive data — it provides protection even if the URI is somehow discovered.

:::

## Technical Details

For developers who want to understand the encryption:

- **Algorithm**: AES-256-GCM
- **Key generation**: Unique 256-bit key generated per request
- **Hash computation**: SHA-256

### Unencrypted Data Structure

When you store data via `/public`, the service stores your content exactly as you sent it — no encryption or transformation is applied.

For JSON uploads:
```json
{
    "field1": "value1",
    "field2": "value2"
}
```

For binary uploads, the file (e.g. PNG, PDF) is stored in its original format.

| Field | Description |
|-------|-------------|
| Your data/file | Stored exactly as provided, with no transformation or encryption |

This means your content is directly accessible to anyone who obtains the URI.

### Encrypted Data Structure

When you store data via `/private`, the service encrypts your content and stores it in the following structure:

```json
{
    "cipherText": "base64-encoded-encrypted-data",
    "iv": "base64-encoded-initialization-vector",
    "tag": "base64-encoded-authentication-tag",
    "type": "aes-256-gcm",
    "contentType": "application/json"
}
```

| Field | Description |
|-------|-------------|
| `cipherText` | Your encrypted data (Base64 encoded) |
| `iv` | Initialization vector used for encryption (Base64 encoded) |
| `tag` | Authentication tag that verifies data integrity (Base64 encoded) |
| `type` | The encryption algorithm used |
| `contentType` | The MIME type of the original content before encryption (e.g. `application/json`, `image/png`) |

This structure ensures both **confidentiality** (data is unreadable without the key) and **integrity** (any tampering can be detected via the authentication tag).

## API Reference

For complete API documentation including request/response schemas, see the [Swagger documentation](http://localhost:3333/api-docs).
