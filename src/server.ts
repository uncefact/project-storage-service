import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import { API_VERSION, DOMAIN, PORT, PROTOCOL, getApiKey } from './config';

// Validate required environment variables at runtime
if (!getApiKey()) {
    console.error('❌ ERROR: API_KEY environment variable is required but not set.');
    console.error('Please set API_KEY in your .env file or environment variables.');
    process.exit(1);
}

app.listen(PORT, () => {
    console.log(`Server is running: ${PROTOCOL}://${DOMAIN}:${PORT}/api/${API_VERSION} 🚀`);
    console.log(`API documentation: ${PROTOCOL}://${DOMAIN}:${PORT}/api-docs 📚`);
});
