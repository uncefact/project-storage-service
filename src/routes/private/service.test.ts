import { PrivateService } from './service';
import { BadRequestError, ConflictError, ApplicationError } from '../../errors';

jest.mock('../../config', () => ({
    AVAILABLE_BUCKETS: ['bucketName'],
    ALLOWED_UPLOAD_TYPES: ['image/png', 'image/jpeg', 'application/pdf'],
}));

const storageService = {
    uploadFile: jest.fn().mockResolvedValue({ uri: 'mock-uri' }),
    objectExists: jest.fn().mockResolvedValue(false),
};

const cryptographyService = {
    computeHash: jest.fn().mockReturnValue('mocked-hash'),
    generateEncryptionKey: jest.fn().mockResolvedValue('test-encryption-key'),
    encryptString: jest.fn().mockReturnValue({
        cipherText: 'encrypted',
        iv: 'test-iv',
        tag: 'test-tag',
        type: 'aes-256-gcm',
    }),
};

describe('PrivateService', () => {
    let service: PrivateService;

    beforeEach(() => {
        service = new PrivateService();
        jest.clearAllMocks();
        storageService.uploadFile.mockResolvedValue({ uri: 'mock-uri' });
        storageService.objectExists.mockResolvedValue(false);
        cryptographyService.computeHash.mockReturnValue('mocked-hash');
        cryptographyService.generateEncryptionKey.mockResolvedValue('test-encryption-key');
        cryptographyService.encryptString.mockReturnValue({
            cipherText: 'encrypted',
            iv: 'test-iv',
            tag: 'test-tag',
            type: 'aes-256-gcm',
        });
    });

    describe('encryptAndStoreDocument', () => {
        it('should successfully encrypt and store a JSON document', async () => {
            const params = {
                bucket: 'bucketName',
                id: '550e8400-e29b-41d4-a716-446655440000',
                data: { key: 'value' },
            };

            const result = await service.encryptAndStoreDocument(
                storageService as any,
                cryptographyService as any,
                params,
            );

            expect(cryptographyService.encryptString).toHaveBeenCalledWith(
                JSON.stringify(params.data),
                'test-encryption-key',
            );

            const uploadCallArgs = storageService.uploadFile.mock.calls[0];
            const storedContent = JSON.parse(uploadCallArgs[2]);
            expect(storedContent).toEqual(
                expect.objectContaining({
                    cipherText: 'encrypted',
                    iv: 'test-iv',
                    tag: 'test-tag',
                    type: 'aes-256-gcm',
                    contentType: 'application/json',
                }),
            );

            expect(result).toEqual({
                uri: 'mock-uri',
                hash: 'mocked-hash',
                decryptionKey: 'test-encryption-key',
            });
        });

        it('should throw BadRequestError when bucket is missing', async () => {
            const params = {
                data: { key: 'value' },
            } as any;

            await expect(
                service.encryptAndStoreDocument(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(BadRequestError);
        });

        it('should throw BadRequestError when bucket is invalid', async () => {
            const params = {
                bucket: 'invalidBucket',
                data: { key: 'value' },
            };

            await expect(
                service.encryptAndStoreDocument(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(BadRequestError);
            await expect(
                service.encryptAndStoreDocument(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(/Invalid bucket/);
        });

        it('should generate a UUID when id is not provided', async () => {
            const params = {
                bucket: 'bucketName',
                data: { key: 'value' },
            };

            const result = await service.encryptAndStoreDocument(
                storageService as any,
                cryptographyService as any,
                params,
            );

            expect(result).toEqual(
                expect.objectContaining({
                    uri: 'mock-uri',
                    hash: 'mocked-hash',
                    decryptionKey: 'test-encryption-key',
                }),
            );

            // Verify that uploadFile was called with a .json object name
            const uploadCallArgs = storageService.uploadFile.mock.calls[0];
            expect(uploadCallArgs[1]).toMatch(/^[0-9a-f-]+\.json$/);
        });

        it('should throw BadRequestError for an invalid UUID', async () => {
            const params = {
                bucket: 'bucketName',
                id: 'not-a-valid-uuid',
                data: { key: 'value' },
            };

            await expect(
                service.encryptAndStoreDocument(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(BadRequestError);
            await expect(
                service.encryptAndStoreDocument(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(/Invalid id/);
        });

        it('should throw BadRequestError when data is not a plain object', async () => {
            const params = {
                bucket: 'bucketName',
                id: '550e8400-e29b-41d4-a716-446655440000',
                data: 'not-an-object' as any,
            };

            await expect(
                service.encryptAndStoreDocument(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(BadRequestError);
            await expect(
                service.encryptAndStoreDocument(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(/Data must be a JSON object/);
        });

        it('should throw ConflictError when a document with the same ID already exists', async () => {
            storageService.objectExists.mockResolvedValueOnce(true);

            const params = {
                bucket: 'bucketName',
                id: '550e8400-e29b-41d4-a716-446655440000',
                data: { key: 'value' },
            };

            await expect(
                service.encryptAndStoreDocument(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(ConflictError);
        });

        it('should include contentType application/json in the stored envelope', async () => {
            const params = {
                bucket: 'bucketName',
                id: '550e8400-e29b-41d4-a716-446655440000',
                data: { key: 'value' },
            };

            await service.encryptAndStoreDocument(storageService as any, cryptographyService as any, params);

            const uploadCallArgs = storageService.uploadFile.mock.calls[0];
            const storedContent = uploadCallArgs[2];
            expect(storedContent).toContain('"contentType":"application/json"');
        });

        it('should throw BadRequestError when data is null', async () => {
            const params = { bucket: 'bucketName', data: null as any };

            await expect(
                service.encryptAndStoreDocument(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(BadRequestError);
            await expect(
                service.encryptAndStoreDocument(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(/Data must be a JSON object/);
        });

        it('should throw BadRequestError when data is an array', async () => {
            const params = { bucket: 'bucketName', data: [1, 2, 3] as any };

            await expect(
                service.encryptAndStoreDocument(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(BadRequestError);
        });

        it('should successfully encrypt and store an empty object', async () => {
            const params = {
                bucket: 'bucketName',
                id: '550e8400-e29b-41d4-a716-446655440000',
                data: {},
            };

            const result = await service.encryptAndStoreDocument(
                storageService as any,
                cryptographyService as any,
                params,
            );

            expect(cryptographyService.encryptString).toHaveBeenCalledWith(JSON.stringify({}), 'test-encryption-key');
            expect(result).toEqual(
                expect.objectContaining({
                    uri: expect.any(String),
                    hash: expect.any(String),
                    decryptionKey: expect.any(String),
                }),
            );
        });

        it('should throw BadRequestError when bucket is an empty string', async () => {
            const params = { bucket: '', data: { key: 'value' } };

            await expect(
                service.encryptAndStoreDocument(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(BadRequestError);
            await expect(
                service.encryptAndStoreDocument(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(/Bucket is required/);
        });

        it('should generate a UUID when id is an empty string', async () => {
            const params = { bucket: 'bucketName', id: '', data: { key: 'value' } };

            const result = await service.encryptAndStoreDocument(
                storageService as any,
                cryptographyService as any,
                params,
            );

            expect(result).toHaveProperty('uri');
            expect(storageService.uploadFile).toHaveBeenCalled();
            // Verify that the generated UUID was used (not the empty string)
            const uploadCallArgs = storageService.uploadFile.mock.calls[0];
            expect(uploadCallArgs[1]).toMatch(/^[0-9a-f-]+\.json$/);
        });

        it('should propagate error when objectExists throws', async () => {
            storageService.objectExists.mockRejectedValueOnce(new Error('Storage connection failed'));

            const params = {
                bucket: 'bucketName',
                id: '550e8400-e29b-41d4-a716-446655440000',
                data: { key: 'value' },
            };

            await expect(
                service.encryptAndStoreDocument(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(ApplicationError);
        });

        it('should propagate error when uploadFile throws', async () => {
            storageService.uploadFile.mockRejectedValueOnce(new Error('Upload failed'));

            const params = {
                bucket: 'bucketName',
                id: '550e8400-e29b-41d4-a716-446655440000',
                data: { key: 'value' },
            };

            await expect(
                service.encryptAndStoreDocument(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(ApplicationError);
        });

        it('should propagate error when computeHash throws', async () => {
            cryptographyService.computeHash.mockImplementationOnce(() => {
                throw new Error('Hash computation failed');
            });

            const params = {
                bucket: 'bucketName',
                id: '550e8400-e29b-41d4-a716-446655440000',
                data: { key: 'value' },
            };

            await expect(
                service.encryptAndStoreDocument(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(ApplicationError);
        });

        it('should propagate error when encryptString throws', async () => {
            cryptographyService.encryptString.mockImplementationOnce(() => {
                throw new Error('Encryption failed');
            });

            const params = {
                bucket: 'bucketName',
                id: '550e8400-e29b-41d4-a716-446655440000',
                data: { key: 'value' },
            };

            await expect(
                service.encryptAndStoreDocument(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(ApplicationError);
        });

        it('should propagate error when generateEncryptionKey throws', async () => {
            cryptographyService.generateEncryptionKey.mockRejectedValueOnce(new Error('Key generation failed'));

            const params = {
                bucket: 'bucketName',
                id: '550e8400-e29b-41d4-a716-446655440000',
                data: { key: 'value' },
            };

            await expect(
                service.encryptAndStoreDocument(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(ApplicationError);
        });
    });

    describe('encryptAndStoreFile', () => {
        const fileBuffer = Buffer.from('binary-file-content');

        it('should successfully encrypt and store a binary file', async () => {
            const params = {
                bucket: 'bucketName',
                id: '550e8400-e29b-41d4-a716-446655440000',
                file: fileBuffer,
                mimeType: 'image/png',
            };

            const result = await service.encryptAndStoreFile(storageService as any, cryptographyService as any, params);

            // Verify encrypt is called with base64-encoded file content
            expect(cryptographyService.encryptString).toHaveBeenCalledWith(
                fileBuffer.toString('base64'),
                'test-encryption-key',
            );

            // Verify the envelope includes the original MIME type
            const uploadCallArgs = storageService.uploadFile.mock.calls[0];
            const storedContent = JSON.parse(uploadCallArgs[2]);
            expect(storedContent).toEqual(
                expect.objectContaining({
                    cipherText: 'encrypted',
                    iv: 'test-iv',
                    tag: 'test-tag',
                    type: 'aes-256-gcm',
                    contentType: 'image/png',
                }),
            );

            expect(result).toEqual({
                uri: 'mock-uri',
                hash: 'mocked-hash',
                decryptionKey: 'test-encryption-key',
            });
        });

        it('should throw BadRequestError when bucket is missing', async () => {
            const params = {
                file: fileBuffer,
                mimeType: 'image/png',
            } as any;

            await expect(
                service.encryptAndStoreFile(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(BadRequestError);
        });

        it('should throw BadRequestError when bucket is invalid', async () => {
            const params = {
                bucket: 'invalidBucket',
                file: fileBuffer,
                mimeType: 'image/png',
            };

            await expect(
                service.encryptAndStoreFile(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(BadRequestError);
            await expect(
                service.encryptAndStoreFile(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(/Invalid bucket/);
        });

        it('should throw BadRequestError when file is missing', async () => {
            const params = {
                bucket: 'bucketName',
                mimeType: 'image/png',
            } as any;

            await expect(
                service.encryptAndStoreFile(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(BadRequestError);
            await expect(
                service.encryptAndStoreFile(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(/File is required/);
        });

        it('should throw BadRequestError when MIME type is not allowed', async () => {
            const params = {
                bucket: 'bucketName',
                file: fileBuffer,
                mimeType: 'application/zip',
            };

            await expect(
                service.encryptAndStoreFile(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(BadRequestError);
            await expect(
                service.encryptAndStoreFile(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(/Invalid MIME type/);
        });

        it('should generate a UUID when id is not provided', async () => {
            const params = {
                bucket: 'bucketName',
                file: fileBuffer,
                mimeType: 'image/png',
            };

            const result = await service.encryptAndStoreFile(storageService as any, cryptographyService as any, params);

            expect(result).toEqual(
                expect.objectContaining({
                    uri: 'mock-uri',
                    hash: 'mocked-hash',
                    decryptionKey: 'test-encryption-key',
                }),
            );

            // Verify that uploadFile was called with a .json object name
            const uploadCallArgs = storageService.uploadFile.mock.calls[0];
            expect(uploadCallArgs[1]).toMatch(/^[0-9a-f-]+\.json$/);
        });

        it('should throw BadRequestError for an invalid UUID', async () => {
            const params = {
                bucket: 'bucketName',
                id: 'not-a-valid-uuid',
                file: fileBuffer,
                mimeType: 'image/png',
            };

            await expect(
                service.encryptAndStoreFile(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(BadRequestError);
            await expect(
                service.encryptAndStoreFile(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(/Invalid id/);
        });

        it('should throw ConflictError when a file with the same ID already exists', async () => {
            storageService.objectExists.mockResolvedValueOnce(true);

            const params = {
                bucket: 'bucketName',
                id: '550e8400-e29b-41d4-a716-446655440000',
                file: fileBuffer,
                mimeType: 'image/png',
            };

            await expect(
                service.encryptAndStoreFile(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(ConflictError);
        });

        it('should compute the hash from the original buffer before base64 encoding', async () => {
            const params = {
                bucket: 'bucketName',
                id: '550e8400-e29b-41d4-a716-446655440000',
                file: fileBuffer,
                mimeType: 'image/png',
            };

            await service.encryptAndStoreFile(storageService as any, cryptographyService as any, params);

            // computeHash should be called with the raw buffer, not the base64 string
            expect(cryptographyService.computeHash).toHaveBeenCalledWith(fileBuffer);
        });

        it('should always use .json extension for the object name', async () => {
            const params = {
                bucket: 'bucketName',
                id: '550e8400-e29b-41d4-a716-446655440000',
                file: fileBuffer,
                mimeType: 'image/png',
            };

            await service.encryptAndStoreFile(storageService as any, cryptographyService as any, params);

            const uploadCallArgs = storageService.uploadFile.mock.calls[0];
            const objectName = uploadCallArgs[1];
            expect(objectName).toBe('550e8400-e29b-41d4-a716-446655440000.json');
        });

        it('should include the original MIME type as contentType in the stored envelope', async () => {
            const params = {
                bucket: 'bucketName',
                id: '550e8400-e29b-41d4-a716-446655440000',
                file: fileBuffer,
                mimeType: 'application/pdf',
            };

            await service.encryptAndStoreFile(storageService as any, cryptographyService as any, params);

            const uploadCallArgs = storageService.uploadFile.mock.calls[0];
            const storedContent = uploadCallArgs[2];
            expect(storedContent).toContain('"contentType":"application/pdf"');
        });

        it('should throw BadRequestError when bucket is an empty string', async () => {
            const params = { bucket: '', file: fileBuffer, mimeType: 'image/png' } as any;

            await expect(
                service.encryptAndStoreFile(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(BadRequestError);
            await expect(
                service.encryptAndStoreFile(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(/Bucket is required/);
        });

        it('should generate a UUID when id is an empty string', async () => {
            const params = {
                bucket: 'bucketName',
                id: '',
                file: fileBuffer,
                mimeType: 'image/png',
            };

            const result = await service.encryptAndStoreFile(storageService as any, cryptographyService as any, params);

            expect(result).toHaveProperty('uri');
            const uploadCallArgs = storageService.uploadFile.mock.calls[0];
            expect(uploadCallArgs[1]).toMatch(/^[0-9a-f-]+\.json$/);
        });

        it('should successfully encrypt and store a zero-byte file', async () => {
            const params = {
                bucket: 'bucketName',
                id: '550e8400-e29b-41d4-a716-446655440000',
                file: Buffer.alloc(0),
                mimeType: 'image/png',
            };

            const result = await service.encryptAndStoreFile(storageService as any, cryptographyService as any, params);

            expect(cryptographyService.encryptString).toHaveBeenCalledWith(
                Buffer.alloc(0).toString('base64'),
                'test-encryption-key',
            );
            expect(result).toEqual(
                expect.objectContaining({
                    uri: expect.any(String),
                    hash: expect.any(String),
                    decryptionKey: expect.any(String),
                }),
            );
        });

        it('should propagate error when objectExists throws', async () => {
            storageService.objectExists.mockRejectedValueOnce(new Error('Storage connection failed'));

            const params = {
                bucket: 'bucketName',
                id: '550e8400-e29b-41d4-a716-446655440000',
                file: fileBuffer,
                mimeType: 'image/png',
            };

            await expect(
                service.encryptAndStoreFile(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(ApplicationError);
        });

        it('should propagate error when uploadFile throws', async () => {
            storageService.uploadFile.mockRejectedValueOnce(new Error('Upload failed'));

            const params = {
                bucket: 'bucketName',
                id: '550e8400-e29b-41d4-a716-446655440000',
                file: fileBuffer,
                mimeType: 'image/png',
            };

            await expect(
                service.encryptAndStoreFile(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(ApplicationError);
        });

        it('should propagate error when computeHash throws', async () => {
            cryptographyService.computeHash.mockImplementationOnce(() => {
                throw new Error('Hash computation failed');
            });

            const params = {
                bucket: 'bucketName',
                id: '550e8400-e29b-41d4-a716-446655440000',
                file: fileBuffer,
                mimeType: 'image/png',
            };

            await expect(
                service.encryptAndStoreFile(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(ApplicationError);
        });

        it('should propagate error when encryptString throws', async () => {
            cryptographyService.encryptString.mockImplementationOnce(() => {
                throw new Error('Encryption failed');
            });

            const params = {
                bucket: 'bucketName',
                id: '550e8400-e29b-41d4-a716-446655440000',
                file: fileBuffer,
                mimeType: 'image/png',
            };

            await expect(
                service.encryptAndStoreFile(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(ApplicationError);
        });

        it('should propagate error when generateEncryptionKey throws', async () => {
            cryptographyService.generateEncryptionKey.mockRejectedValueOnce(new Error('Key generation failed'));

            const params = {
                bucket: 'bucketName',
                id: '550e8400-e29b-41d4-a716-446655440000',
                file: fileBuffer,
                mimeType: 'image/png',
            };

            await expect(
                service.encryptAndStoreFile(storageService as any, cryptographyService as any, params),
            ).rejects.toThrow(ApplicationError);
        });
    });
});
