import { IStorageService } from '../../services';
import { DeleteService } from './service';
import { BadRequestError, NotFoundError, ApplicationError } from '../../errors';

jest.mock('../../config', () => ({
    AVAILABLE_BUCKETS: ['my-bucket'],
}));

describe('DeleteService', () => {
    let service: DeleteService;
    let mockStorageService: jest.Mocked<IStorageService>;

    beforeEach(() => {
        jest.clearAllMocks();

        service = new DeleteService();

        mockStorageService = {
            uploadFile: jest.fn(),
            objectExists: jest.fn(),
            listObjectsByPrefix: jest.fn().mockResolvedValue(['123e4567-e89b-12d3-a456-426614174000.json']),
            deleteFile: jest.fn().mockResolvedValue(undefined),
        };
    });

    const validBucket = 'my-bucket';
    const validId = '123e4567-e89b-12d3-a456-426614174000';

    it('should successfully delete a document', async () => {
        await service.deleteDocument(mockStorageService, validBucket, validId);

        expect(mockStorageService.listObjectsByPrefix).toHaveBeenCalledWith(validBucket, validId);
        expect(mockStorageService.deleteFile).toHaveBeenCalledWith(
            validBucket,
            '123e4567-e89b-12d3-a456-426614174000.json',
        );
    });

    it('should throw BadRequestError when bucket is not in AVAILABLE_BUCKETS', async () => {
        await expect(service.deleteDocument(mockStorageService, 'invalid-bucket', validId)).rejects.toThrow(
            BadRequestError,
        );
        await expect(service.deleteDocument(mockStorageService, 'invalid-bucket', validId)).rejects.toThrow(
            'Invalid bucket',
        );
    });

    it('should throw BadRequestError when id is not a valid UUID', async () => {
        await expect(service.deleteDocument(mockStorageService, validBucket, 'not-a-uuid')).rejects.toThrow(
            BadRequestError,
        );
        await expect(service.deleteDocument(mockStorageService, validBucket, 'not-a-uuid')).rejects.toThrow(
            'Invalid id',
        );
    });

    it('should throw NotFoundError when no objects match the id', async () => {
        mockStorageService.listObjectsByPrefix.mockResolvedValue([]);

        await expect(service.deleteDocument(mockStorageService, validBucket, validId)).rejects.toThrow(NotFoundError);
        mockStorageService.listObjectsByPrefix.mockResolvedValue([]);
        await expect(service.deleteDocument(mockStorageService, validBucket, validId)).rejects.toThrow('not found');
    });

    it('should delete the first matched object when multiple exist', async () => {
        mockStorageService.listObjectsByPrefix.mockResolvedValue([
            '123e4567-e89b-12d3-a456-426614174000.json',
            '123e4567-e89b-12d3-a456-426614174000.png',
        ]);

        await service.deleteDocument(mockStorageService, validBucket, validId);

        expect(mockStorageService.deleteFile).toHaveBeenCalledWith(
            validBucket,
            '123e4567-e89b-12d3-a456-426614174000.json',
        );
    });

    it('should throw ApplicationError when listObjectsByPrefix fails', async () => {
        mockStorageService.listObjectsByPrefix.mockRejectedValue(new Error('Storage connection failed'));

        await expect(service.deleteDocument(mockStorageService, validBucket, validId)).rejects.toThrow(
            ApplicationError,
        );
    });

    it('should throw ApplicationError when deleteFile fails', async () => {
        mockStorageService.deleteFile.mockRejectedValue(new Error('Delete failed'));

        await expect(service.deleteDocument(mockStorageService, validBucket, validId)).rejects.toThrow(
            ApplicationError,
        );
    });
});
