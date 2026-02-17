import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { APP_BASE_URL, API_KEY, API_VERSION } from './helpers';

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

describe('Delete API - S3 E2E Tests', () => {
    describe(`DELETE /api/${API_VERSION}/:bucket/:id`, () => {
        describe('Authentication', () => {
            it('should return 401 when API key is missing', async () => {
                const response = await request(APP_BASE_URL)
                    .delete(`/api/${API_VERSION}/documents/${uuidv4()}`)
                    .expect(401);

                expect(response.body.message).toContain('API key is required');
            });

            it('should return 401 when API key is invalid', async () => {
                const response = await request(APP_BASE_URL)
                    .delete(`/api/${API_VERSION}/documents/${uuidv4()}`)
                    .set('X-API-Key', 'wrong-api-key')
                    .expect(401);

                expect(response.body.message).toContain('Invalid API key');
            });
        });

        describe('Validation', () => {
            it('should return 400 when bucket is not in available list', async () => {
                const response = await request(APP_BASE_URL)
                    .delete(`/api/${API_VERSION}/nonexistent/${uuidv4()}`)
                    .set('X-API-Key', API_KEY)
                    .expect(400);

                expect(response.body.message).toContain('Invalid bucket');
            });

            it('should return 400 when id is not a valid UUID', async () => {
                const response = await request(APP_BASE_URL)
                    .delete(`/api/${API_VERSION}/documents/not-a-uuid`)
                    .set('X-API-Key', API_KEY)
                    .expect(400);

                expect(response.body.message).toContain('Invalid id');
            });
        });

        describe('Delete operations', () => {
            it('should return 204 when deleting a public JSON document', async () => {
                const docId = uuidv4();

                // Store first
                await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', API_KEY)
                    .send({ bucket: 'documents', id: docId, data: testDocument })
                    .expect(201);

                // Delete
                await request(APP_BASE_URL)
                    .delete(`/api/${API_VERSION}/documents/${docId}`)
                    .set('X-API-Key', API_KEY)
                    .expect(204);
            });

            it('should return 204 when deleting a public binary file', async () => {
                const fileId = uuidv4();

                // Store first
                await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', API_KEY)
                    .attach('file', MINIMAL_PNG, { filename: 'test.png', contentType: 'image/png' })
                    .field('bucket', 'files')
                    .field('id', fileId)
                    .expect(201);

                // Delete
                await request(APP_BASE_URL)
                    .delete(`/api/${API_VERSION}/files/${fileId}`)
                    .set('X-API-Key', API_KEY)
                    .expect(204);
            });

            it('should return 204 when deleting a private document', async () => {
                const docId = uuidv4();

                // Store first
                await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/private`)
                    .set('X-API-Key', API_KEY)
                    .send({ bucket: 'documents', id: docId, data: testDocument })
                    .expect(201);

                // Delete
                await request(APP_BASE_URL)
                    .delete(`/api/${API_VERSION}/documents/${docId}`)
                    .set('X-API-Key', API_KEY)
                    .expect(204);
            });

            it('should return 404 when resource does not exist', async () => {
                const response = await request(APP_BASE_URL)
                    .delete(`/api/${API_VERSION}/documents/${uuidv4()}`)
                    .set('X-API-Key', API_KEY)
                    .expect(404);

                expect(response.body.message).toContain('not found');
            });

            it('should return 404 when deleting the same resource twice', async () => {
                const docId = uuidv4();

                // Store
                await request(APP_BASE_URL)
                    .post(`/api/${API_VERSION}/public`)
                    .set('X-API-Key', API_KEY)
                    .send({ bucket: 'documents', id: docId, data: testDocument })
                    .expect(201);

                // First delete succeeds
                await request(APP_BASE_URL)
                    .delete(`/api/${API_VERSION}/documents/${docId}`)
                    .set('X-API-Key', API_KEY)
                    .expect(204);

                // Second delete returns 404
                const response = await request(APP_BASE_URL)
                    .delete(`/api/${API_VERSION}/documents/${docId}`)
                    .set('X-API-Key', API_KEY)
                    .expect(404);

                expect(response.body.message).toContain('not found');
            });
        });
    });
});
