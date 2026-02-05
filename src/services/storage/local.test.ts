import { LocalStorageService } from './local';

jest.mock('../../config', () => ({
    API_VERSION: '1.0.0',
    DOMAIN: 'localhost',
    LOCAL_DIRECTORY: 'uploads',
    PORT: '3333',
    EXTERNAL_PORT: '3333',
    PROTOCOL: 'http',
}));

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

        expect(result.uri).toEqual('http://localhost:3333/api/1.0.0/test-bucket/test-file.json');
    });
});
