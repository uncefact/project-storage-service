import { app } from './app';
import { API_VERSION, DOMAIN, EXTERNAL_PORT, MAX_UPLOAD_SIZE, PORT, PROTOCOL, getApiKey } from './config';
import { buildBaseUrl } from './utils';

// Validate required environment variables at runtime
if (!getApiKey()) {
    console.error('❌ ERROR: API_KEY environment variable is required but not set.');
    console.error('Please set API_KEY in your .env file or environment variables.');
    process.exit(1);
}

if (isNaN(Number(EXTERNAL_PORT))) {
    console.error(
        `❌ ERROR: Invalid port configuration. EXTERNAL_PORT (or PORT as fallback) must be a valid number, but resolved to '${EXTERNAL_PORT}'.`,
    );
    process.exit(1);
}

if (isNaN(MAX_UPLOAD_SIZE) || MAX_UPLOAD_SIZE <= 0) {
    console.error(`MAX_UPLOAD_SIZE must be a positive number (in bytes). Current value: '${process.env.MAX_UPLOAD_SIZE}'.`);
    process.exit(1);
}

app.listen(PORT, () => {
    const base = buildBaseUrl(PROTOCOL, DOMAIN, EXTERNAL_PORT);
    console.log(`Server is running: ${base}/api/${API_VERSION} 🚀`);
    console.log(`API documentation: ${base}/api-docs 📚`);
});
