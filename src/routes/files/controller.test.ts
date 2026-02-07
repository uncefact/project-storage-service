import fs from 'fs';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { uploadFile } from './controller';
import { FilesService } from './service';
import { BadRequestError } from '../../errors';

const { res: mockRes, next: mockNext, clearMockRes } = getMockRes();

jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    readFileSync: jest.fn(),
    unlink: jest.fn(),
}));

jest.mock('../../config', () => ({
    AVAILABLE_BUCKETS: ['bucketName'],
    ALLOWED_BINARY_TYPES: ['image/png', 'image/jpeg', 'application/pdf'],
    MAX_BINARY_FILE_SIZE: 10485760,
    STORAGE_TYPE: 'gcp',
}));

jest.mock('../../services/storage/gcp', () => ({
    GCPStorageService: jest.fn().mockImplementation(() => ({
        uploadFile: jest.fn().mockResolvedValue({ uri: 'mock-uri' }),
        objectExists: jest.fn().mockResolvedValue(false),
    })),
}));

jest.mock('../../services/cryptography', () => ({
    CryptographyService: jest.fn().mockImplementation(() => ({
        computeHash: jest.fn().mockReturnValue('mocked-hash'),
    })),
}));

describe('uploadFile Handler', () => {
    beforeEach(() => {
        clearMockRes();
        jest.restoreAllMocks();
        (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('fake-png'));
        (fs.unlink as unknown as jest.Mock).mockImplementation((_path, cb) => cb());
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('should return 201 with uri and hash on successful upload', async () => {
        const mockReq = getMockReq({
            file: {
                path: '/tmp/upload-123',
                mimetype: 'image/png',
            },
            body: {
                bucket: 'bucketName',
                id: 'b9c1ca4e-6b28-477f-b61d-062645ee3e88',
            },
        } as any);

        await uploadFile(mockReq as any, mockRes, mockNext);

        expect(fs.readFileSync).toHaveBeenCalledWith('/tmp/upload-123');
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith({
            uri: 'mock-uri',
            hash: 'mocked-hash',
        });
    });

    it('should return 400 when no file is provided', async () => {
        const mockReq = getMockReq({
            body: {
                bucket: 'bucketName',
                id: 'b9c1ca4e-6b28-477f-b61d-062645ee3e88',
            },
        });

        await uploadFile(mockReq as any, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: 'File is required. Please upload a file.',
        });
    });

    it('should handle ApiError from service', async () => {
        jest.spyOn(FilesService.prototype, 'storeFile').mockRejectedValueOnce(
            new BadRequestError('Invalid bucket. Must be one of the following buckets: bucketName'),
        );

        const mockReq = getMockReq({
            file: {
                path: '/tmp/upload-456',
                mimetype: 'image/png',
            },
            body: {
                bucket: 'invalid-bucket',
                id: 'b9c1ca4e-6b28-477f-b61d-062645ee3e88',
            },
        } as any);

        await uploadFile(mockReq as any, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: expect.stringContaining('Invalid bucket'),
        });
    });

    it('should clean up temp file after successful upload', async () => {
        const mockReq = getMockReq({
            file: {
                path: '/tmp/upload-789',
                mimetype: 'image/png',
            },
            body: {
                bucket: 'bucketName',
                id: 'b9c1ca4e-6b28-477f-b61d-062645ee3e88',
            },
        } as any);

        await uploadFile(mockReq as any, mockRes, mockNext);

        expect(fs.unlink).toHaveBeenCalledWith('/tmp/upload-789', expect.any(Function));
    });

    it('should clean up temp file after failed upload', async () => {
        jest.spyOn(FilesService.prototype, 'storeFile').mockRejectedValueOnce(new Error('boom'));

        const mockReq = getMockReq({
            file: {
                path: '/tmp/upload-fail',
                mimetype: 'image/png',
            },
            body: {
                bucket: 'bucketName',
                id: 'b9c1ca4e-6b28-477f-b61d-062645ee3e88',
            },
        } as any);

        await uploadFile(mockReq as any, mockRes, mockNext);

        expect(fs.unlink).toHaveBeenCalledWith('/tmp/upload-fail', expect.any(Function));
    });
});
