// IMPORTANT: load OpenTelemetry instrumentation before any other import so the
// SDK can patch HTTP / Express / AWS SDK module exports when they are first
// loaded. This module is a no-op when OTEL_EXPORTER_OTLP_ENDPOINT is not set.
import './instrumentation';

import { app } from './app';
import { DOMAIN, EXTERNAL_PORT, MAX_UPLOAD_SIZE, PORT, PROTOCOL, getApiKey } from './config';
import { buildBaseUrl } from './utils';
import { serverLogger as logger } from './services/logging';

// Validate required environment variables at runtime
if (!getApiKey()) {
    logger.fatal(
        'API_KEY environment variable is required but not set. Set API_KEY in your .env file or environment variables.',
    );
    process.exit(1);
}

if (isNaN(Number(EXTERNAL_PORT))) {
    logger.fatal(
        { externalPort: EXTERNAL_PORT },
        'Invalid port configuration. EXTERNAL_PORT (or PORT as fallback) must be a valid number.',
    );
    process.exit(1);
}

if (isNaN(MAX_UPLOAD_SIZE) || MAX_UPLOAD_SIZE <= 0) {
    logger.fatal(
        { maxUploadSize: process.env.MAX_UPLOAD_SIZE },
        'MAX_UPLOAD_SIZE must be a positive number (in bytes).',
    );
    process.exit(1);
}

app.listen(PORT, () => {
    const base = buildBaseUrl(PROTOCOL, DOMAIN, EXTERNAL_PORT);
    logger.info({ url: `${base}/api/v4`, docsUrl: `${base}/api-docs` }, 'Server started');
});
