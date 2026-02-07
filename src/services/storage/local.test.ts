import { LocalStorageService } from './local';

const { apiVersion: API_VERSION } = require('../../../version.json');

jest.mock('../../config', () => {
    const { apiVersion } = require('../../../version.json');
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

    it('should upload a Buffer body to the local file system', async () => {
        const bucket = 'test-bucket';
        const key = 'test-file.bin';
        const body = Buffer.from('binary content');
        const contentType = 'application/octet-stream';

        const result = await storageService.uploadFile(bucket, key, body, contentType);

        expect(result.uri).toEqual(`http://localhost:3333/api/${API_VERSION}/test-bucket/test-file.bin`);
    });

    it('should use key as-passed in objectExists without appending .json', () => {
        // Verify the implementation passes the key directly to path.join
        // without appending '.json'. We read the source to confirm since
        // the fs/path auto-mocks don't support callback-based APIs well.
        const realFs = jest.requireActual('fs') as typeof import('fs');
        const realPath = jest.requireActual('path') as typeof import('path');
        const source = realFs.readFileSync(realPath.resolve(__dirname, './local.ts'), 'utf8');

        // Extract the objectExists method body
        const methodMatch = source.match(/async objectExists[\s\S]*?\n    \}/);
        expect(methodMatch).toBeTruthy();
        const methodBody = methodMatch![0];

        // Should NOT contain key + '.json' pattern
        expect(methodBody).not.toContain("key + '.json'");
        expect(methodBody).not.toContain('key + ".json"');
        expect(methodBody).not.toContain('`${key}.json`');
    });
});
