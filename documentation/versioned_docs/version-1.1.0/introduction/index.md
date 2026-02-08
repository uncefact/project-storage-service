---
sidebar_position: 1
title: Introduction
---

The Storage Service is an Express REST API that provides secure endpoints to encrypt and store Verifiable Credentials and documents. It is designed to offer flexible storage options while maintaining robust security standards.

## Key Features

- **Hash Computation**: Ensures data integrity using SHA-256 hash computation
- **Encryption**: Enhances security through AES-256-GCM encryption
- **Flexible Storage**: Supports multiple storage backends (Local, AWS S3, Google Cloud Storage and Digital Ocean object storage)
- **Data Retrieval**: Returns document hash, decryption key (if applicable), and URI upon successful storage

## Architecture Overview

The service implements a modular architecture that separates concerns between:
- Storage adapters for different providers
- Cryptographic operations
- REST API endpoints
- Configuration management
