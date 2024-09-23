import { ApplicationError, BadRequestError, ConflictError } from '../../errors';
import { CredentialsService } from './service';
import { v4 as uuidv4 } from 'uuid';
import { isValidUUID } from '../../utils';

jest.mock('../../config', () => ({
    AVAILABLE_BUCKETS: ['bucketName'],
}));

jest.mock('uuid', () => ({
    v4: jest.fn().mockReturnValue('mocked-uuid'),
}));

jest.mock('../../utils', () => ({
    isValidUUID: jest.fn().mockReturnValue(true),
}));

describe('CredentialsService', () => {
    let credentialsService: CredentialsService;

    beforeEach(() => {
        credentialsService = new CredentialsService();
    });

    describe('encryptAndStoreCredential', () => {
        it('should encrypt and store credentials', async () => {
            const bucket = 'bucketName';
            const id = 'b9c1ca4e-6b28-477f-b61d-062645ee3e88';
            const data = { test: 'data' };

            const cryptographyService = {
                computeHash: jest.fn().mockReturnValue('hash'),
                generateEncryptionKey: jest.fn().mockReturnValue('key'),
                encryptString: jest.fn().mockReturnValue({ encryptedData: 'encryptedData' }),
            };
            const storageService = {
                uploadFile: jest.fn().mockResolvedValue({ uri: 'fileUri' }),
                objectExists: jest.fn(),
            };

            const result = await credentialsService.encryptAndStoreCredential(cryptographyService, storageService, {
                bucket,
                id,
                data,
            });

            expect(cryptographyService.computeHash).toHaveBeenCalledWith(JSON.stringify(data));
            expect(cryptographyService.generateEncryptionKey).toHaveBeenCalled();
            expect(cryptographyService.encryptString).toHaveBeenCalledWith(JSON.stringify(data), 'key');
            expect(storageService.uploadFile).toHaveBeenCalledWith(
                bucket,
                `${id}.json`,
                JSON.stringify({ encryptedData: 'encryptedData' }),
                'application/json',
            );
            expect(result).toEqual({
                uri: 'fileUri',
                hash: 'hash',
                key: 'key',
            });
        });

        it('should throw a BadRequestError if bucket is not provided', async () => {
            const bucket = '';
            const id = 'b9c1ca4e-6b28-477f-b61d-062645ee3e88';
            const data = { test: 'data' };

            const cryptographyService = {};
            const storageService = {};

            await expect(
                credentialsService.encryptAndStoreCredential(cryptographyService as any, storageService as any, {
                    bucket,
                    id,
                    data,
                }),
            ).rejects.toThrow(BadRequestError);
        });

        it('should throw a BadRequestError if the bucket is not in AVAILABLE_BUCKETS', async () => {
            const cryptographyService = {};
            const storageService = {};

            const invalidBucket = 'invalidBucketName';
            const id = 'b9c1ca4e-6b28-477f-b61d-062645ee3e88';
            const data = { test: 'data' };

            await expect(
                credentialsService.encryptAndStoreCredential(cryptographyService as any, storageService as any, {
                    bucket: invalidBucket,
                    id,
                    data,
                }),
            ).rejects.toThrow(BadRequestError);
        });

        it('should accept plain objects as data', async () => {
            const cryptographyService = {
                computeHash: jest.fn().mockReturnValue('hash'),
                generateEncryptionKey: jest.fn().mockReturnValue('key'),
                encryptString: jest.fn().mockReturnValue({ encryptedData: 'encryptedData' }),
            };
            const storageService = {
                uploadFile: jest.fn().mockResolvedValue({ uri: 'fileUri' }),
                objectExists: jest.fn().mockResolvedValue(false),
            };

            const bucket = 'bucketName';
            const id = 'b9c1ca4e-6b28-477f-b61d-062645ee3e88';
            const plainObjectData = { test: 'data' };

            const result = await credentialsService.encryptAndStoreCredential(
                cryptographyService as any,
                storageService as any,
                {
                    bucket,
                    id,
                    data: plainObjectData,
                },
            );

            expect(result).toEqual({
                uri: 'fileUri',
                hash: 'hash',
                key: 'key',
            });
        });

        it('should throw a BadRequestError if data is not a plain object', async () => {
            const cryptographyService = {};
            const storageService = {};

            const bucket = 'bucketName';
            const id = 'b9c1ca4e-6b28-477f-b61d-062645ee3e88';
            const data = ['test'];

            await expect(
                credentialsService.encryptAndStoreCredential(cryptographyService as any, storageService as any, {
                    bucket,
                    id,
                    data: data as any,
                }),
            ).rejects.toThrow(BadRequestError);
        });

        it('should generate a new UUID if id is not provided', async () => {
            const bucket = 'bucketName';
            const data = { test: 'data' };

            const cryptographyService = {
                computeHash: jest.fn().mockReturnValue('hash'),
                generateEncryptionKey: jest.fn().mockReturnValue('key'),
                encryptString: jest.fn().mockReturnValue({ encryptedData: 'encryptedData' }),
            };
            const storageService = {
                uploadFile: jest.fn().mockResolvedValue({ uri: 'fileUri' }),
                objectExists: jest.fn().mockResolvedValue(false),
            };

            const result = await credentialsService.encryptAndStoreCredential(
                cryptographyService as any,
                storageService as any,
                {
                    bucket,
                    data,
                },
            );

            expect(uuidv4).toHaveBeenCalled();
            expect(storageService.uploadFile).toHaveBeenCalledWith(
                bucket,
                'mocked-uuid.json',
                expect.any(String),
                'application/json',
            );
            expect(result).toEqual({
                uri: 'fileUri',
                hash: 'hash',
                key: 'key',
            });
        });

        it('should use the provided id if it is a valid UUID', async () => {
            const bucket = 'bucketName';
            const id = 'b9c1ca4e-6b28-477f-b61d-062645ee3e88';
            const data = { test: 'data' };

            const cryptographyService = {
                computeHash: jest.fn().mockReturnValue('hash'),
                generateEncryptionKey: jest.fn().mockReturnValue('key'),
                encryptString: jest.fn().mockReturnValue({ encryptedData: 'encryptedData' }),
            };
            const storageService = {
                uploadFile: jest.fn().mockResolvedValue({ uri: 'fileUri' }),
                objectExists: jest.fn().mockResolvedValue(false),
            };

            const result = await credentialsService.encryptAndStoreCredential(
                cryptographyService as any,
                storageService as any,
                {
                    bucket,
                    id,
                    data,
                },
            );

            expect(isValidUUID).toHaveBeenCalledWith(id);
            expect(storageService.uploadFile).toHaveBeenCalledWith(
                bucket,
                `${id}.json`,
                expect.any(String),
                'application/json',
            );
            expect(result).toEqual({
                uri: 'fileUri',
                hash: 'hash',
                key: 'key',
            });
        });

        it('should throw a BadRequestError if the provided id is not a valid UUID', async () => {
            const bucket = 'bucketName';
            const id = 'not-a-uuid';
            const data = { test: 'data' };

            const cryptographyService = {};
            const storageService = {};

            (isValidUUID as jest.Mock).mockReturnValueOnce(false);

            await expect(
                credentialsService.encryptAndStoreCredential(cryptographyService as any, storageService as any, {
                    bucket,
                    id,
                    data,
                }),
            ).rejects.toThrow(BadRequestError);

            expect(isValidUUID).toHaveBeenCalledWith(id);
        });

        it('should throw a ConflictError if the object already exists', async () => {
            const bucket = 'bucketName';
            const id = 'b9c1ca4e-6b28-477f-b61d-062645ee3e88';
            const data = { test: 'data' };

            const cryptographyService = {};
            const storageService = {
                objectExists: jest.fn().mockResolvedValue(true),
            };

            await expect(
                credentialsService.encryptAndStoreCredential(cryptographyService as any, storageService as any, {
                    bucket,
                    id,
                    data,
                }),
            ).rejects.toThrow(ConflictError);
        });

        it('should throw an ApplicationError for unexpected errors', async () => {
            const bucket = 'bucketName';
            const id = 'b9c1ca4e-6b28-477f-b61d-062645ee3e88';
            const data = { test: 'data' };

            const cryptographyService = {
                computeHash: jest.fn().mockImplementation(() => {
                    throw new Error('Unexpected error');
                }),
                generateEncryptionKey: jest.fn(),
                encryptString: jest.fn(),
            };
            const storageService = {
                objectExists: jest.fn().mockResolvedValue(false),
                uploadFile: jest.fn(),
            };

            await expect(
                credentialsService.encryptAndStoreCredential(cryptographyService as any, storageService as any, {
                    bucket,
                    id,
                    data,
                }),
            ).rejects.toThrow(ApplicationError);

            expect(console.error).toHaveBeenCalledWith(
                '[CredentialsService.encryptAndStoreCredential] An error occurred while encrypting and storing the credential.',
                expect.any(Error),
            );
        });
    });
});
