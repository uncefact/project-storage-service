---
sidebar_position: 3
title: Installation
---

import Disclaimer from './../_disclaimer.mdx';

<Disclaimer />

## Local Installation

Clone the [repository](https://github.com/uncefact/project-identity-resolver), install dependencies and run:

```bash
yarn install
yarn dev
```

## Docker Installation

Build and run with Docker:

```bash
# Build Docker image
docker build -t storage-service:latest .

# Run a container based on the storage-service image built in the previous step
docker run -d \
  -e AVAILABLE_BUCKETS=test-verifiable-credentials,verifiable-credentials,private-verifiable-credentials,epcis-events \
  -v $(pwd)/uploads:/app/src/uploads:rw -p 3333:3333 storage-service:latest
```

## Cloud Provider Setup

### Google Cloud Storage

Replace `/path/to/local/gcp/service-account-file.json` with the path to your Google Cloud service account credentials file on your local machine.

```bash
docker run -d --env-file .env -p 3333:3333 \
-e STORAGE_TYPE=gcp \
-e GOOGLE_APPLICATION_CREDENTIALS=/tmp/service-account-file.json
-v /path/to/local/gcp/service-account-file.json:/tmp/service-account-file.json \
storage-service:latest
```

### Amazon Web Services

Replace `YOUR_AWS_ACCESS_KEY_ID` and `YOUR_AWS_SECRET` with your AWS access key ID and secret access key respectively. Also replace the `AVAILABLE_BUCKETS` list with your own bucket names that you have already created in your AWS account.

```bash
docker run -d -p 3333:3333 \
-e STORAGE_TYPE=aws \
-e REGION=ap-southeast-2 \
-e AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID \
-e AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET \
-e AVAILABLE_BUCKETS=verifiable-credentials,verifiable-credentials,private-verifiable-credentials,epcis-events \
storage-service:latest
```

### Digital Ocean

Replace `YOUR_DO_ACCESS_KEY_ID` and `YOUR_DO_SECRET` with your Digital Ocean access key ID and secret access key respectively. Also replace the `AVAILABLE_BUCKETS` list with your own bucket names that you have already created in your Digital Ocean account.

```bash
docker run -d -p 3333:3333 \
-e STORAGE_TYPE=digital_ocean \
-e REGION=syd1 \
-e AWS_ACCESS_KEY_ID=YOUR_DO_ACCESS_KEY_ID \
-e AWS_SECRET_ACCESS_KEY=YOUR_DO_SECRET \
-e AVAILABLE_BUCKETS=verifiable-credentials,verifiable-credentials,private-verifiable-credentials,epcis-events \
storage-service:latest
```