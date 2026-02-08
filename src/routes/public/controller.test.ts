import fs from 'fs';
import os from 'os';
import path from 'path';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { storePublic } from './controller';
import { PublicService } from './service';
import { BadRequestError } from '../../errors';

const { res: mockRes, next: mockNext, clearMockRes } = getMockRes();

jest.mock('../../config', () => ({
    AVAILABLE_BUCKETS: ['bucketName'],
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

jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    promises: {
        readFile: jest.fn().mockResolvedValue(Buffer.from('fake-binary-content')),
        unlink: jest.fn().mockResolvedValue(undefined),
    },
}));

describe('PublicController', () => {
    beforeEach(() => {
        clearMockRes();
        jest.clearAllMocks();
    });

    describe('storePublic', () => {
        it('should successfully store a JSON document and return 201 with uri and hash', async () => {
            const storeDocumentSpy = jest.spyOn(PublicService.prototype, 'storeDocument').mockResolvedValue({
                uri: 'mock-uri',
                hash: 'mocked-hash',
            });

            const mockReq = getMockReq({
                body: {
                    bucket: 'bucketName',
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    data: { name: 'test' },
                },
            });

            await storePublic(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                uri: 'mock-uri',
                hash: 'mocked-hash',
            });
            expect(storeDocumentSpy).toHaveBeenCalledWith(
                expect.anything(), // storageService
                expect.anything(), // cryptoService
                { bucket: 'bucketName', id: '123e4567-e89b-12d3-a456-426614174000', data: { name: 'test' } },
            );
        });

        it('should successfully store a binary file and return 201 with uri and hash', async () => {
            const storeFileSpy = jest.spyOn(PublicService.prototype, 'storeFile').mockResolvedValue({
                uri: 'mock-file-uri',
                hash: 'mocked-file-hash',
            });

            const tempFilePath = path.join(os.tmpdir(), 'upload-12345');
            const mockReq = getMockReq({
                file: {
                    path: tempFilePath,
                    mimetype: 'image/png',
                } as Express.Multer.File,
                body: {
                    bucket: 'bucketName',
                    id: '123e4567-e89b-12d3-a456-426614174000',
                },
            });

            await storePublic(mockReq, mockRes, mockNext);

            expect(fs.promises.readFile).toHaveBeenCalledWith(path.resolve(tempFilePath));
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                uri: 'mock-file-uri',
                hash: 'mocked-file-hash',
            });
            expect(storeFileSpy).toHaveBeenCalledWith(
                expect.anything(), // storageService
                expect.anything(), // cryptoService
                expect.objectContaining({
                    bucket: 'bucketName',
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    file: expect.any(Buffer),
                    mimeType: 'image/png',
                }),
            );
        });

        it('should return 400 for an invalid bucket', async () => {
            jest.spyOn(PublicService.prototype, 'storeDocument').mockRejectedValue(
                new BadRequestError('Invalid bucket. Must be one of the following buckets: bucketName'),
            );

            const mockReq = getMockReq({
                body: {
                    bucket: 'invalid-bucket',
                    data: { name: 'test' },
                },
            });

            await storePublic(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: expect.stringContaining('Invalid bucket'),
            });
        });

        it('should return 500 for unexpected errors', async () => {
            jest.spyOn(PublicService.prototype, 'storeDocument').mockRejectedValue(
                new Error('Something went terribly wrong'),
            );

            const mockReq = getMockReq({
                body: {
                    bucket: 'bucketName',
                    data: { name: 'test' },
                },
            });

            await storePublic(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'An unexpected error occurred while storing the resource.',
            });
        });

        it('should return 400 when multipart/form-data request has no file', async () => {
            const mockReq = getMockReq({
                body: {
                    bucket: 'bucketName',
                    id: '123e4567-e89b-12d3-a456-426614174000',
                },
            });
            mockReq.is = jest.fn((type: string) =>
                type === 'multipart/form-data' ? 'multipart/form-data' : false,
            ) as any;
            mockReq.file = undefined;

            await storePublic(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: expect.stringContaining('File is required for multipart uploads'),
            });
        });

        it('should clean up the temporary file after a binary upload', async () => {
            jest.spyOn(PublicService.prototype, 'storeFile').mockResolvedValue({
                uri: 'mock-file-uri',
                hash: 'mocked-file-hash',
            });

            const tempFilePath = path.join(os.tmpdir(), 'upload-cleanup-test');
            const mockReq = getMockReq({
                file: {
                    path: tempFilePath,
                    mimetype: 'image/png',
                } as Express.Multer.File,
                body: {
                    bucket: 'bucketName',
                },
            });

            await storePublic(mockReq, mockRes, mockNext);

            expect(fs.promises.unlink).toHaveBeenCalledWith(path.resolve(tempFilePath));
        });
        it('should not attempt to clean up when there is no temporary file', async () => {
            jest.spyOn(PublicService.prototype, 'storeDocument').mockResolvedValue({
                uri: 'mock-uri',
                hash: 'mocked-hash',
            });

            const mockReq = getMockReq({
                body: {
                    bucket: 'bucketName',
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    data: { name: 'test' },
                },
            });

            await storePublic(mockReq, mockRes, mockNext);

            expect(fs.promises.unlink).not.toHaveBeenCalled();
        });

        it('should still clean up the temporary file when an error occurs', async () => {
            (fs.promises.readFile as jest.Mock).mockRejectedValueOnce(new Error('Read failure'));

            const tempPath = path.join(os.tmpdir(), 'upload-error-cleanup');
            const mockReq = getMockReq({
                file: {
                    path: tempPath,
                    mimetype: 'image/png',
                } as Express.Multer.File,
                body: {
                    bucket: 'bucketName',
                },
            });

            await storePublic(mockReq, mockRes, mockNext);

            expect(fs.promises.unlink).toHaveBeenCalledWith(path.resolve(tempPath));
        });

        it('should log an error when temp file cleanup fails', async () => {
            (fs.promises.unlink as jest.Mock).mockRejectedValueOnce(
                Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' })
            );
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            jest.spyOn(PublicService.prototype, 'storeFile').mockResolvedValue({
                uri: 'mock-uri',
                hash: 'mocked-hash',
            });

            const tempPath = path.join(os.tmpdir(), 'upload-unlink-error');
            const mockReq = getMockReq({
                file: { path: tempPath, mimetype: 'image/png' } as any,
                body: { bucket: 'bucketName', id: '550e8400-e29b-41d4-a716-446655440000' },
            });

            await storePublic(mockReq, mockRes, mockNext);

            expect(fs.promises.unlink).toHaveBeenCalledWith(path.resolve(tempPath));
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Failed to clean up temp file'),
                expect.any(String),
                expect.any(Error),
            );

            consoleSpy.mockRestore();
        });

        it('should return 400 when file path is outside the upload directory', async () => {
            const mockReq = getMockReq({
                file: {
                    path: '/etc/passwd',
                    mimetype: 'application/octet-stream',
                } as Express.Multer.File,
                body: {
                    bucket: 'bucketName',
                    id: '123e4567-e89b-12d3-a456-426614174000',
                },
            });

            await storePublic(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Invalid upload path.',
            });
        });
    });
});
