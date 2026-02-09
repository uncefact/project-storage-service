import { Storage } from '@google-cloud/storage';
import { GCPStorageService } from './gcp';

const createGeneratePublicUri =
    (publicUrl: string | undefined) =>
    (key: string): string | null => {
        if (!publicUrl) return null;
        let url: URL;
        try {
            url = new URL(publicUrl);
        } catch {
            throw new Error(`Invalid PUBLIC_URL format: "${publicUrl}" is not a valid URL`);
        }
        return `${url.origin}/${key}`;
    };

jest.mock('../../config', () => ({
    generatePublicUri: () => null,
}));

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

    describe('PUBLIC_URL override', () => {
        beforeEach(() => {
            jest.resetModules();
            jest.clearAllMocks();
        });

        it('should use PUBLIC_URL when set, ignoring bucket in URI', async () => {
            jest.doMock('../../config', () => ({
                generatePublicUri: createGeneratePublicUri('https://documents.labs.pyx.io'),
            }));

            // Re-mock @google-cloud/storage after resetModules
            const mockFileSave = jest.fn().mockResolvedValue([]);
            jest.doMock('@google-cloud/storage', () => ({
                Storage: jest.fn(() => ({
                    bucket: jest.fn(() => ({
                        file: jest.fn(() => ({ save: mockFileSave })),
                    })),
                })),
            }));

            const { GCPStorageService } = require('./gcp');
            const service = new GCPStorageService();
            const result = await service.uploadFile('test-bucket', 'test-key.json', 'test-body', 'application/json');
            expect(result).toEqual({ uri: 'https://documents.labs.pyx.io/test-key.json' });
        });

        it('should use default GCS URI when PUBLIC_URL is not set', async () => {
            jest.doMock('../../config', () => ({
                generatePublicUri: createGeneratePublicUri(undefined),
            }));

            const mockFileSave = jest.fn().mockResolvedValue([]);
            jest.doMock('@google-cloud/storage', () => ({
                Storage: jest.fn(() => ({
                    bucket: jest.fn(() => ({
                        file: jest.fn(() => ({ save: mockFileSave })),
                    })),
                })),
            }));

            const { GCPStorageService } = require('./gcp');
            const service = new GCPStorageService();
            const result = await service.uploadFile('test-bucket', 'test-key.json', 'test-body', 'application/json');
            expect(result).toEqual({ uri: 'https://test-bucket.storage.googleapis.com/test-key.json' });
        });

        it('should throw an error if PUBLIC_URL is not a valid URL', async () => {
            jest.doMock('../../config', () => ({
                generatePublicUri: createGeneratePublicUri('not-a-valid-url'),
            }));

            const mockFileSave = jest.fn().mockResolvedValue([]);
            jest.doMock('@google-cloud/storage', () => ({
                Storage: jest.fn(() => ({
                    bucket: jest.fn(() => ({
                        file: jest.fn(() => ({ save: mockFileSave })),
                    })),
                })),
            }));

            const { GCPStorageService } = require('./gcp');
            const service = new GCPStorageService();
            await expect(
                service.uploadFile('test-bucket', 'test-key', 'test-body', 'application/json'),
            ).rejects.toThrow('Invalid PUBLIC_URL format');
        });
    });
});
