import { app } from './app';
import { API_VERSION, DOMAIN, EXTERNAL_PORT, MAX_UPLOAD_SIZE, PORT, PROTOCOL, getApiKey } from './config';
import { buildBaseUrl } from './utils';
import { serverLogger as logger } from './services/logging';

// Validate required environment variables at runtime
if (!getApiKey()) {
    logger.error(
        'API_KEY environment variable is required but not set. Set API_KEY in your .env file or environment variables.',
    );
    process.exit(1);
}

if (isNaN(Number(EXTERNAL_PORT))) {
    logger.error(
        { externalPort: EXTERNAL_PORT },
        'Invalid port configuration. EXTERNAL_PORT (or PORT as fallback) must be a valid number.',
    );
    process.exit(1);
}

if (isNaN(MAX_UPLOAD_SIZE) || MAX_UPLOAD_SIZE <= 0) {
    logger.error(
        { maxUploadSize: process.env.MAX_UPLOAD_SIZE },
        'MAX_UPLOAD_SIZE must be a positive number (in bytes).',
    );
    process.exit(1);
}

app.listen(PORT, () => {
    const base = buildBaseUrl(PROTOCOL, DOMAIN, EXTERNAL_PORT);
    logger.info({ url: `${base}/api/${API_VERSION}`, docsUrl: `${base}/api-docs` }, 'Server started');
});
