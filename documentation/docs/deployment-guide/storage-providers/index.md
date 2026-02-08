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

| Variable                | Required         | Description                                                               |
| ----------------------- | ---------------- | ------------------------------------------------------------------------- |
| `S3_REGION`             | Yes (for AWS S3) | AWS region. Not required when using a custom endpoint.                    |
| `S3_ENDPOINT`           | No               | Custom endpoint URL for S3-compatible providers.                          |
| `S3_FORCE_PATH_STYLE`   | No               | Set to `true` for path-style URLs (required for MinIO and Cloudflare R2). |
| `AWS_ACCESS_KEY_ID`     | Yes              | Access key for authentication.                                            |
| `AWS_SECRET_ACCESS_KEY` | Yes              | Secret key for authentication.                                            |
