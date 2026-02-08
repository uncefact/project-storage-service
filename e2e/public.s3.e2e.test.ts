import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { APP_BASE_URL, API_KEY, API_VERSION, resolveUri, computeHash } from './helpers';

jest.setTimeout(30000);

const testDocument = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuer: 'did:example:123',
    credentialSubject: {
        id: 'did:example:456',
        name: 'Test Subject',
    },
};

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

// Buffer exceeding 10MB MAX_UPLOAD_SIZE
const OVERSIZED_FILE = Buffer.alloc(10485761, 0x00);

describe('Public API - S3 E2E Tests', () => {
    describe('Health Check', () => {
        it('should return 200 OK for /health-check', async () => {
            const response = await request(APP_BASE_URL).get('/health-check').expect(200);

            expect(response.text).toBe('OK');
        });
    });

    describe(`POST /api/${API_VERSION}/public (JSON)`, () => {
        describe('Authentication', () => {
            it('should return 401 when API key is missing', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .send({ bucket: 'verifiable-credentials', data: testDocument })
                    .expect(401);

                expect(response.body.message).toContain('API key is required');
            });

            it('should return 401 when API key is invalid', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', 'wrong-api-key')
                    .send({ bucket: 'verifiable-credentials', data: testDocument })
                    .expect(401);

                expect(response.body.message).toContain('Invalid API key');
            });
        });

        describe('Validation', () => {
            it('should return 400 when bucket is missing', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', API_KEY)
                    .send({ data: { test: 'data' } })
                    .expect(400);

                expect(response.body.message).toContain('Bucket is required');
            });

            it('should return 400 when bucket is not in available list', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', API_KEY)
                    .send({ bucket: 'nonexistent', data: { test: 'data' } })
                    .expect(400);

                expect(response.body.message).toContain('Invalid bucket');
            });

            it('should return 400 when data is not a JSON object', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', API_KEY)
                    .send({ bucket: 'verifiable-credentials', data: 'not-an-object' })
                    .expect(400);

                expect(response.body.message).toContain('Data must be a JSON object');
            });

            it('should return 400 when id is not a valid UUID', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', API_KEY)
                    .send({ bucket: 'verifiable-credentials', id: 'not-a-uuid', data: { test: 'data' } })
                    .expect(400);

                expect(response.body.message).toContain('Invalid id');
            });
        });

        describe('Storage', () => {
            it('should return 201 with uri and hash', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', API_KEY)
                    .send({ bucket: 'verifiable-credentials', data: testDocument })
                    .expect(201);

                expect(response.body.uri).toEqual(expect.any(String));
                expect(response.body.uri.length).toBeGreaterThan(0);
                expect(response.body.hash).toEqual(expect.any(String));
                expect(response.body.hash.length).toBeGreaterThan(0);
            });

            it('should return 201 with custom UUID id', async () => {
                const customId = '123e4567-e89b-12d3-a456-426614174000';
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', API_KEY)
                    .send({ bucket: 'verifiable-credentials', id: customId, data: testDocument })
                    .expect(201);

                expect(response.body.uri).toEqual(expect.any(String));
                expect(response.body.uri).toContain(customId);
            });

            it('should return 409 when document with same id already exists', async () => {
                const duplicateId = uuidv4();

                const first = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', API_KEY)
                    .send({ bucket: 'verifiable-credentials', id: duplicateId, data: testDocument })
                    .expect(201);

                expect(first.body.uri).toEqual(expect.any(String));

                const second = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', API_KEY)
                    .send({ bucket: 'verifiable-credentials', id: duplicateId, data: testDocument })
                    .expect(409);

                expect(second.body.message).toContain('already exists');
            });
        });

        describe('Round-trip verification', () => {
            it('should store JSON and return it unchanged via GET on returned URI', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', API_KEY)
                    .send({ bucket: 'verifiable-credentials', data: testDocument })
                    .expect(201);

                const uri = response.body.uri;
                const resolvedUrl = resolveUri(uri);
                const fetchResponse = await fetch(resolvedUrl);
                const body = await fetchResponse.json();

                expect(body).toEqual(testDocument);
            });

            it('should produce a valid SHA-256 hash of the stored data', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', API_KEY)
                    .send({ bucket: 'verifiable-credentials', data: testDocument })
                    .expect(201);

                const expectedHash = computeHash(JSON.stringify(testDocument));
                expect(response.body.hash).toBe(expectedHash);
            });
        });
    });

    describe(`POST /api/${API_VERSION}/public (Binary)`, () => {
        describe('Authentication', () => {
            it('should return 401 when API key is missing', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                    .field('bucket', 'files')
                    .expect(401);

                expect(response.body.message).toContain('API key is required');
            });

            it('should return 401 when API key is invalid', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', 'wrong-api-key')
                    .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                    .field('bucket', 'files')
                    .expect(401);

                expect(response.body.message).toContain('Invalid API key');
            });
        });

        describe('Validation', () => {
            it('should return 400 when no file is attached', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', API_KEY)
                    .field('bucket', 'files')
                    .expect(400);

                expect(response.body.message).toContain('File is required for multipart uploads');
            });

            it('should return 400 when bucket is missing', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                    .expect(400);

                expect(response.body.message).toContain('Bucket is required');
            });

            it('should return 400 when bucket is not in available list', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                    .field('bucket', 'nonexistent-bucket')
                    .expect(400);

                expect(response.body.message).toContain('Invalid bucket');
            });

            it('should return 400 when id is not a valid UUID', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                    .field('bucket', 'files')
                    .field('id', 'not-a-valid-uuid')
                    .expect(400);

                expect(response.body.message).toContain('Invalid id');
            });

            it('should reject when MIME type is not in allow-list', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', Buffer.from('not a real zip'), {
                        filename: 'test.zip',
                        contentType: 'application/zip',
                    })
                    .field('bucket', 'files');

                expect(response.status).toBe(400);
                expect(response.body.message).toContain('not allowed');
            });

            it('should return 413 when file exceeds maximum allowed size', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', OVERSIZED_FILE, { filename: 'large.png', contentType: 'image/png' })
                    .field('bucket', 'files')
                    .expect(413);

                expect(response.body.message).toContain('exceeds the maximum allowed size');
            });
        });

        describe('Storage', () => {
            it('should return 201 when uploading a valid PNG', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                    .field('bucket', 'files')
                    .expect(201);

                expect(response.body.uri).toEqual(expect.any(String));
                expect(response.body.uri.length).toBeGreaterThan(0);
                expect(response.body.hash).toEqual(expect.any(String));
                expect(response.body.hash.length).toBeGreaterThan(0);
            });

            it('should return 201 when uploading a valid PDF', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', MINIMAL_PDF, { filename: 'test.pdf', contentType: 'application/pdf' })
                    .field('bucket', 'files')
                    .expect(201);

                expect(response.body.uri).toEqual(expect.any(String));
                expect(response.body.uri.length).toBeGreaterThan(0);
                expect(response.body.hash).toEqual(expect.any(String));
                expect(response.body.hash.length).toBeGreaterThan(0);
            });

            it('should return 201 when uploading a valid JPEG', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', Buffer.from('fake-jpeg-content'), {
                        filename: 'test.jpg',
                        contentType: 'image/jpeg',
                    })
                    .field('bucket', 'files')
                    .expect(201);

                expect(response.body.uri).toEqual(expect.any(String));
                expect(response.body.uri.length).toBeGreaterThan(0);
                expect(response.body.hash).toEqual(expect.any(String));
                expect(response.body.hash.length).toBeGreaterThan(0);
            });

            it('should return 201 with a custom UUID id', async () => {
                const customId = uuidv4();
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                    .field('bucket', 'files')
                    .field('id', customId)
                    .expect(201);

                expect(response.body.uri).toEqual(expect.any(String));
                expect(response.body.uri).toContain(customId);
            });

            it('should return 409 when file with same id already exists', async () => {
                const duplicateId = uuidv4();

                const first = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                    .field('bucket', 'files')
                    .field('id', duplicateId)
                    .expect(201);

                expect(first.body.uri).toEqual(expect.any(String));

                const second = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                    .field('bucket', 'files')
                    .field('id', duplicateId)
                    .expect(409);

                expect(second.body.message).toContain('already exists');
            });
        });

        describe('Round-trip verification', () => {
            it('should store a PNG and return the identical binary via GET on returned URI', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                    .field('bucket', 'files')
                    .expect(201);

                const uri = response.body.uri;
                const resolvedUrl = resolveUri(uri);
                const fetchResponse = await fetch(resolvedUrl);
                const buf = Buffer.from(await fetchResponse.arrayBuffer());

                expect(buf.equals(MINIMAL_PNG)).toBe(true);
            });

            it('should store a PDF and return the identical binary via GET on returned URI', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', MINIMAL_PDF, { filename: 'test.pdf', contentType: 'application/pdf' })
                    .field('bucket', 'files')
                    .expect(201);

                const uri = response.body.uri;
                const resolvedUrl = resolveUri(uri);
                const fetchResponse = await fetch(resolvedUrl);
                const buf = Buffer.from(await fetchResponse.arrayBuffer());

                expect(buf.equals(MINIMAL_PDF)).toBe(true);
            });

            it('should produce a valid SHA-256 hash of the stored file', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                    .field('bucket', 'files')
                    .expect(201);

                const expectedHash = computeHash(MINIMAL_PNG);
                expect(response.body.hash).toBe(expectedHash);
            });
        });
    });
});
