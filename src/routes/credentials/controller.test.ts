import { getMockReq, getMockRes } from '@jest-mock/express';
import { storeCredential } from './controller';
import { CredentialsService } from './service';
import { ConflictError } from '../../errors';

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

jest.mock('../../services/cryptography/crypto', () => ({
    CryptographyService: jest.fn().mockImplementation(() => ({
        computeHash: jest.fn().mockReturnValue('mock-hash'),
        generateEncryptionKey: jest.fn().mockReturnValue('mock-key'),
        encryptString: jest.fn().mockReturnValue({ encryptedData: 'encryptedData' }),
    })),
}));

describe('storeCredential Handler', () => {
    beforeEach(() => {
        clearMockRes();
        jest.restoreAllMocks();
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('successfully stores credentials and responds with 201 status and response body', async () => {
        const mockReq = getMockReq({
            body: {
                bucket: 'bucketName',
                id: 'b9c1ca4e-6b28-477f-b61d-062645ee3e88',
                data: { test: 'data' },
            },
        });

        await storeCredential(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith({
            uri: 'mock-uri',
            hash: 'mock-hash',
            key: 'mock-key',
        });
    });

    it('responds with 400 status when the bucket is invalid', async () => {
        const mockReq = getMockReq({
            body: {
                bucket: 'invalid-bucket',
                id: 'b9c1ca4e-6b28-477f-b61d-062645ee3e88',
                data: { test: 'data' },
            },
        });

        await storeCredential(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: expect.stringContaining('Invalid bucket. Must be one of the following buckets:'),
        });
    });

    it('handles errors by responding with 500 status', async () => {
        jest.spyOn(CredentialsService.prototype, 'encryptAndStoreCredential').mockRejectedValueOnce(
            new Error('Simulated failure'),
        );

        const mockReq = getMockReq({
            body: {
                bucket: 'bucketName',
                id: 'b9c1ca4e-6b28-477f-b61d-062645ee3e88',
                data: { test: 'data' },
            },
        });

        await storeCredential(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: 'An unexpected error occurred while storing the credential.',
        });
    });

    it('responds with 409 status when the object already exists', async () => {
        jest.spyOn(CredentialsService.prototype, 'encryptAndStoreCredential').mockRejectedValueOnce(
            new ConflictError('Object already exists'),
        );

        const mockReq = getMockReq({
            body: {
                bucket: 'bucketName',
                id: 'b9c1ca4e-6b28-477f-b61d-062645ee3e88',
                data: { test: 'data' },
            },
        });

        await storeCredential(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(409);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: 'Object already exists',
        });
    });
});
