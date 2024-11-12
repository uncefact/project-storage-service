# Storage Service

The storage service directory contains an Express REST API
that provides endpoints to encrypt and store Verifiable Credentials and documents.

## Overview

The service offers the following functionality:

-   **Hash Computation**:
    Computes the SHA-256 hash of a given document to ensure data integrity.
-   **Encryption**:
    Encrypts the document using AES-256-GCM for enhanced security.
-   **Storage**:
    Stores the encrypted document using the specified storage adapter
    (local file system or Google Cloud Storage).
-   **Data Retrieval**:
    Upon successful storage, the service returns:
    -   The hash of the original document.
    -   A decryption key for the encrypted document (if applicable).
    -   The URI of the stored encrypted document.

## Prerequisites

-   [Node.js](https://nodejs.org/) (v18.18.0)
-   [Yarn](https://yarnpkg.com/) (>= 1.22.21)

## Environment Variables

An example environment file `.env.example` is provided in the storage service directory.
Copy and rename it to `.env`,
then modify the variables as required.
The default values should be sufficient for local development.

## Usage

```bash
# Install dependencies
yarn install

# Build the app
yarn build

# Run the app and watch for changes
yarn dev

# Start the server once built
yarn start

# Run linter
yarn lint

# Run tests
yarn test
```

## Configuration

Configure the storage service using the following environment variables:

-   `STORAGE_TYPE`:
    The type of storage to use (`local` or `gcp`).
-   `LOCAL_DIRECTORY`:
    The directory for local storage (default: `uploads` in the current directory).
-   `GOOGLE_APPLICATION_CREDENTIALS`:
    The path to the GCP service account file (if using GCP).

## Storage Types

### Local Storage

For development purposes,
use the local storage service,
which stores files in the local file system.

Example:

```bash
# Set the storage type to local
export STORAGE_TYPE=local

# Run the app
yarn dev
```

The Swagger UI is available at `http://localhost:3333/api-docs`.

### Google Cloud Storage

For production environments,
use Google Cloud Storage to store files in a GCP bucket.

Example:

```bash
# Set the storage type to gcp
export STORAGE_TYPE=gcp

# Set the path to the GCP service account file
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-file.json

# Build the app
yarn build

# Run the app
yarn start
```

The Swagger UI is available at `http://localhost:3333/api-docs`.

## Cryptography

The cryptography service uses the following algorithms:

-   **Hash Algorithm**:
    SHA-256
-   **Encryption Algorithm**:
    AES-256-GCM

## Endpoints

### Store Credential

-   **URL**: `/v1/credentials`
-   **Method**: `POST`
-   **Request Body**:

    ```json
    {
        "bucket": "verifiable-credentials",
        "data": {
            "field1": "value1",
            "field2": "value2"
        },
        "id": "123e4567-e89b-12d3-a456-426614174000" // optional
    }
    ```

-   **Response**:

    ```json
    {
        "uri": "http://localhost:3333/v1/verifiable-credentials/123e4567-e89b-12d3-a456-426614174000.json",
        "hash": "computed-hash",
        "key": "encryption-key"
    }
    ```

### Store Document

-   **URL**: `/v1/documents`
-   **Method**: `POST`
-   **Request Body**:

    ```json
    {
        "bucket": "verifiable-credentials",
        "data": {
            "document": "content"
        },
        "id": "123e4567-e89b-12d3-a456-426614174000" // optional
    }
    ```

-   **Response**:

    ```json
    {
        "uri": "http://localhost:3333/v1/verifiable-credentials/123e4567-e89b-12d3-a456-426614174000.json",
        "hash": "computed-hash"
    }
    ```

## API versions and Source Code versions

The following table lists the API versions and the corresponding source code versions:

| API Version | Source Code Version From                                      | Source Code Version To                                        |
| ----------- | ------------------------------------------------------------- | ------------------------------------------------------------- |
| v1.0.0      | [next](https://github.com/uncefact/project-identity-resolver) | [next](https://github.com/uncefact/project-identity-resolver) |

## Docker

To run the storage service using Docker:

```bash
# Build the image
docker build -t storage-service:latest .

# Start the container using local storage
docker run -d --env-file .env -p 3333:3333 \
storage-service:latest

# Start the container using Google Cloud Storage
docker run -d --env-file .env -p 3333:3333 \
-e STORAGE_TYPE=gcp \
-v path/to/local/gcp/service-account-file.json:/tmp/service-account-file.json \
storage-service:latest
```
