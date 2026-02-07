import { IStorageService, CryptographyService } from '../../services';
import { FilesService } from './service';
import { v4 } from 'uuid';

jest.mock('../../config', () => ({
    AVAILABLE_BUCKETS: ['my-bucket'],
    ALLOWED_BINARY_TYPES: ['image/png', 'image/jpeg', 'application/pdf'],
    MAX_BINARY_FILE_SIZE: 10485760,
}));

jest.mock('uuid', () => ({
    v4: jest.fn(),
}));

describe('FilesService', () => {
    let filesService: FilesService;
    let storageServiceMock: jest.Mocked<IStorageService>;
    let cryptoServiceMock: jest.Mocked<CryptographyService>;

    beforeEach(() => {
        storageServiceMock = {
            uploadFile: jest.fn(),
            objectExists: jest.fn(),
        } as jest.Mocked<IStorageService>;

        cryptoServiceMock = {
            computeHash: jest.fn(),
        } as jest.Mocked<any>;

        filesService = new FilesService();
    });

    describe('storeFile', () => {
        it('should store a binary file with correct content type and extension', async () => {
            const bucket = 'my-bucket';
            const id = 'b9c1ca4e-6b28-477f-b61d-062645ee3e88';
            const file = Buffer.from('fake-png-content');
            const mimeType = 'image/png';

            const expectedUri = `https://example.com/${bucket}/${id}.png`;
            const expectedHash = 'mocked-hash';

            storageServiceMock.uploadFile.mockResolvedValue({ uri: expectedUri });
            storageServiceMock.objectExists.mockResolvedValue(false);
            cryptoServiceMock.computeHash.mockReturnValue(expectedHash);

            const result = await filesService.storeFile(storageServiceMock, cryptoServiceMock, {
                bucket,
                id,
                file,
                mimeType,
            });

            expect(storageServiceMock.uploadFile).toHaveBeenCalledWith(
                bucket,
                `${id}.png`,
                file,
                'image/png',
            );
            expect(result).toEqual({ uri: expectedUri, hash: expectedHash });
        });

        it('should compute hash from raw Buffer', async () => {
            const bucket = 'my-bucket';
            const id = 'b9c1ca4e-6b28-477f-b61d-062645ee3e88';
            const file = Buffer.from('binary-content');
            const mimeType = 'image/jpeg';

            const expectedUri = `https://example.com/${bucket}/${id}.jpeg`;
            const expectedHash = 'buffer-hash';

            storageServiceMock.uploadFile.mockResolvedValue({ uri: expectedUri });
            storageServiceMock.objectExists.mockResolvedValue(false);
            cryptoServiceMock.computeHash.mockReturnValue(expectedHash);

            await filesService.storeFile(storageServiceMock, cryptoServiceMock, {
                bucket,
                id,
                file,
                mimeType,
            });

            expect(cryptoServiceMock.computeHash).toHaveBeenCalledWith(file);
        });

        it('should reject when bucket is missing', async () => {
            const file = Buffer.from('content');
            const mimeType = 'image/png';

            await expect(
                filesService.storeFile(storageServiceMock, cryptoServiceMock, {
                    file,
                    mimeType,
                }),
            ).rejects.toThrow('Bucket is required. Please provide a bucket name.');
        });

        it('should reject when bucket is not in available list', async () => {
            const bucket = 'invalid-bucket';
            const file = Buffer.from('content');
            const mimeType = 'image/png';

            await expect(
                filesService.storeFile(storageServiceMock, cryptoServiceMock, {
                    bucket,
                    file,
                    mimeType,
                }),
            ).rejects.toThrow('Invalid bucket. Must be one of the following buckets: my-bucket');
        });

        it('should reject when file is missing', async () => {
            const bucket = 'my-bucket';
            const mimeType = 'image/png';

            await expect(
                filesService.storeFile(storageServiceMock, cryptoServiceMock, {
                    bucket,
                    mimeType,
                }),
            ).rejects.toThrow('File is required. Please provide a file.');
        });

        it('should reject when MIME type is not allowed', async () => {
            const bucket = 'my-bucket';
            const file = Buffer.from('content');
            const mimeType = 'text/plain';

            await expect(
                filesService.storeFile(storageServiceMock, cryptoServiceMock, {
                    bucket,
                    file,
                    mimeType,
                }),
            ).rejects.toThrow('Invalid MIME type. Must be one of the following types: image/png, image/jpeg, application/pdf');
        });

        it('should generate UUID when no ID provided', async () => {
            const bucket = 'my-bucket';
            const file = Buffer.from('content');
            const mimeType = 'image/png';
            const mockId = 'b9c1ca4e-6b28-477f-b61d-062645ee3e88';
            const expectedUri = `https://example.com/my-bucket/${mockId}.png`;
            const expectedHash = 'mocked-hash';

            (v4 as jest.Mock).mockReturnValue(mockId);
            storageServiceMock.uploadFile.mockResolvedValue({ uri: expectedUri });
            storageServiceMock.objectExists.mockResolvedValue(false);
            cryptoServiceMock.computeHash.mockReturnValue(expectedHash);

            const result = await filesService.storeFile(storageServiceMock, cryptoServiceMock, {
                bucket,
                file,
                mimeType,
            });

            expect(v4).toHaveBeenCalled();
            expect(storageServiceMock.uploadFile).toHaveBeenCalledWith(
                bucket,
                `${mockId}.png`,
                file,
                'image/png',
            );
            expect(result).toEqual({ uri: expectedUri, hash: expectedHash });
        });

        it('should reject invalid UUID', async () => {
            const bucket = 'my-bucket';
            const id = 'invalid-uuid';
            const file = Buffer.from('content');
            const mimeType = 'image/png';

            await expect(
                filesService.storeFile(storageServiceMock, cryptoServiceMock, {
                    bucket,
                    id,
                    file,
                    mimeType,
                }),
            ).rejects.toThrow(`Invalid id ${id}. Please provide a valid UUID.`);
        });

        it('should throw ConflictError when file with same ID exists', async () => {
            const bucket = 'my-bucket';
            const id = 'b9c1ca4e-6b28-477f-b61d-062645ee3e88';
            const file = Buffer.from('content');
            const mimeType = 'image/png';

            storageServiceMock.objectExists.mockResolvedValue(true);

            await expect(
                filesService.storeFile(storageServiceMock, cryptoServiceMock, {
                    bucket,
                    id,
                    file,
                    mimeType,
                }),
            ).rejects.toThrow('A file with the provided ID already exists in the specified bucket.');
        });

        it('should throw an ApplicationError if an unexpected error occurs', async () => {
            const bucket = 'my-bucket';
            const id = 'b9c1ca4e-6b28-477f-b61d-062645ee3e88';
            const file = Buffer.from('content');
            const mimeType = 'image/png';

            storageServiceMock.objectExists.mockResolvedValue(false);
            storageServiceMock.uploadFile.mockRejectedValue(new Error('Unexpected error'));

            await expect(
                filesService.storeFile(storageServiceMock, cryptoServiceMock, {
                    bucket,
                    id,
                    file,
                    mimeType,
                }),
            ).rejects.toThrow('An unexpected error occurred while storing the file.');
        });
    });
});
