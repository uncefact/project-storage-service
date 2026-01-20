---
sidebar_position: 3
title: Storage Options
---

import Disclaimer from './../\_disclaimer.mdx';

<Disclaimer />

## Understanding Your Storage Options

This service offers two ways to store data, depending on whether your data is public or private.

| Use Case | Endpoint | What Happens |
|----------|----------|--------------|
| Public data | `/documents` | Stored as-is |
| Private data | `/credentials` | Automatically encrypted |

## The Lockbox Analogy

Think of the `/credentials` endpoint like a secure lockbox service.

When you store private data:
1. You hand over your data
2. The service locks it in a secure box
3. You receive the only key

Without that key, no one — including us — can open the box. This is why it's critical to save your key immediately when you receive it.

## How Each Endpoint Works

### Public Data: `/documents`

Use this endpoint for data you're happy to share publicly. Since documents are stored unencrypted at a public URI, they can be read by anyone who obtains the link.

**What happens:**
1. You send your data to the service
2. The service stores it exactly as you sent it
3. You receive back:
   - A **URI** — the location where your data is stored
   - A **hash** — a fingerprint to verify your data hasn't changed

```
Your Data → Store → URI + Hash
```

### Private Data: `/credentials`

Use this endpoint for sensitive information like verifiable credentials or protected documents.

**What happens:**
1. You send your data to the service
2. The service encrypts your data automatically (you don't need to encrypt it yourself)
3. The encrypted data is stored
4. You receive back:
   - A **URI** — the location where your encrypted data is stored
   - A **hash** — a fingerprint to verify your data hasn't changed
   - A **key** — your unique decryption key

```
Your Data → Encrypt → Store → URI + Hash + Key
```

:::warning Save Your Key

The decryption key is returned only once when you store your data.

**If you lose this key, your data cannot be recovered — not even by us.**

Store it securely immediately after receiving it.

:::

## When to Use Which Endpoint

| Scenario | Recommended Endpoint |
|----------|---------------------|
| Data you're happy to share publicly | `/documents` |
| Reference documents anyone can access | `/documents` |
| Verifiable credentials | `/credentials` |
| Any sensitive or private data | `/credentials` |
| Data that must remain confidential | `/credentials` |

:::info Note on Data Discovery

Both endpoints use UUIDs as identifiers. UUIDs are designed to be practically impossible to guess or enumerate, so discovery is unlikely. However, if someone does obtain a URI:

- **`/documents`**: The data can be read directly
- **`/credentials`**: The data is encrypted and unreadable without the corresponding decryption key

This is why encryption matters for sensitive data — it provides protection even if the URI is somehow discovered.

:::

## Technical Details

For developers who want to understand the encryption:

- **Algorithm**: AES-256-GCM
- **Key generation**: Unique 256-bit key generated per request
- **Hash computation**: SHA-256

### Encrypted Data Structure

When you store data via `/credentials`, the service encrypts your data and stores it in the following structure:

```json
{
    "cipherText": "base64-encoded-encrypted-data",
    "iv": "base64-encoded-initialization-vector",
    "tag": "base64-encoded-authentication-tag",
    "type": "aes-256-gcm"
}
```

| Field | Description |
|-------|-------------|
| `cipherText` | Your encrypted data (Base64 encoded) |
| `iv` | Initialization vector used for encryption (Base64 encoded) |
| `tag` | Authentication tag that verifies data integrity (Base64 encoded) |
| `type` | The encryption algorithm used |

This structure ensures both **confidentiality** (data is unreadable without the key) and **integrity** (any tampering can be detected via the authentication tag).

## API Reference

For complete API documentation including request/response schemas, see the [Swagger documentation](/api-docs).
