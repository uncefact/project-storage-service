import { getMockReq, getMockRes } from '@jest-mock/express';
import { deleteResource } from './controller';
import { DeleteService } from './service';
import { BadRequestError, NotFoundError } from '../../errors';

const { res: mockRes, next: mockNext, clearMockRes } = getMockRes();

jest.mock('../../config', () => ({
    AVAILABLE_BUCKETS: ['my-bucket'],
    STORAGE_TYPE: 'gcp',
}));

jest.mock('../../services/storage/gcp', () => ({
    GCPStorageService: jest.fn().mockImplementation(() => ({
        uploadFile: jest.fn(),
        objectExists: jest.fn(),
        listObjectsByPrefix: jest.fn().mockResolvedValue([]),
        deleteFile: jest.fn(),
    })),
}));

describe('DeleteController', () => {
    beforeEach(() => {
        clearMockRes();
        jest.clearAllMocks();
    });

    it('should return 204 when delete succeeds', async () => {
        jest.spyOn(DeleteService.prototype, 'deleteDocument').mockResolvedValue(undefined);

        const mockReq = getMockReq({
            params: { bucket: 'my-bucket', id: '123e4567-e89b-12d3-a456-426614174000' },
        });

        await deleteResource(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(204);
        expect(mockRes.send).toHaveBeenCalled();
    });

    it('should return 400 for invalid bucket', async () => {
        jest.spyOn(DeleteService.prototype, 'deleteDocument').mockRejectedValue(new BadRequestError('Invalid bucket'));

        const mockReq = getMockReq({
            params: { bucket: 'invalid-bucket', id: '123e4567-e89b-12d3-a456-426614174000' },
        });

        await deleteResource(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: expect.stringContaining('Invalid bucket'),
        });
    });

    it('should return 404 when resource is not found', async () => {
        jest.spyOn(DeleteService.prototype, 'deleteDocument').mockRejectedValue(
            new NotFoundError('Resource not found'),
        );

        const mockReq = getMockReq({
            params: { bucket: 'my-bucket', id: '123e4567-e89b-12d3-a456-426614174000' },
        });

        await deleteResource(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: expect.stringContaining('Resource not found'),
        });
    });

    it('should return 500 for unexpected errors', async () => {
        jest.spyOn(DeleteService.prototype, 'deleteDocument').mockRejectedValue(new Error('Something went wrong'));

        const mockReq = getMockReq({
            params: { bucket: 'my-bucket', id: '123e4567-e89b-12d3-a456-426614174000' },
        });

        await deleteResource(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: 'An unexpected error occurred while deleting the resource.',
        });
    });
});
