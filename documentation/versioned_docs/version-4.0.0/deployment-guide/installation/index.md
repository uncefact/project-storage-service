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

# Pull a specific version (e.g., 3.0.0)
docker pull ghcr.io/uncefact/project-storage-service:<version>

# Pull the latest development image from the next branch
docker pull ghcr.io/uncefact/project-storage-service:next
```

### Running the Container

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
