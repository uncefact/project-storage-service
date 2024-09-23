import { IStorageService, CryptographyService } from '../../services';
import { DocumentsService } from './service';
import { v4 } from 'uuid';

jest.mock('../../config', () => ({
    AVAILABLE_BUCKETS: ['my-bucket'],
}));

jest.mock('uuid', () => ({
    v4: jest.fn(),
}));

describe('DocumentsService', () => {
    let documentsService: DocumentsService;
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

        documentsService = new DocumentsService();
    });

    describe('storeDocument', () => {
        it('should store the document in the specified bucket and return the URI and hash', async () => {
            const bucket = 'my-bucket';
            const id = 'b9c1ca4e-6b28-477f-b61d-062645ee3e88';
            const data = { document: 'content' };

            const expectedUri = `https://example.com/${bucket}/${id}.json`;
            const expectedHash = 'mocked-hash';

            storageServiceMock.uploadFile.mockResolvedValue(Promise.resolve({ uri: expectedUri }));
            cryptoServiceMock.computeHash.mockReturnValue(expectedHash);

            const result = await documentsService.storeDocument(storageServiceMock, cryptoServiceMock, {
                bucket,
                id,
                data,
            });

            expect(storageServiceMock.uploadFile).toHaveBeenCalledWith(
                bucket,
                `${id}.json`,
                JSON.stringify(data),
                'application/json',
            );
            expect(cryptoServiceMock.computeHash).toHaveBeenCalledWith(JSON.stringify(data));
            expect(result).toEqual({ uri: expectedUri, hash: expectedHash });
        });

        it('should throw an error if the bucket is not provided', async () => {
            const id = 'b9c1ca4e-6b28-477f-b61d-062645ee3e88';
            const data = { document: 'content' };

            await expect(
                documentsService.storeDocument(storageServiceMock, cryptoServiceMock, {
                    id,
                    data,
                }),
            ).rejects.toThrow('Bucket is required. Please provide a bucket name.');
        });

        it('should throw an error if the bucket is invalid', async () => {
            const bucket = 'invalid-bucket';
            const id = 'b9c1ca4e-6b28-477f-b61d-062645ee3e88';
            const data = { document: 'content' };

            await expect(
                documentsService.storeDocument(storageServiceMock, cryptoServiceMock, {
                    bucket,
                    id,
                    data,
                }),
            ).rejects.toThrow('Invalid bucket. Must be one of the following buckets: my-bucket');
        });

        it('should generate an id if the id is not provided', async () => {
            const bucket = 'my-bucket';
            const data = { document: 'content' };
            const mockId = 'b9c1ca4e-6b28-477f-b61d-062645ee3e88';
            const expectedUri = 'https://example.com/my-bucket/b9c1ca4e-6b28-477f-b61d-062645ee3e88.json';
            const expectedHash = 'mocked-hash';

            (v4 as jest.Mock).mockReturnValue(mockId);
            storageServiceMock.uploadFile.mockResolvedValue({ uri: expectedUri });
            cryptoServiceMock.computeHash.mockReturnValue(expectedHash);

            const result = await documentsService.storeDocument(storageServiceMock, cryptoServiceMock, {
                bucket,
                data,
            });

            expect(v4).toHaveBeenCalled();
            expect(storageServiceMock.uploadFile).toHaveBeenCalledWith(
                bucket,
                `${mockId}.json`,
                JSON.stringify(data),
                'application/json',
            );
            expect(cryptoServiceMock.computeHash).toHaveBeenCalledWith(JSON.stringify(data));
            expect(result).toEqual({ uri: expectedUri, hash: expectedHash });
        });

        it('should throw an error if the provided ID is not a valid UUID', async () => {
            const bucket = 'my-bucket';
            const id = 'invalid-uuid';
            const data = { document: 'content' };

            await expect(
                documentsService.storeDocument(storageServiceMock, cryptoServiceMock, {
                    bucket,
                    id,
                    data,
                }),
            ).rejects.toThrow(`Invalid id ${id}. Please provide a valid UUID.`);
        });

        it('should throw an error if the data is not a JSON object', async () => {
            const bucket = 'my-bucket';
            const id = 'b9c1ca4e-6b28-477f-b61d-062645ee3e88';
            const data: any = 'invalid-data';

            await expect(
                documentsService.storeDocument(storageServiceMock, cryptoServiceMock, {
                    bucket,
                    id,
                    data,
                }),
            ).rejects.toThrow('Data must be a JSON object. Please provide a valid JSON object.');
        });

        it('should throw a ConflictError if a document with the provided ID already exists', async () => {
            const bucket = 'my-bucket';
            const id = 'b9c1ca4e-6b28-477f-b61d-062645ee3e88';
            const data = { document: 'content' };

            storageServiceMock.objectExists.mockResolvedValue(true);

            await expect(
                documentsService.storeDocument(storageServiceMock, cryptoServiceMock, {
                    bucket,
                    id,
                    data,
                }),
            ).rejects.toThrow('A document with the provided ID already exists in the specified bucket.');
        });

        it('should throw an ApplicationError if an unexpected error occurs', async () => {
            const bucket = 'my-bucket';
            const id = 'b9c1ca4e-6b28-477f-b61d-062645ee3e88';
            const data = { document: 'content' };

            storageServiceMock.uploadFile.mockRejectedValue(new Error('Unexpected error'));

            await expect(
                documentsService.storeDocument(storageServiceMock, cryptoServiceMock, {
                    bucket,
                    id,
                    data,
                }),
            ).rejects.toThrow('An unexpected error occurred while storing the document.');
        });
    });
});
