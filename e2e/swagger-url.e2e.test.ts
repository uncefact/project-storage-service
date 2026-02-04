import request from 'supertest';

const buildConfigMock = (overrides: Record<string, unknown> = {}) => ({
    API_VERSION: '1.0.0',
    PROTOCOL: overrides.PROTOCOL ?? 'http',
    DOMAIN: overrides.DOMAIN ?? 'localhost',
    PORT: overrides.PORT ?? 3333,
    DEFAULT_BUCKET: 'verifiable-credentials',
    AVAILABLE_BUCKETS: ['verifiable-credentials'],
    STORAGE_TYPE: 'local',
    LOCAL_DIRECTORY: 'uploads',
    getApiKey: jest.fn(() => 'test-key'),
    AUTH_HEADER_NAME: 'x-api-key',
    __filename: '',
    __dirname: '',
});

describe('Swagger URL E2E Tests', () => {
    afterEach(() => {
        jest.resetModules();
        jest.restoreAllMocks();
    });

    describe('default port omission', () => {
        it('should omit port 443 for HTTPS', async () => {
            jest.doMock('../src/config', () => buildConfigMock({ PROTOCOL: 'https', DOMAIN: 'api.example.com', PORT: 443 }));
            const { app } = await import('../src/app');

            const response = await request(app).get('/api-docs/swagger-ui-init.js').expect(200);

            expect(response.text).toContain('"url": "https://api.example.com/api/1.0.0"');
            expect(response.text).not.toContain('"url": "https://api.example.com:443');
        });

        it('should omit port 80 for HTTP', async () => {
            jest.doMock('../src/config', () => buildConfigMock({ PROTOCOL: 'http', DOMAIN: 'example.com', PORT: 80 }));
            const { app } = await import('../src/app');

            const response = await request(app).get('/api-docs/swagger-ui-init.js').expect(200);

            expect(response.text).toContain('"url": "http://example.com/api/1.0.0"');
            expect(response.text).not.toContain('"url": "http://example.com:80');
        });
    });

    describe('non-standard port inclusion', () => {
        it('should include port for HTTP on non-standard port', async () => {
            jest.doMock('../src/config', () => buildConfigMock({ PROTOCOL: 'http', DOMAIN: 'localhost', PORT: 3333 }));
            const { app } = await import('../src/app');

            const response = await request(app).get('/api-docs/swagger-ui-init.js').expect(200);

            expect(response.text).toContain('"url": "http://localhost:3333/api/1.0.0"');
        });

        it('should include port for HTTPS on non-standard port', async () => {
            jest.doMock('../src/config', () => buildConfigMock({ PROTOCOL: 'https', DOMAIN: 'api.example.com', PORT: 8443 }));
            const { app } = await import('../src/app');

            const response = await request(app).get('/api-docs/swagger-ui-init.js').expect(200);

            expect(response.text).toContain('"url": "https://api.example.com:8443/api/1.0.0"');
        });

        it('should include custom port for HTTP', async () => {
            jest.doMock('../src/config', () => buildConfigMock({ PROTOCOL: 'http', DOMAIN: 'dev.example.com', PORT: 8080 }));
            const { app } = await import('../src/app');

            const response = await request(app).get('/api-docs/swagger-ui-init.js').expect(200);

            expect(response.text).toContain('"url": "http://dev.example.com:8080/api/1.0.0"');
        });
    });

    describe('string port values from environment variables', () => {
        it('should handle string port from env correctly', async () => {
            jest.doMock('../src/config', () => buildConfigMock({ PROTOCOL: 'https', DOMAIN: 'api.example.com', PORT: '443' }));
            const { app } = await import('../src/app');

            const response = await request(app).get('/api-docs/swagger-ui-init.js').expect(200);

            expect(response.text).toContain('"url": "https://api.example.com/api/1.0.0"');
            expect(response.text).not.toContain('"url": "https://api.example.com:443');
        });
    });
});
