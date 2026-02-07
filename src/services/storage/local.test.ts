import { LocalStorageService } from './local';

// Read version.json before fs is auto-mocked by jest.mock('fs') below.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { apiVersion: API_VERSION } = JSON.parse(jest.requireActual('fs').readFileSync('version.json', 'utf8'));

jest.mock('../../config', () => {
    const realFs = jest.requireActual('fs');
    const { apiVersion } = JSON.parse(realFs.readFileSync('version.json', 'utf8'));
    return {
        API_VERSION: apiVersion,
        DOMAIN: 'localhost',
        LOCAL_DIRECTORY: 'uploads',
        PORT: '3333',
        EXTERNAL_PORT: '3333',
        PROTOCOL: 'http',
    };
});

jest.mock('fs');
jest.mock('path');

describe('LocalStorageService', () => {
    let storageService: LocalStorageService;

    beforeEach(() => {
        storageService = new LocalStorageService();
    });

    it('should upload a json string to the local file system', async () => {
        const bucket = 'test-bucket';
        const key = 'test-file.json';
        const body = '{"test": "data"}';
        const contentType = 'application/json';

        const result = await storageService.uploadFile(bucket, key, body, contentType);

        expect(result.uri).toEqual(`http://localhost:3333/api/${API_VERSION}/test-bucket/test-file.json`);
    });
});
