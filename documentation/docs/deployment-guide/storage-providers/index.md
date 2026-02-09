---
sidebar_position: 3
title: Storage Providers
---

The Storage Service supports multiple storage backends. You can switch between providers by changing the `STORAGE_TYPE` environment variable -- no code changes are required.

:::warning
**Local storage is for development only.** Use a cloud provider for production deployments. Local filesystem storage does not scale beyond a single instance and data is lost if the container is removed.
:::

## Local Storage

Minimal configuration for local development. Files are stored on the local filesystem.

```env
STORAGE_TYPE=local
LOCAL_DIRECTORY=uploads
```

## Google Cloud Storage

Update your `.env` file:

```env
STORAGE_TYPE=gcp
GOOGLE_APPLICATION_CREDENTIALS=/tmp/service-account-file.json
```

When running with Docker, mount your service account file into the container:

```bash
docker run -d --env-file .env -p 3333:3333 \
  -v /path/to/local/gcp/service-account-file.json:/tmp/service-account-file.json \
  storage-service:latest
```

## Amazon Web Services (AWS S3)

Update your `.env` file with AWS credentials:

```env
STORAGE_TYPE=aws
S3_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AVAILABLE_BUCKETS=documents,files
```

Then run the container:

```bash
docker run -d --env-file .env -p 3333:3333 storage-service:latest
```

For production deployments on AWS, consider using IAM roles instead of static credentials. See the [AWS documentation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html).

## S3-Compatible Providers

Any S3-compatible storage provider can be used by setting `STORAGE_TYPE=aws` and configuring a custom endpoint via `S3_ENDPOINT`. The service uses the standard S3 API, so any provider that implements this API will work.

### MinIO

Ideal for local development and self-hosted deployments:

```env
STORAGE_TYPE=aws
S3_ENDPOINT=http://minio:9000
S3_FORCE_PATH_STYLE=true
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AVAILABLE_BUCKETS=documents,files
```

### DigitalOcean Spaces

```env
STORAGE_TYPE=aws
S3_ENDPOINT=https://syd1.digitaloceanspaces.com
AWS_ACCESS_KEY_ID=your-do-access-key-id
AWS_SECRET_ACCESS_KEY=your-do-secret-access-key
AVAILABLE_BUCKETS=documents,files
```

### Cloudflare R2

```env
STORAGE_TYPE=aws
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_FORCE_PATH_STYLE=true
AWS_ACCESS_KEY_ID=your-r2-access-key-id
AWS_SECRET_ACCESS_KEY=your-r2-secret-access-key
AVAILABLE_BUCKETS=documents,files
```

## S3 Configuration Reference

| Variable                | Required         | Description                                                                                              |
| ----------------------- | ---------------- | -------------------------------------------------------------------------------------------------------- |
| `S3_REGION`             | Yes (for AWS S3) | AWS region. Not required when using a custom endpoint.                                                   |
| `S3_ENDPOINT`           | No               | Custom endpoint URL for S3-compatible providers.                                                         |
| `S3_FORCE_PATH_STYLE`   | No               | Set to `true` for path-style URLs (required for MinIO and Cloudflare R2).                                |
| `S3_PUBLIC_URL`         | No               | Base URL for public document URIs (see [Custom Public URL](#custom-public-url-for-document-uris) below). |
| `AWS_ACCESS_KEY_ID`     | Yes              | Access key for authentication.                                                                           |
| `AWS_SECRET_ACCESS_KEY` | Yes              | Secret key for authentication.                                                                           |

## Custom Public URL for Document URIs

By default, the service constructs public document URIs from `S3_ENDPOINT` (or the AWS S3 default). This means the URI returned to clients exposes the raw storage endpoint:

```
https://my-bucket.syd1.digitaloceanspaces.com/123e4567.json
```

If you place a CDN or custom domain in front of your storage bucket, you can set `S3_PUBLIC_URL` to override **only the URI returned to clients**. Uploads and all other S3 API operations continue to use `S3_ENDPOINT` as normal.

```
https://documents.example.com/123e4567.json
```

:::info How it works
`S3_PUBLIC_URL` changes **only** the URI returned in API responses. It does not affect where files are uploaded to or how the service communicates with your storage provider. The upload path remains: **Service → `S3_ENDPOINT` → Storage Provider**. The response URI becomes: **`S3_PUBLIC_URL`/key**.
:::

### Example: DigitalOcean Spaces with CDN

```env
STORAGE_TYPE=aws
S3_ENDPOINT=https://syd1.digitaloceanspaces.com
S3_PUBLIC_URL=https://documents.example.com
AWS_ACCESS_KEY_ID=your-do-access-key-id
AWS_SECRET_ACCESS_KEY=your-do-secret-access-key
AVAILABLE_BUCKETS=documents,files
```

In this configuration:

- Files are uploaded to DigitalOcean Spaces via `S3_ENDPOINT`
- The URI returned to clients uses `S3_PUBLIC_URL`: `https://documents.example.com/{key}`
- Your CDN custom domain (`documents.example.com`) should be configured to serve content from the Spaces bucket

:::note
When `S3_PUBLIC_URL` is set, the bucket name is **not** included in the generated URI. This assumes your CDN or custom domain already points to a specific bucket.
:::
