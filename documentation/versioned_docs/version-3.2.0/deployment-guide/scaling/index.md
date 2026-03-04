---
sidebar_position: 4
title: Scaling
---

This page covers operational guidance for running the Storage Service at scale.

## Architecture Overview

The Storage Service is fully stateless. There is no shared state between instances -- no sessions, no in-memory caches, no local databases. Any instance can handle any request independently. This architecture makes horizontal scaling straightforward.

## Horizontal Scaling

Run multiple instances of the service behind a load balancer to handle more concurrent requests. Because the service is stateless:

- **No sticky sessions are required.** Requests can be routed to any available instance.
- **Adding capacity is simple.** Deploy additional instances and register them with your load balancer.
- **Instances are interchangeable.** Every instance is identical and can serve any request.

## Vertical Scaling

For workloads that involve large file uploads or high throughput on a single instance, increase the CPU and memory allocation. This is particularly relevant when:

- Handling many concurrent large file uploads (each upload consumes memory during processing).
- Running on infrastructure with constrained resources.

## Storage Backend Selection

For production workloads, use a cloud storage provider such as AWS S3, Google Cloud Storage, or an S3-compatible service.

:::warning
**Local filesystem storage does not scale beyond a single instance** and is intended for development only. Data stored locally is not accessible to other instances and will be lost if the container is removed. Always use a cloud provider for production deployments.
:::

See [Storage Providers](../storage-providers/) for setup instructions.

## Temporary Disk Space

Binary file uploads are written to the operating system's temp directory before being forwarded to the configured storage backend. When planning disk space, account for concurrent uploads:

- Each in-progress upload consumes temporary disk space up to the configured `MAX_UPLOAD_SIZE`.
- For example, 10 concurrent 10 MB uploads require approximately 100 MB of temporary disk space.
- Temp files are automatically cleaned up after each upload completes or fails.

Ensure the temp directory on each instance has sufficient free space for your expected concurrency level.

## Upload Size Tuning

The `MAX_UPLOAD_SIZE` environment variable controls the maximum size for both JSON request bodies and multipart file uploads. The default is 10 MB (`10485760` bytes).

- **Lower it** if your files are typically smaller, to reject oversized payloads early and reduce resource consumption.
- **Raise it** if you need to accept larger uploads, but ensure your instances have sufficient memory and temp disk space to handle concurrent uploads at the increased limit.

See [Configuration](../configuration/) for the full list of environment variables.

## Rate Limiting

The service does not include built-in rate limiting, concurrency controls, or request queuing. If you need to protect the service from excessive traffic or abuse, implement rate limiting at the load balancer or API gateway layer in front of the service.
