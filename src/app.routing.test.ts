import request from 'supertest';
import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * Routing-level integration tests for the v4 path layout. These tests assemble
 * the real Express app and assert how URLs map to handlers. They are intentionally
 * coarse: handler internals are mocked so the assertions stay focused on routing.
 *
 * Specifically:
 * - `/api/v4/{public,private,:bucket/:id}` reaches the correct sub-router.
 * - Legacy SemVer paths (`/api/3.0.0/...`, `/api/3.1.0/...`, `/api/v3/...`) return 404.
 * - The static-file middleware mounted inside the v4 router serves files at
 *   `/api/v4/<bucket>/<key>` and NOT at the un-prefixed `/<bucket>/<key>`.
 */

const tempUploadsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'storage-service-routing-test-'));
const TEST_BUCKET = 'test-bucket';
const TEST_FILE = 'fixture.txt';
const TEST_FILE_BODY = 'routing-test-fixture-contents';

beforeAll(() => {
    fs.mkdirSync(path.join(tempUploadsDir, TEST_BUCKET), { recursive: true });
    fs.writeFileSync(path.join(tempUploadsDir, TEST_BUCKET, TEST_FILE), TEST_FILE_BODY);
});

afterAll(() => {
    fs.rmSync(tempUploadsDir, { recursive: true, force: true });
});

jest.mock('./config', () => ({
    PROTOCOL: 'http',
    DOMAIN: 'localhost',
    PORT: 3333,
    EXTERNAL_PORT: 3333,
    DEFAULT_BUCKET: undefined,
    AVAILABLE_BUCKETS: ['test-bucket'],
    STORAGE_TYPE: 'local',
    LOCAL_DIRECTORY: tempUploadsDir,
    MAX_UPLOAD_SIZE: 10 * 1024 * 1024,
    getApiKey: jest.fn(() => 'test-api-key'),
    AUTH_HEADER_NAME: 'x-api-key',
    __filename: '',
    __dirname: '',
}));

// Stub the route controllers so the routing tests are independent of handler logic.
// Each stub responds with a status that uniquely identifies the handler that ran,
// so a 404 means the route did not resolve (which is what we want to assert for
// legacy SemVer paths).
jest.mock('./routes/v4/public/controller', () => ({
    storePublic: (_req: any, res: any) => res.status(201).json({ handler: 'public' }),
}));
jest.mock('./routes/v4/private/controller', () => ({
    storePrivate: (_req: any, res: any) => res.status(201).json({ handler: 'private' }),
}));
jest.mock('./routes/v4/delete/controller', () => ({
    deleteResource: (_req: any, res: any) => res.status(204).end(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { app } = require('./app');

const API_KEY_HEADER = { 'x-api-key': 'test-api-key' };

describe('App routing layout', () => {
    describe('/api/v4 routes', () => {
        it('mounts the public router at POST /api/v4/public', async () => {
            const response = await request(app).post('/api/v4/public').set(API_KEY_HEADER).send({});
            expect(response.status).toBe(201);
            expect(response.body).toEqual({ handler: 'public' });
        });

        it('mounts the private router at POST /api/v4/private', async () => {
            const response = await request(app).post('/api/v4/private').set(API_KEY_HEADER).send({});
            expect(response.status).toBe(201);
            expect(response.body).toEqual({ handler: 'private' });
        });

        it('mounts the delete router at DELETE /api/v4/:bucket/:id', async () => {
            const response = await request(app).delete('/api/v4/test-bucket/some-id').set(API_KEY_HEADER);
            expect(response.status).toBe(204);
        });
    });

    describe('legacy SemVer paths return 404', () => {
        // Versioning is part of the public API contract. If a future refactor accidentally
        // reintroduces a backward-compat alias these tests fail loudly.
        it.each([
            ['POST', '/api/3.0.0/public'],
            ['POST', '/api/3.1.0/public'],
            ['POST', '/api/3.0.0/private'],
            ['POST', '/api/3.1.0/private'],
            ['POST', '/api/v3/public'],
        ])('%s %s returns 404', async (method, url) => {
            const response =
                method === 'POST'
                    ? await request(app).post(url).set(API_KEY_HEADER).send({})
                    : await request(app).get(url).set(API_KEY_HEADER);
            expect(response.status).toBe(404);
        });
    });

    describe('static file serving inside the v4 router', () => {
        it('serves files at /api/v4/<bucket>/<key>', async () => {
            const response = await request(app).get(`/api/v4/${TEST_BUCKET}/${TEST_FILE}`);
            expect(response.status).toBe(200);
            expect(response.text).toBe(TEST_FILE_BODY);
        });

        it('does not serve files at the un-prefixed /<bucket>/<key>', async () => {
            const response = await request(app).get(`/${TEST_BUCKET}/${TEST_FILE}`);
            expect(response.status).toBe(404);
        });

        it('returns 404 for missing files under /api/v4/', async () => {
            const response = await request(app).get('/api/v4/test-bucket/does-not-exist.txt');
            expect(response.status).toBe(404);
        });
    });

    describe('health-check stays at the top level', () => {
        it('responds at /health-check (not /api/v4/health-check)', async () => {
            const ok = await request(app).get('/health-check');
            expect(ok.status).toBe(200);
            const notFound = await request(app).get('/api/v4/health-check');
            expect(notFound.status).toBe(404);
        });
    });
});
