---
sidebar_position: 1
title: Development Setup
---

This page explains how to set up the Storage Service project for local development and contribution.

## Prerequisites

Ensure you have installed:

- [Node.js](https://nodejs.org/) (v22)
- [Yarn](https://yarnpkg.com/) (>= 1.22.21)

## Clone and Install

```bash
git clone https://github.com/uncefact/project-storage-service.git
cd project-storage-service
yarn install
```

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and set at minimum the `API_KEY` variable. See [Configuration](../../deployment-guide/configuration/) for the full list of environment variables.

## Run in Development Mode

Start the service with hot reloading:

```bash
yarn dev
```

The service will be available at `http://localhost:3333` and the Swagger UI at `http://localhost:3333/api-docs`.

## Run Linter

Check code for linting errors:

```bash
yarn lint:check
```

## Run Unit Tests

```bash
yarn test
```

## Run E2E Tests

End-to-end tests require Docker to be installed and running:

```bash
yarn test:e2e
```

This command starts the required containers (including an S3-compatible storage backend), runs the E2E test suite, and tears down the containers afterwards.

## Build for Production

```bash
yarn build
yarn start
```
