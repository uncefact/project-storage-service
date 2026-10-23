---
sidebar_position: 1
title: Installation
---

## Prerequisites

Before you begin, ensure you have installed:

- [Node.js](https://nodejs.org/) (v22)
- [Yarn](https://yarnpkg.com/) (>= 1.22.21)

## Local Development Setup

To run the service from source:

1. Clone the [Storage Service repository](https://github.com/uncefact/project-storage-service):

```bash
git clone https://github.com/uncefact/project-storage-service.git
cd project-storage-service
```

2. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

3. Configure your environment variables (see [Configuration](../configuration/)).

4. Install dependencies:

```bash
yarn install
```

5. Start the service in development mode:

```bash
yarn dev
```

For production, build and start the service instead:

```bash
yarn build
yarn start
```

:::note
Your `.env` file must contain the required `API_KEY` variable. The service will not start without it.
:::

## Using Pre-built Docker Images

Pre-built Docker images are available on [GitHub Container Registry](https://github.com/uncefact/project-storage-service/pkgs/container/project-storage-service).

Images support multiple architectures:

- `linux/amd64` (Intel/AMD)
- `linux/arm64` (Apple Silicon, ARM servers)

### Pull Commands

```bash
# Pull the latest release
docker pull ghcr.io/uncefact/project-storage-service:latest

# Pull a specific version (e.g., 4.0.0)
docker pull ghcr.io/uncefact/project-storage-service:<version>

# Pull the rolling head of main
docker pull ghcr.io/uncefact/project-storage-service:main

# Pull a specific main commit (short SHA)
docker pull ghcr.io/uncefact/project-storage-service:main-<short-sha>
```

### Running the Container

From 4.0.2, the container runs as `node` (uid 1000), so the uploads directory you mount must be writable by that user. On a Linux host running standard Docker, create it with that owner before the first run, because Docker creates a missing bind-mount directory owned by root:

```bash
mkdir -p uploads && sudo chown 1000:1000 uploads
```

A new named volume mounted at `/app/src/uploads` needs no preparation. A directory or volume that an earlier image running as root has already written to stays root-owned, and uploads and deletes on it fail with a permission error until you change its owner once. For a directory on a standard Docker host, run `sudo chown -R 1000:1000 uploads`. For a named volume, or on rootless Docker, run the change in a container: `docker run --rm -v <volume-or-absolute-path>:/data alpine chown -R 1000:1000 /data`. With user-namespace remapping, container uid 1000 is a different uid on the host, so give the directory to that mapped uid instead.

Copy and configure your environment file, then run:

```bash
cp .env.example .env
# Edit .env and set your API_KEY and other configuration

docker run -d --env-file .env -p 3333:3333 \
  -v $(pwd)/uploads:/app/src/uploads:rw \
  ghcr.io/uncefact/project-storage-service:latest
```

## Building Docker Locally

Build and run with Docker:

```bash
# Build the Docker image
docker build -t storage-service:latest .

# From 4.0.2, create the uploads directory owned by the container user (uid 1000 on standard Docker)
mkdir -p uploads && sudo chown 1000:1000 uploads

# Copy and configure your environment file
cp .env.example .env
# Edit .env and set your API_KEY and other configuration

# Run the container
docker run -d --env-file .env -p 3333:3333 \
  -v $(pwd)/uploads:/app/src/uploads:rw \
  storage-service:latest
```

:::note
Your `.env` file must contain the required `API_KEY` variable. The service will not start without it.
:::
