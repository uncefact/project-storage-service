import { Storage } from '@google-cloud/storage';
import { GCPStorageService } from './gcp';

jest.mock('@google-cloud/storage', () => {
    const mockFileExists = jest.fn().mockResolvedValue([true]);
    const mockFileSave = jest.fn().mockResolvedValue([]);
    const mockFile = jest.fn(() => ({ save: mockFileSave, exists: mockFileExists }));
    const mockBucket = jest.fn(() => ({ file: mockFile }));
    return { Storage: jest.fn(() => ({ bucket: mockBucket })) };
});

describe('GCPStorageService', () => {
    let service: GCPStorageService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new GCPStorageService();
    });

    it('should upload a file and return its URI', async () => {
        const bucketName = 'custom-bucket';
        const key = 'test-file';
        const body = '{"test": "data"}';
        const contentType = 'application/json';

        const expectedUri = `https://${bucketName}.storage.googleapis.com/${key}`;
        const result = await service.uploadFile(bucketName, key, body, contentType);

        const mockFileSave = (Storage as unknown as jest.Mock).mock.results[0].value.bucket().file().save;

        expect(Storage).toHaveBeenCalledTimes(1);
        expect(mockFileSave).toHaveBeenCalledWith(body, {
            metadata: { contentType },
        });

        expect(result).toEqual({ uri: expectedUri });
    });

    it('should upload a Buffer body and return its URI', async () => {
        const bucketName = 'custom-bucket';
        const key = 'test-file.bin';
        const body = Buffer.from('binary content');
        const contentType = 'application/octet-stream';

        const expectedUri = `https://${bucketName}.storage.googleapis.com/${key}`;
        const result = await service.uploadFile(bucketName, key, body, contentType);

        const mockFileSave = (Storage as unknown as jest.Mock).mock.results[0].value.bucket().file().save;

        expect(mockFileSave).toHaveBeenCalledWith(body, {
            metadata: { contentType },
        });

        expect(result).toEqual({ uri: expectedUri });
    });

    it('should check objectExists using the key as-passed without appending .json', async () => {
        const bucketName = 'custom-bucket';
        const key = 'test-file.json';

        const result = await service.objectExists(bucketName, key);

        const mockStorageInstance = (Storage as unknown as jest.Mock).mock.results[0].value;
        const mockBucket = mockStorageInstance.bucket;
        const mockFile = mockBucket.mock.results[mockBucket.mock.results.length - 1].value.file;

        expect(mockBucket).toHaveBeenCalledWith(bucketName);
        expect(mockFile).toHaveBeenCalledWith(key);
        expect(result).toBe(true);
    });
});
