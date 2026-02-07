import fs from 'fs';
import request from 'supertest';

const { apiVersion: API_VERSION } = JSON.parse(fs.readFileSync('version.json', 'utf8'));

const buildConfigMock = (overrides: Record<string, unknown> = {}) => ({
    API_VERSION: API_VERSION,
    PROTOCOL: overrides.PROTOCOL ?? 'http',
    DOMAIN: overrides.DOMAIN ?? 'localhost',
    PORT: overrides.PORT ?? 3333,
    EXTERNAL_PORT: overrides.EXTERNAL_PORT ?? (overrides.PORT ?? 3333),
    DEFAULT_BUCKET: 'verifiable-credentials',
    AVAILABLE_BUCKETS: ['verifiable-credentials'],
    STORAGE_TYPE: 'local',
    LOCAL_DIRECTORY: 'uploads',
    getApiKey: jest.fn(() => 'test-key'),
    AUTH_HEADER_NAME: 'x-api-key',
    __filename: '',
    __dirname: '',
});

const getSwaggerInitResponse = async (configOverrides: Record<string, unknown> = {}) => {
    jest.doMock('../src/config', () => buildConfigMock(configOverrides));
    const { app } = await import('../src/app');
    return request(app).get('/api-docs/swagger-ui-init.js').expect(200);
};

describe('Swagger URL E2E Tests', () => {
    afterEach(() => {
        jest.resetModules();
        jest.restoreAllMocks();
    });

    describe('default port omission', () => {
        it('should omit port 443 for HTTPS', async () => {
            const response = await getSwaggerInitResponse({ PROTOCOL: 'https', DOMAIN: 'api.example.com', PORT: 443 });

            expect(response.text).toContain(`"url": "https://api.example.com/api/${API_VERSION}"`);
            expect(response.text).not.toContain('"url": "https://api.example.com:443');
        });

        it('should omit port 80 for HTTP', async () => {
            const response = await getSwaggerInitResponse({ PROTOCOL: 'http', DOMAIN: 'example.com', PORT: 80 });

            expect(response.text).toContain(`"url": "http://example.com/api/${API_VERSION}"`);
            expect(response.text).not.toContain('"url": "http://example.com:80');
        });
    });

    describe('non-standard port inclusion', () => {
        it('should include port for HTTP on non-standard port', async () => {
            const response = await getSwaggerInitResponse({ PROTOCOL: 'http', DOMAIN: 'localhost', PORT: 3333 });

            expect(response.text).toContain(`"url": "http://localhost:3333/api/${API_VERSION}"`);
        });

        it('should include port for HTTPS on non-standard port', async () => {
            const response = await getSwaggerInitResponse({ PROTOCOL: 'https', DOMAIN: 'api.example.com', PORT: 8443 });

            expect(response.text).toContain(`"url": "https://api.example.com:8443/api/${API_VERSION}"`);
        });

        it('should include custom port for HTTP', async () => {
            const response = await getSwaggerInitResponse({ PROTOCOL: 'http', DOMAIN: 'dev.example.com', PORT: 8080 });

            expect(response.text).toContain(`"url": "http://dev.example.com:8080/api/${API_VERSION}"`);
        });
    });

    describe('string port values from environment variables', () => {
        it('should handle string port from env correctly', async () => {
            const response = await getSwaggerInitResponse({ PROTOCOL: 'https', DOMAIN: 'api.example.com', PORT: '443' });

            expect(response.text).toContain(`"url": "https://api.example.com/api/${API_VERSION}"`);
            expect(response.text).not.toContain('"url": "https://api.example.com:443');
        });
    });

    describe('EXTERNAL_PORT override', () => {
        it('should use EXTERNAL_PORT instead of PORT for Swagger URL', async () => {
            const response = await getSwaggerInitResponse({ PORT: 3333, EXTERNAL_PORT: 8080 });

            expect(response.text).toContain(`"url": "http://localhost:8080/api/${API_VERSION}"`);
            expect(response.text).not.toContain('"url": "http://localhost:3333');
        });

        it('should omit EXTERNAL_PORT 443 for HTTPS', async () => {
            const response = await getSwaggerInitResponse({ PROTOCOL: 'https', DOMAIN: 'api.example.com', PORT: 3333, EXTERNAL_PORT: 443 });

            expect(response.text).toContain(`"url": "https://api.example.com/api/${API_VERSION}"`);
            expect(response.text).not.toContain('"url": "https://api.example.com:443');
            expect(response.text).not.toContain('"url": "https://api.example.com:3333');
        });

        it('should omit EXTERNAL_PORT 80 for HTTP', async () => {
            const response = await getSwaggerInitResponse({ PROTOCOL: 'http', DOMAIN: 'example.com', PORT: 3333, EXTERNAL_PORT: 80 });

            expect(response.text).toContain(`"url": "http://example.com/api/${API_VERSION}"`);
            expect(response.text).not.toContain('"url": "http://example.com:80');
            expect(response.text).not.toContain('"url": "http://example.com:3333');
        });

        it('should fall back to PORT when EXTERNAL_PORT is not set', async () => {
            const response = await getSwaggerInitResponse({ PORT: 9090 });

            expect(response.text).toContain(`"url": "http://localhost:9090/api/${API_VERSION}"`);
        });
    });
});
