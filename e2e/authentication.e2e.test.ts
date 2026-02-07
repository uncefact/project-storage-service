import fs from 'fs';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { app } from '../src/app';
import request from 'supertest';

const { apiVersion: API_VERSION } = JSON.parse(fs.readFileSync('version.json', 'utf8'));

jest.mock('../src/config', () => {
    const { apiVersion } = JSON.parse(require('fs').readFileSync('version.json', 'utf8'));
    return {
        API_VERSION: apiVersion,
        PROTOCOL: 'http',
        DOMAIN: 'localhost',
        PORT: 3333,
        EXTERNAL_PORT: 3333,
        DEFAULT_BUCKET: 'verifiable-credentials',
        AVAILABLE_BUCKETS: ['verifiable-credentials'],
        STORAGE_TYPE: 'local',
        REGION: 'ap-southeast-2',
        LOCAL_DIRECTORY: 'uploads',
        getApiKey: jest.fn(() => process.env.API_KEY),
        AUTH_HEADER_NAME: 'x-api-key',
        __filename: '',
        __dirname: '',
    };
});

jest.mock('../src/services/storage/local', () => ({
    LocalStorageService: jest.fn().mockImplementation(() => ({
        uploadFile: jest.fn().mockResolvedValue({ uri: 'file://uploads/test.json' }),
        objectExists: jest.fn().mockResolvedValue(false),
    })),
}));

jest.mock('../src/services/cryptography', () => ({
    CryptographyService: jest.fn().mockImplementation(() => ({
        computeHash: jest.fn().mockReturnValue('test-hash'),
        generateEncryptionKey: jest.fn().mockReturnValue('test-encryption-key'),
        encryptString: jest.fn().mockReturnValue({ encryptedData: 'encrypted', iv: 'test-iv' }),
    })),
}));

describe('Authentication E2E Tests', () => {
    const originalApiKey = process.env.API_KEY;

    beforeAll(() => {
        process.env.API_KEY = 'test-api-key-e2e';
    });

    afterAll(() => {
        process.env.API_KEY = originalApiKey;
    });

    describe(`POST /api/${API_VERSION}/documents`, () => {
        const validPayload = {
            bucket: 'verifiable-credentials',
            data: { test: 'data' },
        };

        it('should return 401 when API key is missing', async () => {
            const response = await request(app)
                .post(`/api/${API_VERSION}/documents`)
                .send(validPayload)
                .expect(401);

            expect(response.body).toEqual({
                message: 'API key is required. Please provide a valid API key in the X-API-Key header.',
            });
        });

        it('should return 401 when API key is invalid', async () => {
            const response = await request(app)
                .post(`/api/${API_VERSION}/documents`)
                .set('X-API-Key', 'invalid-key')
                .send(validPayload)
                .expect(401);

            expect(response.body).toEqual({
                message: 'Invalid API key. Please provide a valid API key.',
            });
        });

        it('should return 201 when API key is valid', async () => {
            const response = await request(app)
                .post(`/api/${API_VERSION}/documents`)
                .set('X-API-Key', 'test-api-key-e2e')
                .send(validPayload)
                .expect(201);

            expect(response.body).toHaveProperty('uri');
            expect(response.body).toHaveProperty('hash');
        });

        it('should handle runtime API key changes', async () => {
            const newKey = 'runtime-changed-key';
            process.env.API_KEY = newKey;

            const response = await request(app)
                .post(`/api/${API_VERSION}/documents`)
                .set('X-API-Key', newKey)
                .send(validPayload)
                .expect(201);

            expect(response.body).toHaveProperty('uri');
            expect(response.body).toHaveProperty('hash');

            process.env.API_KEY = 'test-api-key-e2e';
        });
    });

    describe(`POST /api/${API_VERSION}/credentials`, () => {
        const validPayload = {
            bucket: 'verifiable-credentials',
            data: { test: 'credential' },
        };

        it('should return 401 when API key is missing', async () => {
            const response = await request(app)
                .post(`/api/${API_VERSION}/credentials`)
                .send(validPayload)
                .expect(401);

            expect(response.body).toEqual({
                message: 'API key is required. Please provide a valid API key in the X-API-Key header.',
            });
        });

        it('should return 401 when API key is invalid', async () => {
            const response = await request(app)
                .post(`/api/${API_VERSION}/credentials`)
                .set('X-API-Key', 'wrong-key')
                .send(validPayload)
                .expect(401);

            expect(response.body).toEqual({
                message: 'Invalid API key. Please provide a valid API key.',
            });
        });

        it('should return 201 when API key is valid', async () => {
            const response = await request(app)
                .post(`/api/${API_VERSION}/credentials`)
                .set('X-API-Key', 'test-api-key-e2e')
                .send(validPayload)
                .expect(201);

            expect(response.body).toHaveProperty('uri');
            expect(response.body).toHaveProperty('hash');
            expect(response.body).toHaveProperty('key');
        });
    });

    describe('Health Check Endpoint', () => {
        it('should not require authentication for health-check', async () => {
            const response = await request(app)
                .get('/health-check')
                .expect(200);

            expect(response.text).toBe('OK');
        });
    });
});
