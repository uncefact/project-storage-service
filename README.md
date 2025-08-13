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
    (local file system, AWS, Digital Ocean or Google Cloud Storage).
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
    The type of storage to use (`local` or `gcp` or `aws`, or `digital_ocean`).
-   `LOCAL_DIRECTORY`:
    The directory for local storage (default: `uploads` in the current directory).
-   `GOOGLE_APPLICATION_CREDENTIALS`:
    The path to the GCP service account file (if using GCP).
-   `REGION`:
    The region to use (if using AWS or Digital Ocean).
-   `AWS_ACCESS_KEY_ID`:
    The access key to use (if using AWS or Digital Ocean).
-   `AWS_SECRET_ACCESS_KEY`:
    The secret access key to use (if using AWS or Digital Ocean).

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

### Amazon Web Services (AWS)

For the production environment, we recommend using IAM roles to enhance security and eliminate the need to hardcode AWS credentials.
To more details about using IAM roles, please refer to the [AWS documentation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html).
Use Amazon Web Services to store files in an S3 bucket.

Example:

```bash
# Set the storage type to aws
export STORAGE_TYPE=aws

# Set the AWS region
export REGION=ap-southeast-2
export AWS_ACCESS_KEY_ID=AWS_ACCESS_KEY_ID # Local development only
export AWS_SECRET_ACCESS_KEY=AWS_SECRET_ACCESS_KEY # Local development only

# Build the app
yarn build

# Run the app
yarn start
```

### Digital Ocean (DO)

Example:

```bash
# Set the storage type to digital_ocean
export STORAGE_TYPE=digital_ocean

# Set the DO configuration
export REGION=syd1
export AWS_ACCESS_KEY_ID=DO_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY=DO_SECRET_ACCESS_KEY

# Build the app
yarn build

# Run the app
yarn start
```

## Cryptography

The cryptography service uses the following algorithms:

-   **Hash Algorithm**:
    SHA-256
-   **Encryption Algorithm**:
    AES-256-GCM

## Endpoints

### Store Credential

-   **URL**: `/api/1.0.0/credentials`
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
        "uri": "http://localhost:3333/api/1.0.0/verifiable-credentials/123e4567-e89b-12d3-a456-426614174000.json",
        "hash": "computed-hash",
        "key": "encryption-key"
    }
    ```

### Store Document

-   **URL**: `/api/1.0.0/documents`
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
        "uri": "http://localhost:3333/api/1.0.0/verifiable-credentials/123e4567-e89b-12d3-a456-426614174000.json",
        "hash": "computed-hash"
    }
    ```

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

# Start the container using Amazon Web Services (AWS)
docker run -d --env-file .env -p 3333:3333 \
-e STORAGE_TYPE=aws \
-e REGION=ap-southeast-2 \
-e AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID \
-e AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET \
storage-service:latest

# Start the container using Digital Ocean (DO)
docker run -d --env-file .env -p 3333:3333 \
-e STORAGE_TYPE=digital_ocean \
-e REGION=syd1 \
-e AWS_ACCESS_KEY_ID=YOUR_DO_ACCESS_KEY_ID \
-e AWS_SECRET_ACCESS_KEY=YOUR_DO_SECRET \
storage-service:latest
```

## Documentation

The project uses Docusaurus for documentation management. Documentation versions are managed through a release script and automated pipeline.

### Release Script

The `scripts/release-doc.js` script automates the process of creating new documentation versions:

-   Reads the documentation version from `version.json`
-   Creates Docusaurus version using `docVersion` value from `version.json` file

To manually create a new documentation version:

```bash
# Run the release script
yarn release:doc
```

### Documentation Pipeline

The documentation is automatically built and deployed using GitHub Actions through the `build_publish_docs.yml` pipeline. This pipeline:

1. Triggers on:

-   Manual workflow dispatch
-   (TODO) Push to main branch once enabled

2. Performs the following steps:

-   Checks out the repository
-   Sets up Node.js 18 with Yarn cache
-   Installs documentation dependencies
-   Builds the static documentation site
-   Deploys to GitHub Pages using gh-pages branch

The pipeline uses environment variables for configuration:

-   `DOCS_BASE_URL`: Base URL for documentation hosting
-   `DOCS_URL`: Documentation site URL

The built documentation is published to the `gh-pages` branch using the GitHub Actions bot.

### Release Guide

To release a new version, ensure we have the `version.json` file updated with the new version number. Then, create a new release tag with the following steps:

1. Create a new release branch from `next` with the version number as the branch name.
2. Update the `version.json` file with the new version number.
3. Generate new documentation version using the release script `yarn release:doc`.
4. Check API documentation and update if necessary.
5. Commit the changes and push the branch.
6. Create a pull request from the release branch to `main`.
7. Merge the pull request.
8. Create a new release tag with the version number.
8. Push the tag to the repository.

(\*) With the `version.json` file, it contains the version number in the following format:

```json
{
  "version": "MAJOR.MINOR.PATCH",
  "apiVersion": "MAJOR.MINOR.PATCH",
  "docVersion": "MAJOR.MINOR.PATCH",
  "dependencies": {}
}
```

We need to change manually the `version`, `apiVersion`, and `docVersion` fields.
