import fs from 'fs';
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
        AVAILABLE_BUCKETS: ['verifiable-credentials', 'files'],
        STORAGE_TYPE: 'local',
        REGION: 'ap-southeast-2',
        LOCAL_DIRECTORY: 'uploads',
        getApiKey: jest.fn(() => process.env.API_KEY),
        AUTH_HEADER_NAME: 'x-api-key',
        __filename: '',
        __dirname: '',
        ALLOWED_BINARY_TYPES: ['image/png', 'image/jpeg', 'application/pdf'],
        MAX_BINARY_FILE_SIZE: 10485760,
    };
});

jest.mock('../src/services/storage/local', () => ({
    LocalStorageService: jest.fn().mockImplementation(() => ({
        uploadFile: jest.fn().mockResolvedValue({ uri: 'file://uploads/test.png' }),
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

// Minimal valid PNG (1x1 transparent pixel)
const MINIMAL_PNG = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489' +
    '0000000a49444154789c626000000002000198e195280000000049454e44ae426082',
    'hex',
);

// Minimal valid PDF
const MINIMAL_PDF = Buffer.from(
    '%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/MediaBox[0 0 3 3]/Parent 2 0 R>>endobj\n' +
    'xref\n0 4\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF',
);

describe('Binary Upload E2E Tests', () => {
    const originalApiKey = process.env.API_KEY;

    beforeAll(() => {
        process.env.API_KEY = 'test-api-key-e2e';
    });

    afterAll(() => {
        process.env.API_KEY = originalApiKey;
    });

    describe(`POST /api/${API_VERSION}/files`, () => {
        it('should return 201 when uploading a valid PNG', async () => {
            const response = await request(app)
                .post(`/api/${API_VERSION}/files`)
                .set('X-API-Key', 'test-api-key-e2e')
                .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                .field('bucket', 'files')
                .expect(201);

            expect(response.body).toHaveProperty('uri');
            expect(response.body).toHaveProperty('hash');
        });

        it('should return 201 when uploading a valid PDF', async () => {
            const response = await request(app)
                .post(`/api/${API_VERSION}/files`)
                .set('X-API-Key', 'test-api-key-e2e')
                .attach('file', MINIMAL_PDF, { filename: 'test.pdf', contentType: 'application/pdf' })
                .field('bucket', 'files')
                .expect(201);

            expect(response.body).toHaveProperty('uri');
            expect(response.body).toHaveProperty('hash');
        });

        it('should return 201 with a custom ID', async () => {
            const customId = '123e4567-e89b-12d3-a456-426614174000';
            const response = await request(app)
                .post(`/api/${API_VERSION}/files`)
                .set('X-API-Key', 'test-api-key-e2e')
                .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                .field('bucket', 'files')
                .field('id', customId)
                .expect(201);

            expect(response.body).toHaveProperty('uri');
            expect(response.body).toHaveProperty('hash');
        });

        it('should return 401 when API key is missing', async () => {
            const response = await request(app)
                .post(`/api/${API_VERSION}/files`)
                .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                .field('bucket', 'verifiable-credentials')
                .expect(401);

            expect(response.body).toHaveProperty('message');
        });

        it('should return 401 when API key is invalid', async () => {
            const response = await request(app)
                .post(`/api/${API_VERSION}/files`)
                .set('X-API-Key', 'invalid-key')
                .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                .field('bucket', 'verifiable-credentials')
                .expect(401);

            expect(response.body).toHaveProperty('message');
        });

        it('should return 400 when no file is attached', async () => {
            const response = await request(app)
                .post(`/api/${API_VERSION}/files`)
                .set('X-API-Key', 'test-api-key-e2e')
                .field('bucket', 'verifiable-credentials')
                .expect(400);

            expect(response.body.message).toContain('File is required');
        });

        it('should reject when MIME type is not in allow-list', async () => {
            const response = await request(app)
                .post(`/api/${API_VERSION}/files`)
                .set('X-API-Key', 'test-api-key-e2e')
                .attach('file', Buffer.from('not a real zip'), { filename: 'test.zip', contentType: 'application/zip' })
                .field('bucket', 'verifiable-credentials');

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('not allowed');
        });

        it('should return 400 when bucket is missing', async () => {
            const response = await request(app)
                .post(`/api/${API_VERSION}/files`)
                .set('X-API-Key', 'test-api-key-e2e')
                .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                .expect(400);

            expect(response.body.message).toContain('Bucket is required');
        });

        it('should return 400 when bucket is not in available list', async () => {
            const response = await request(app)
                .post(`/api/${API_VERSION}/files`)
                .set('X-API-Key', 'test-api-key-e2e')
                .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                .field('bucket', 'nonexistent-bucket')
                .expect(400);

            expect(response.body.message).toContain('Invalid bucket');
        });

        it('should return 409 when file with same ID already exists', async () => {
            // Override the mock for this test to return true for objectExists
            const { LocalStorageService } = require('../src/services/storage/local');
            LocalStorageService.mockImplementation(() => ({
                uploadFile: jest.fn().mockResolvedValue({ uri: 'file://uploads/test.png' }),
                objectExists: jest.fn().mockResolvedValue(true),
            }));

            const response = await request(app)
                .post(`/api/${API_VERSION}/files`)
                .set('X-API-Key', 'test-api-key-e2e')
                .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                .field('bucket', 'verifiable-credentials')
                .expect(409);

            expect(response.body.message).toContain('already exists');

            // Restore the default mock
            LocalStorageService.mockImplementation(() => ({
                uploadFile: jest.fn().mockResolvedValue({ uri: 'file://uploads/test.png' }),
                objectExists: jest.fn().mockResolvedValue(false),
            }));
        });
    });

    describe('Backwards compatibility', () => {
        it('should still accept JSON uploads via /documents', async () => {
            const response = await request(app)
                .post(`/api/${API_VERSION}/documents`)
                .set('X-API-Key', 'test-api-key-e2e')
                .send({
                    bucket: 'verifiable-credentials',
                    data: { test: 'data' },
                })
                .expect(201);

            expect(response.body).toHaveProperty('uri');
            expect(response.body).toHaveProperty('hash');
        });

        it('should still accept JSON uploads via /credentials', async () => {
            const response = await request(app)
                .post(`/api/${API_VERSION}/credentials`)
                .set('X-API-Key', 'test-api-key-e2e')
                .send({
                    bucket: 'verifiable-credentials',
                    data: { test: 'credential' },
                })
                .expect(201);

            expect(response.body).toHaveProperty('uri');
            expect(response.body).toHaveProperty('hash');
            expect(response.body).toHaveProperty('key');
        });
    });
});
