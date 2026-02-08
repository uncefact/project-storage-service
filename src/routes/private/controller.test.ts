import { getMockReq, getMockRes } from '@jest-mock/express';
import { BadRequestError } from '../../errors';
import { PrivateService } from './service';

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
        generateEncryptionKey: jest.fn().mockReturnValue('test-encryption-key'),
        encryptString: jest.fn().mockReturnValue({ cipherText: 'encrypted', iv: 'test-iv', tag: 'test-tag', type: 'aes-256-gcm' }),
    })),
}));

jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    promises: {
        readFile: jest.fn().mockResolvedValue(Buffer.from('binary-content')),
        unlink: jest.fn().mockResolvedValue(undefined),
    },
}));

import fs from 'fs';
import { storePrivate } from './controller';

describe('Private Controller', () => {
    beforeEach(() => {
        clearMockRes();
        jest.clearAllMocks();
    });

    describe('storePrivate', () => {
        it('should successfully store a JSON document and return 201', async () => {
            const spy = jest.spyOn(PrivateService.prototype, 'encryptAndStoreDocument').mockResolvedValue({
                uri: 'mock-uri',
                hash: 'mocked-hash',
                decryptionKey: 'test-encryption-key',
            });

            const mockReq = getMockReq({
                body: {
                    bucket: 'bucketName',
                    id: '550e8400-e29b-41d4-a716-446655440000',
                    data: { key: 'value' },
                },
            });

            await storePrivate(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                uri: 'mock-uri',
                hash: 'mocked-hash',
                decryptionKey: 'test-encryption-key',
            });
            expect(spy).toHaveBeenCalledWith(
                expect.anything(), // storageService
                expect.anything(), // cryptographyService
                { bucket: 'bucketName', id: '550e8400-e29b-41d4-a716-446655440000', data: { key: 'value' } },
            );
        });

        it('should successfully store a binary file and return 201', async () => {
            const spy = jest.spyOn(PrivateService.prototype, 'encryptAndStoreFile').mockResolvedValue({
                uri: 'mock-uri',
                hash: 'mocked-hash',
                decryptionKey: 'test-encryption-key',
            });

            const mockReq = getMockReq({
                file: {
                    path: '/tmp/upload-12345',
                    mimetype: 'image/png',
                } as any,
                body: {
                    bucket: 'bucketName',
                    id: '550e8400-e29b-41d4-a716-446655440000',
                },
            });

            await storePrivate(mockReq, mockRes, mockNext);

            expect(fs.promises.readFile).toHaveBeenCalledWith('/tmp/upload-12345');
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                uri: 'mock-uri',
                hash: 'mocked-hash',
                decryptionKey: 'test-encryption-key',
            });
            expect(spy).toHaveBeenCalledWith(
                expect.anything(),
                expect.anything(),
                expect.objectContaining({
                    bucket: 'bucketName',
                    id: '550e8400-e29b-41d4-a716-446655440000',
                    file: expect.any(Buffer),
                    mimeType: 'image/png',
                }),
            );
        });

        it('should return 400 for an invalid bucket', async () => {
            jest.spyOn(PrivateService.prototype, 'encryptAndStoreDocument').mockRejectedValue(
                new BadRequestError('Invalid bucket. Must be one of the following buckets: bucketName'),
            );

            const mockReq = getMockReq({
                body: {
                    bucket: 'invalidBucket',
                    data: { key: 'value' },
                },
            });

            await storePrivate(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: expect.stringContaining('Invalid bucket'),
            });
        });

        it('should return 500 when a non-ApiError is thrown', async () => {
            jest.spyOn(PrivateService.prototype, 'encryptAndStoreDocument').mockRejectedValue(
                new Error('Something went terribly wrong'),
            );

            const mockReq = getMockReq({
                body: {
                    bucket: 'bucketName',
                    data: { key: 'value' },
                },
            });

            await storePrivate(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'An unexpected error occurred while storing private data.',
            });
        });

        it('should return 400 when multipart/form-data request has no file', async () => {
            const mockReq = getMockReq({
                body: {
                    bucket: 'bucketName',
                    id: '550e8400-e29b-41d4-a716-446655440000',
                },
            });
            mockReq.is = jest.fn((type: string) =>
                type === 'multipart/form-data' ? 'multipart/form-data' : false,
            ) as any;
            mockReq.file = undefined;

            await storePrivate(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: expect.stringContaining('File is required for multipart uploads'),
            });
        });

        it('should clean up the temporary file after a binary upload', async () => {
            jest.spyOn(PrivateService.prototype, 'encryptAndStoreFile').mockResolvedValue({
                uri: 'mock-uri',
                hash: 'mocked-hash',
                decryptionKey: 'test-encryption-key',
            });

            const tempPath = '/tmp/upload-cleanup-test';
            const mockReq = getMockReq({
                file: {
                    path: tempPath,
                    mimetype: 'image/png',
                } as any,
                body: {
                    bucket: 'bucketName',
                    id: '550e8400-e29b-41d4-a716-446655440000',
                },
            });

            await storePrivate(mockReq, mockRes, mockNext);

            expect(fs.promises.unlink).toHaveBeenCalledWith(tempPath);
        });

        it('should not attempt to clean up when there is no temporary file', async () => {
            jest.spyOn(PrivateService.prototype, 'encryptAndStoreDocument').mockResolvedValue({
                uri: 'mock-uri',
                hash: 'mocked-hash',
                decryptionKey: 'test-encryption-key',
            });

            const mockReq = getMockReq({
                body: {
                    bucket: 'bucketName',
                    id: '550e8400-e29b-41d4-a716-446655440000',
                    data: { key: 'value' },
                },
            });

            await storePrivate(mockReq, mockRes, mockNext);

            expect(fs.promises.unlink).not.toHaveBeenCalled();
        });

        it('should still clean up the temporary file when an error occurs', async () => {
            (fs.promises.readFile as jest.Mock).mockRejectedValueOnce(new Error('Read failure'));

            const tempPath = '/tmp/upload-error-cleanup';
            const mockReq = getMockReq({
                file: {
                    path: tempPath,
                    mimetype: 'image/png',
                } as any,
                body: {
                    bucket: 'bucketName',
                },
            });

            await storePrivate(mockReq, mockRes, mockNext);

            expect(fs.promises.unlink).toHaveBeenCalledWith(tempPath);
        });

        it('should log an error when temp file cleanup fails', async () => {
            (fs.promises.unlink as jest.Mock).mockRejectedValueOnce(
                Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' })
            );
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            jest.spyOn(PrivateService.prototype, 'encryptAndStoreFile').mockResolvedValue({
                uri: 'mock-uri',
                hash: 'mocked-hash',
                decryptionKey: 'test-encryption-key',
            });

            const mockReq = getMockReq({
                file: { path: '/tmp/upload-unlink-error', mimetype: 'image/png' } as any,
                body: { bucket: 'bucketName', id: '550e8400-e29b-41d4-a716-446655440000' },
            });

            await storePrivate(mockReq, mockRes, mockNext);

            expect(fs.promises.unlink).toHaveBeenCalledWith('/tmp/upload-unlink-error');
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Failed to clean up temp file'),
                expect.any(Error),
            );

            consoleSpy.mockRestore();
        });
    });
});
