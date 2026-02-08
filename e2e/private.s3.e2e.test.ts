import request from 'supertest';

import { APP_BASE_URL, API_KEY, API_VERSION, resolveUri, computeHash, decryptEnvelope, EncryptedEnvelope } from './helpers';

jest.setTimeout(30000);

const { v4: uuidv4 } = require('uuid');

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

describe('Private API - S3 E2E Tests', () => {
    describe(`POST /api/${API_VERSION}/private (JSON)`, () => {
        describe('Authentication', () => {
            it('should return 401 when API key is missing', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .send({ bucket: 'verifiable-credentials', data: testDocument })
                    .expect(401);

                expect(response.body).toHaveProperty('message');
            });

            it('should return 401 when API key is invalid', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', 'invalid-key')
                    .send({ bucket: 'verifiable-credentials', data: testDocument })
                    .expect(401);

                expect(response.body).toHaveProperty('message');
            });
        });

        describe('Validation', () => {
            it('should return 400 when bucket is missing', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', API_KEY)
                    .send({ data: testDocument })
                    .expect(400);

                expect(response.body.message).toContain('Bucket is required');
            });

            it('should return 400 when bucket is not in available list', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', API_KEY)
                    .send({ bucket: 'nonexistent-bucket', data: testDocument })
                    .expect(400);

                expect(response.body.message).toContain('Invalid bucket');
            });

            it('should return 400 when data is not a JSON object', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', API_KEY)
                    .send({ bucket: 'verifiable-credentials', data: 'not-an-object' })
                    .expect(400);

                expect(response.body.message).toContain('Data must be a JSON object');
            });

            it('should return 400 when id is not a valid UUID', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', API_KEY)
                    .send({ bucket: 'verifiable-credentials', id: 'not-a-uuid', data: testDocument })
                    .expect(400);

                expect(response.body.message).toContain('Invalid id');
            });
        });

        describe('Storage', () => {
            it('should return 201 with uri, hash, and decryptionKey', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', API_KEY)
                    .send({ bucket: 'verifiable-credentials', data: testDocument })
                    .expect(201);

                expect(response.body.uri).toEqual(expect.any(String));
                expect(response.body.uri.length).toBeGreaterThan(0);
                expect(response.body.hash).toEqual(expect.any(String));
                expect(response.body.hash.length).toBeGreaterThan(0);
                expect(response.body.decryptionKey).toEqual(expect.any(String));
                expect(response.body.decryptionKey.length).toBeGreaterThan(0);
            });

            it('should return 201 with custom UUID id', async () => {
                const customId = uuidv4();
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', API_KEY)
                    .send({ bucket: 'verifiable-credentials', id: customId, data: testDocument })
                    .expect(201);

                expect(response.body.uri).toEqual(expect.any(String));
                expect(response.body.uri.length).toBeGreaterThan(0);
                expect(response.body.uri).toContain(customId);
            });

            it('should return 409 when document with same id already exists', async () => {
                const duplicateId = uuidv4();

                await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', API_KEY)
                    .send({ bucket: 'verifiable-credentials', id: duplicateId, data: testDocument })
                    .expect(201);

                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', API_KEY)
                    .send({ bucket: 'verifiable-credentials', id: duplicateId, data: testDocument })
                    .expect(409);

                expect(response.body.message).toContain('already exists');
            });
        });

        describe('Round-trip verification', () => {
            it('should store an encrypted envelope retrievable via GET on returned URI', async () => {
                const postResponse = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', API_KEY)
                    .send({ bucket: 'verifiable-credentials', data: testDocument })
                    .expect(201);

                const resolvedUri = resolveUri(postResponse.body.uri);
                const getResponse = await fetch(resolvedUri);
                const envelope = await getResponse.json();

                expect(typeof envelope).toBe('object');
                expect(envelope).not.toBeNull();
            });

            it('should return a valid encrypted envelope with cipherText, iv, tag, type, contentType', async () => {
                const postResponse = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', API_KEY)
                    .send({ bucket: 'verifiable-credentials', data: testDocument })
                    .expect(201);

                const resolvedUri = resolveUri(postResponse.body.uri);
                const getResponse = await fetch(resolvedUri);
                const envelope: EncryptedEnvelope = await getResponse.json();

                expect(envelope).toHaveProperty('cipherText');
                expect(envelope).toHaveProperty('iv');
                expect(envelope).toHaveProperty('tag');
                expect(envelope).toHaveProperty('type');
                expect(envelope).toHaveProperty('contentType');
                expect(envelope.type).toBe('aes-256-gcm');
                expect(envelope.contentType).toBe('application/json');
            });
        });

        describe('Decrypt verification', () => {
            it('should decrypt the envelope with the returned key to recover the original JSON', async () => {
                const postResponse = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', API_KEY)
                    .send({ bucket: 'verifiable-credentials', data: testDocument })
                    .expect(201);

                const { uri, decryptionKey } = postResponse.body;
                const resolvedUri = resolveUri(uri);
                const getResponse = await fetch(resolvedUri);
                const envelope: EncryptedEnvelope = await getResponse.json();

                const decrypted = decryptEnvelope(envelope, decryptionKey);
                const recovered = JSON.parse(decrypted);

                expect(recovered).toEqual(testDocument);
            });

            it('should produce a valid SHA-256 hash of the original (unencrypted) data', async () => {
                const postResponse = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', API_KEY)
                    .send({ bucket: 'verifiable-credentials', data: testDocument })
                    .expect(201);

                const expectedHash = computeHash(JSON.stringify(testDocument));
                expect(postResponse.body.hash).toBe(expectedHash);
            });
        });
    });

    describe(`POST /api/${API_VERSION}/private (Binary)`, () => {
        describe('Authentication', () => {
            it('should return 401 when API key is missing', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                    .field('bucket', 'files')
                    .expect(401);

                expect(response.body).toHaveProperty('message');
            });

            it('should return 401 when API key is invalid', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', 'invalid-key')
                    .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                    .field('bucket', 'files')
                    .expect(401);

                expect(response.body).toHaveProperty('message');
            });
        });

        describe('Validation', () => {
            it('should return 400 when no file is attached', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', API_KEY)
                    .field('bucket', 'files')
                    .expect(400);

                expect(response.body.message).toContain('File is required for multipart uploads');
            });

            it('should return 400 when bucket is missing', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                    .expect(400);

                expect(response.body.message).toContain('Bucket is required');
            });

            it('should return 400 when bucket is not in available list', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                    .field('bucket', 'nonexistent-bucket')
                    .expect(400);

                expect(response.body.message).toContain('Invalid bucket');
            });

            it('should return 400 when id is not a valid UUID', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                    .field('bucket', 'files')
                    .field('id', 'not-a-valid-uuid')
                    .expect(400);

                expect(response.body.message).toContain('Invalid id');
            });

            it('should reject when MIME type is not in allow-list', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', Buffer.from('not a real zip'), { filename: 'test.zip', contentType: 'application/zip' })
                    .field('bucket', 'files');

                expect(response.status).toBe(400);
                expect(response.body.message).toContain('not allowed');
            });

            it('should return 413 when file exceeds maximum allowed size', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', OVERSIZED_FILE, { filename: 'large.png', contentType: 'image/png' })
                    .field('bucket', 'files')
                    .expect(413);

                expect(response.body.message).toContain('exceeds the maximum allowed size');
            });
        });

        describe('Storage', () => {
            it('should return 201 when uploading a valid PNG and return decryptionKey', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                    .field('bucket', 'files')
                    .expect(201);

                expect(response.body.uri).toEqual(expect.any(String));
                expect(response.body.uri.length).toBeGreaterThan(0);
                expect(response.body.hash).toEqual(expect.any(String));
                expect(response.body.hash.length).toBeGreaterThan(0);
                expect(response.body.decryptionKey).toEqual(expect.any(String));
                expect(response.body.decryptionKey.length).toBeGreaterThan(0);
            });

            it('should return 201 when uploading a valid PDF and return decryptionKey', async () => {
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', MINIMAL_PDF, { filename: 'test.pdf', contentType: 'application/pdf' })
                    .field('bucket', 'files')
                    .expect(201);

                expect(response.body.uri).toEqual(expect.any(String));
                expect(response.body.uri.length).toBeGreaterThan(0);
                expect(response.body.hash).toEqual(expect.any(String));
                expect(response.body.hash.length).toBeGreaterThan(0);
                expect(response.body.decryptionKey).toEqual(expect.any(String));
                expect(response.body.decryptionKey.length).toBeGreaterThan(0);
            });

            it('should return 201 with a custom UUID id', async () => {
                const customId = uuidv4();
                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                    .field('bucket', 'files')
                    .field('id', customId)
                    .expect(201);

                expect(response.body.uri).toEqual(expect.any(String));
                expect(response.body.uri.length).toBeGreaterThan(0);
                expect(response.body.uri).toContain(customId);
            });

            it('should return 409 when file with same id already exists', async () => {
                const duplicateId = uuidv4();

                await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                    .field('bucket', 'files')
                    .field('id', duplicateId)
                    .expect(201);

                const response = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                    .field('bucket', 'files')
                    .field('id', duplicateId)
                    .expect(409);

                expect(response.body.message).toContain('already exists');
            });
        });

        describe('Round-trip verification', () => {
            it('should store an encrypted envelope retrievable via GET on returned URI', async () => {
                const postResponse = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                    .field('bucket', 'files')
                    .expect(201);

                const resolvedUri = resolveUri(postResponse.body.uri);
                const getResponse = await fetch(resolvedUri);
                const envelope = await getResponse.json();

                expect(typeof envelope).toBe('object');
                expect(envelope).not.toBeNull();
            });

            it('should return a valid encrypted envelope with cipherText, iv, tag, type, contentType', async () => {
                const postResponse = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                    .field('bucket', 'files')
                    .expect(201);

                const resolvedUri = resolveUri(postResponse.body.uri);
                const getResponse = await fetch(resolvedUri);
                const envelope: EncryptedEnvelope = await getResponse.json();

                expect(envelope).toHaveProperty('cipherText');
                expect(envelope).toHaveProperty('iv');
                expect(envelope).toHaveProperty('tag');
                expect(envelope).toHaveProperty('type');
                expect(envelope).toHaveProperty('contentType');
                expect(envelope.type).toBe('aes-256-gcm');
                expect(envelope.contentType).toBe('image/png');
            });
        });

        describe('Decrypt verification', () => {
            it('should decrypt the envelope with the returned key to recover the original binary (base64)', async () => {
                const postResponse = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                    .field('bucket', 'files')
                    .expect(201);

                const { uri, decryptionKey } = postResponse.body;
                const resolvedUri = resolveUri(uri);
                const getResponse = await fetch(resolvedUri);
                const envelope: EncryptedEnvelope = await getResponse.json();

                const decrypted = decryptEnvelope(envelope, decryptionKey);
                const recovered = Buffer.from(decrypted, 'base64');

                expect(recovered.equals(MINIMAL_PNG)).toBe(true);
            });

            it('should produce a valid SHA-256 hash of the original (unencrypted) file buffer', async () => {
                const postResponse = await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                    .field('bucket', 'files')
                    .expect(201);

                const expectedHash = computeHash(MINIMAL_PNG);
                expect(postResponse.body.hash).toBe(expectedHash);
            });
        });
    });
});
