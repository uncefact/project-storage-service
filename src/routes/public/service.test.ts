import { IStorageService, ICryptographyService } from '../../services';
import { PublicService } from './service';
import { v4 } from 'uuid';
import { BadRequestError, ConflictError, ApplicationError } from '../../errors';

jest.mock('../../config', () => ({
    AVAILABLE_BUCKETS: ['my-bucket'],
    ALLOWED_UPLOAD_TYPES: ['image/png', 'image/jpeg', 'application/pdf'],
    DEFAULT_BUCKET: undefined,
}));

jest.mock('uuid', () => ({
    v4: jest.fn(),
}));

describe('PublicService', () => {
    let service: PublicService;
    let mockStorageService: jest.Mocked<IStorageService>;
    let mockCryptoService: jest.Mocked<ICryptographyService>;

    beforeEach(() => {
        jest.clearAllMocks();

        service = new PublicService();

        mockStorageService = {
            uploadFile: jest.fn().mockResolvedValue({ uri: 'https://storage.example.com/my-bucket/test-id.json' }),
            objectExists: jest.fn().mockResolvedValue(false),
            listObjectsByPrefix: jest.fn().mockResolvedValue([]),
            deleteFile: jest.fn().mockResolvedValue(undefined),
        };

        mockCryptoService = {
            computeHash: jest.fn().mockReturnValue('mocked-hash'),
        } as unknown as jest.Mocked<ICryptographyService>;
    });

    describe('storeDocument', () => {
        const validParams = {
            bucket: 'my-bucket',
            id: '123e4567-e89b-12d3-a456-426614174000',
            data: { name: 'test' },
        };

        it('should successfully store a document and return uri and hash', async () => {
            const result = await service.storeDocument(mockStorageService, mockCryptoService, validParams);

            expect(mockStorageService.objectExists).toHaveBeenCalledWith(
                'my-bucket',
                '123e4567-e89b-12d3-a456-426614174000.json',
            );
            expect(mockCryptoService.computeHash).toHaveBeenCalledWith(JSON.stringify(validParams.data));
            expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
                'my-bucket',
                '123e4567-e89b-12d3-a456-426614174000.json',
                JSON.stringify(validParams.data),
                'application/json',
            );
            expect(result).toEqual({
                uri: 'https://storage.example.com/my-bucket/test-id.json',
                hash: 'mocked-hash',
            });
        });

        it('should throw BadRequestError when bucket is missing', async () => {
            await expect(
                service.storeDocument(mockStorageService, mockCryptoService, {
                    ...validParams,
                    bucket: undefined,
                } as any),
            ).rejects.toThrow(BadRequestError);

            await expect(
                service.storeDocument(mockStorageService, mockCryptoService, {
                    ...validParams,
                    bucket: undefined,
                } as any),
            ).rejects.toThrow(
                'Bucket is required. Please provide a bucket name, or set the DEFAULT_BUCKET environment variable.',
            );
        });

        it('should throw BadRequestError when bucket is invalid', async () => {
            await expect(
                service.storeDocument(mockStorageService, mockCryptoService, {
                    ...validParams,
                    bucket: 'invalid-bucket',
                }),
            ).rejects.toThrow(BadRequestError);

            await expect(
                service.storeDocument(mockStorageService, mockCryptoService, {
                    ...validParams,
                    bucket: 'invalid-bucket',
                }),
            ).rejects.toThrow('Invalid bucket');
        });

        it('should generate a UUID when id is not provided', async () => {
            const generatedUUID = '550e8400-e29b-41d4-a716-446655440000';
            (v4 as jest.Mock).mockReturnValue(generatedUUID);

            await service.storeDocument(mockStorageService, mockCryptoService, {
                ...validParams,
                id: undefined,
            });

            expect(v4).toHaveBeenCalledTimes(1);
            expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
                'my-bucket',
                `${generatedUUID}.json`,
                JSON.stringify(validParams.data),
                'application/json',
            );
        });

        it('should throw BadRequestError for invalid UUID', async () => {
            await expect(
                service.storeDocument(mockStorageService, mockCryptoService, {
                    ...validParams,
                    id: 'not-a-valid-uuid',
                }),
            ).rejects.toThrow(BadRequestError);

            await expect(
                service.storeDocument(mockStorageService, mockCryptoService, {
                    ...validParams,
                    id: 'not-a-valid-uuid',
                }),
            ).rejects.toThrow('Invalid id');
        });

        it('should throw BadRequestError when data is not a plain object', async () => {
            await expect(
                service.storeDocument(mockStorageService, mockCryptoService, {
                    ...validParams,
                    data: 'not-an-object' as any,
                }),
            ).rejects.toThrow(BadRequestError);

            await expect(
                service.storeDocument(mockStorageService, mockCryptoService, {
                    ...validParams,
                    data: 'not-an-object' as any,
                }),
            ).rejects.toThrow('Data must be a JSON object');
        });

        it('should throw ConflictError when document already exists', async () => {
            mockStorageService.objectExists.mockResolvedValue(true);

            await expect(service.storeDocument(mockStorageService, mockCryptoService, validParams)).rejects.toThrow(
                ConflictError,
            );

            await expect(service.storeDocument(mockStorageService, mockCryptoService, validParams)).rejects.toThrow(
                'already exists',
            );
        });

        it('should throw BadRequestError when data is null', async () => {
            await expect(
                service.storeDocument(mockStorageService, mockCryptoService, {
                    ...validParams,
                    data: null as any,
                }),
            ).rejects.toThrow(BadRequestError);
            await expect(
                service.storeDocument(mockStorageService, mockCryptoService, {
                    ...validParams,
                    data: null as any,
                }),
            ).rejects.toThrow('Data must be a JSON object');
        });

        it('should throw BadRequestError when data is an array', async () => {
            await expect(
                service.storeDocument(mockStorageService, mockCryptoService, {
                    ...validParams,
                    data: [1, 2, 3] as any,
                }),
            ).rejects.toThrow(BadRequestError);
        });

        it('should successfully store a document when data is an empty object', async () => {
            const result = await service.storeDocument(mockStorageService, mockCryptoService, {
                ...validParams,
                data: {},
            });

            expect(result).toEqual({
                uri: expect.any(String),
                hash: expect.any(String),
            });
        });

        it('should throw BadRequestError when bucket is an empty string', async () => {
            await expect(
                service.storeDocument(mockStorageService, mockCryptoService, {
                    ...validParams,
                    bucket: '',
                }),
            ).rejects.toThrow(BadRequestError);
            await expect(
                service.storeDocument(mockStorageService, mockCryptoService, {
                    ...validParams,
                    bucket: '',
                }),
            ).rejects.toThrow(
                'Bucket is required. Please provide a bucket name, or set the DEFAULT_BUCKET environment variable.',
            );
        });

        it('should use DEFAULT_BUCKET when bucket is not provided', async () => {
            const configModule = require('../../config');
            configModule.DEFAULT_BUCKET = 'my-bucket';

            try {
                const result = await service.storeDocument(mockStorageService, mockCryptoService, {
                    ...validParams,
                    bucket: undefined,
                } as any);

                expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
                    'my-bucket',
                    expect.any(String),
                    expect.any(String),
                    'application/json',
                );
                expect(result).toEqual({ uri: expect.any(String), hash: expect.any(String) });
            } finally {
                configModule.DEFAULT_BUCKET = undefined;
            }
        });

        it('should use DEFAULT_BUCKET when bucket is an empty string', async () => {
            const configModule = require('../../config');
            configModule.DEFAULT_BUCKET = 'my-bucket';

            try {
                const result = await service.storeDocument(mockStorageService, mockCryptoService, {
                    ...validParams,
                    bucket: '',
                });

                expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
                    'my-bucket',
                    expect.any(String),
                    expect.any(String),
                    'application/json',
                );
                expect(result).toEqual({ uri: expect.any(String), hash: expect.any(String) });
            } finally {
                configModule.DEFAULT_BUCKET = undefined;
            }
        });

        it('should prefer explicit bucket over DEFAULT_BUCKET', async () => {
            const configModule = require('../../config');
            configModule.DEFAULT_BUCKET = 'other-bucket';

            try {
                const result = await service.storeDocument(mockStorageService, mockCryptoService, {
                    ...validParams,
                    bucket: 'my-bucket',
                });

                expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
                    'my-bucket',
                    expect.any(String),
                    expect.any(String),
                    'application/json',
                );
                expect(result).toEqual({ uri: expect.any(String), hash: expect.any(String) });
            } finally {
                configModule.DEFAULT_BUCKET = undefined;
            }
        });

        it('should generate a UUID when id is an empty string', async () => {
            const result = await service.storeDocument(mockStorageService, mockCryptoService, {
                ...validParams,
                id: '',
            });

            expect(result).toHaveProperty('uri');
            // Verify that uploadFile was called (proving the empty string was treated as falsy)
            expect(mockStorageService.uploadFile).toHaveBeenCalled();
        });

        it('should propagate error when objectExists throws', async () => {
            mockStorageService.objectExists.mockRejectedValue(new Error('Storage connection failed'));

            await expect(service.storeDocument(mockStorageService, mockCryptoService, validParams)).rejects.toThrow(
                ApplicationError,
            );
            await expect(service.storeDocument(mockStorageService, mockCryptoService, validParams)).rejects.toThrow(
                'An unexpected error occurred while storing the document.',
            );
        });

        it('should propagate error when uploadFile throws', async () => {
            mockStorageService.uploadFile.mockRejectedValue(new Error('Upload failed'));

            await expect(service.storeDocument(mockStorageService, mockCryptoService, validParams)).rejects.toThrow(
                ApplicationError,
            );
            await expect(service.storeDocument(mockStorageService, mockCryptoService, validParams)).rejects.toThrow(
                'An unexpected error occurred while storing the document.',
            );
        });

        it('should propagate error when computeHash throws', async () => {
            mockCryptoService.computeHash.mockImplementation(() => {
                throw new Error('Hash computation failed');
            });

            await expect(service.storeDocument(mockStorageService, mockCryptoService, validParams)).rejects.toThrow(
                ApplicationError,
            );
            await expect(service.storeDocument(mockStorageService, mockCryptoService, validParams)).rejects.toThrow(
                'An unexpected error occurred while storing the document.',
            );
        });
    });

    describe('storeFile', () => {
        const fileBuffer = Buffer.from('fake-file-content');

        const validParams = {
            bucket: 'my-bucket',
            id: '123e4567-e89b-12d3-a456-426614174000',
            file: fileBuffer,
            mimeType: 'image/png',
        };

        it('should successfully store a file and return uri and hash', async () => {
            const result = await service.storeFile(mockStorageService, mockCryptoService, validParams);

            expect(mockStorageService.objectExists).toHaveBeenCalledWith(
                'my-bucket',
                '123e4567-e89b-12d3-a456-426614174000.png',
            );
            expect(mockCryptoService.computeHash).toHaveBeenCalledWith(fileBuffer);
            expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
                'my-bucket',
                '123e4567-e89b-12d3-a456-426614174000.png',
                fileBuffer,
                'image/png',
            );
            expect(result).toEqual({
                uri: 'https://storage.example.com/my-bucket/test-id.json',
                hash: 'mocked-hash',
            });
        });

        it('should throw BadRequestError when bucket is missing', async () => {
            await expect(
                service.storeFile(mockStorageService, mockCryptoService, {
                    ...validParams,
                    bucket: undefined,
                }),
            ).rejects.toThrow(BadRequestError);

            await expect(
                service.storeFile(mockStorageService, mockCryptoService, {
                    ...validParams,
                    bucket: undefined,
                }),
            ).rejects.toThrow(
                'Bucket is required. Please provide a bucket name, or set the DEFAULT_BUCKET environment variable.',
            );
        });

        it('should throw BadRequestError when bucket is invalid', async () => {
            await expect(
                service.storeFile(mockStorageService, mockCryptoService, {
                    ...validParams,
                    bucket: 'invalid-bucket',
                }),
            ).rejects.toThrow(BadRequestError);

            await expect(
                service.storeFile(mockStorageService, mockCryptoService, {
                    ...validParams,
                    bucket: 'invalid-bucket',
                }),
            ).rejects.toThrow('Invalid bucket');
        });

        it('should throw BadRequestError when file is missing', async () => {
            await expect(
                service.storeFile(mockStorageService, mockCryptoService, {
                    ...validParams,
                    file: undefined as any,
                }),
            ).rejects.toThrow(BadRequestError);

            await expect(
                service.storeFile(mockStorageService, mockCryptoService, {
                    ...validParams,
                    file: undefined as any,
                }),
            ).rejects.toThrow('File is required');
        });

        it('should throw BadRequestError when MIME type is not allowed', async () => {
            await expect(
                service.storeFile(mockStorageService, mockCryptoService, {
                    ...validParams,
                    mimeType: 'application/zip',
                }),
            ).rejects.toThrow(BadRequestError);

            await expect(
                service.storeFile(mockStorageService, mockCryptoService, {
                    ...validParams,
                    mimeType: 'application/zip',
                }),
            ).rejects.toThrow('Invalid MIME type');
        });

        it('should generate a UUID when id is not provided', async () => {
            const generatedUUID = '550e8400-e29b-41d4-a716-446655440000';
            (v4 as jest.Mock).mockReturnValue(generatedUUID);

            await service.storeFile(mockStorageService, mockCryptoService, {
                ...validParams,
                id: undefined,
            });

            expect(v4).toHaveBeenCalledTimes(1);
            expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
                'my-bucket',
                `${generatedUUID}.png`,
                fileBuffer,
                'image/png',
            );
        });

        it('should throw BadRequestError for invalid UUID', async () => {
            await expect(
                service.storeFile(mockStorageService, mockCryptoService, {
                    ...validParams,
                    id: 'not-a-valid-uuid',
                }),
            ).rejects.toThrow(BadRequestError);

            await expect(
                service.storeFile(mockStorageService, mockCryptoService, {
                    ...validParams,
                    id: 'not-a-valid-uuid',
                }),
            ).rejects.toThrow('Invalid id');
        });

        it('should throw ConflictError when file already exists', async () => {
            mockStorageService.objectExists.mockResolvedValue(true);

            await expect(service.storeFile(mockStorageService, mockCryptoService, validParams)).rejects.toThrow(
                ConflictError,
            );

            await expect(service.storeFile(mockStorageService, mockCryptoService, validParams)).rejects.toThrow(
                'already exists',
            );
        });

        it('should correctly infer file extension from MIME type', async () => {
            // image/png -> png
            await service.storeFile(mockStorageService, mockCryptoService, {
                ...validParams,
                mimeType: 'image/png',
            });
            expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
                'my-bucket',
                '123e4567-e89b-12d3-a456-426614174000.png',
                fileBuffer,
                'image/png',
            );

            jest.clearAllMocks();
            mockStorageService.objectExists.mockResolvedValue(false);
            mockStorageService.uploadFile.mockResolvedValue({
                uri: 'https://storage.example.com/my-bucket/test-id.jpg',
            });
            mockCryptoService.computeHash.mockReturnValue('mocked-hash');

            // image/jpeg -> jpg (mime-types maps jpeg to .jpg)
            await service.storeFile(mockStorageService, mockCryptoService, {
                ...validParams,
                mimeType: 'image/jpeg',
            });
            expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
                'my-bucket',
                '123e4567-e89b-12d3-a456-426614174000.jpg',
                fileBuffer,
                'image/jpeg',
            );

            jest.clearAllMocks();
            mockStorageService.objectExists.mockResolvedValue(false);
            mockStorageService.uploadFile.mockResolvedValue({
                uri: 'https://storage.example.com/my-bucket/test-id.pdf',
            });
            mockCryptoService.computeHash.mockReturnValue('mocked-hash');

            // application/pdf -> pdf
            await service.storeFile(mockStorageService, mockCryptoService, {
                ...validParams,
                mimeType: 'application/pdf',
            });
            expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
                'my-bucket',
                '123e4567-e89b-12d3-a456-426614174000.pdf',
                fileBuffer,
                'application/pdf',
            );
        });

        it('should throw BadRequestError when bucket is an empty string', async () => {
            await expect(
                service.storeFile(mockStorageService, mockCryptoService, {
                    ...validParams,
                    bucket: '',
                }),
            ).rejects.toThrow(BadRequestError);
            await expect(
                service.storeFile(mockStorageService, mockCryptoService, {
                    ...validParams,
                    bucket: '',
                }),
            ).rejects.toThrow(
                'Bucket is required. Please provide a bucket name, or set the DEFAULT_BUCKET environment variable.',
            );
        });

        it('should use DEFAULT_BUCKET when bucket is not provided', async () => {
            const configModule = require('../../config');
            configModule.DEFAULT_BUCKET = 'my-bucket';

            try {
                const result = await service.storeFile(mockStorageService, mockCryptoService, {
                    ...validParams,
                    bucket: undefined,
                });

                expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
                    'my-bucket',
                    expect.any(String),
                    expect.any(Buffer),
                    'image/png',
                );
                expect(result).toEqual({ uri: expect.any(String), hash: expect.any(String) });
            } finally {
                configModule.DEFAULT_BUCKET = undefined;
            }
        });

        it('should use DEFAULT_BUCKET when bucket is an empty string', async () => {
            const configModule = require('../../config');
            configModule.DEFAULT_BUCKET = 'my-bucket';

            try {
                const result = await service.storeFile(mockStorageService, mockCryptoService, {
                    ...validParams,
                    bucket: '',
                });

                expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
                    'my-bucket',
                    expect.any(String),
                    expect.any(Buffer),
                    'image/png',
                );
                expect(result).toEqual({ uri: expect.any(String), hash: expect.any(String) });
            } finally {
                configModule.DEFAULT_BUCKET = undefined;
            }
        });

        it('should prefer explicit bucket over DEFAULT_BUCKET', async () => {
            const configModule = require('../../config');
            configModule.DEFAULT_BUCKET = 'other-bucket';

            try {
                const result = await service.storeFile(mockStorageService, mockCryptoService, {
                    ...validParams,
                    bucket: 'my-bucket',
                });

                expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
                    'my-bucket',
                    expect.any(String),
                    expect.any(Buffer),
                    'image/png',
                );
                expect(result).toEqual({ uri: expect.any(String), hash: expect.any(String) });
            } finally {
                configModule.DEFAULT_BUCKET = undefined;
            }
        });

        it('should generate a UUID when id is an empty string', async () => {
            const result = await service.storeFile(mockStorageService, mockCryptoService, {
                ...validParams,
                id: '',
            });

            expect(result).toHaveProperty('uri');
            expect(mockStorageService.uploadFile).toHaveBeenCalled();
        });

        it('should successfully store a zero-byte file', async () => {
            const result = await service.storeFile(mockStorageService, mockCryptoService, {
                ...validParams,
                file: Buffer.alloc(0),
            });

            expect(result).toEqual({
                uri: expect.any(String),
                hash: expect.any(String),
            });
        });

        it('should propagate error when objectExists throws', async () => {
            mockStorageService.objectExists.mockRejectedValue(new Error('Storage connection failed'));

            await expect(service.storeFile(mockStorageService, mockCryptoService, validParams)).rejects.toThrow(
                ApplicationError,
            );
            await expect(service.storeFile(mockStorageService, mockCryptoService, validParams)).rejects.toThrow(
                'An unexpected error occurred while storing the file.',
            );
        });

        it('should propagate error when uploadFile throws', async () => {
            mockStorageService.uploadFile.mockRejectedValue(new Error('Upload failed'));

            await expect(service.storeFile(mockStorageService, mockCryptoService, validParams)).rejects.toThrow(
                ApplicationError,
            );
            await expect(service.storeFile(mockStorageService, mockCryptoService, validParams)).rejects.toThrow(
                'An unexpected error occurred while storing the file.',
            );
        });

        it('should propagate error when computeHash throws', async () => {
            mockCryptoService.computeHash.mockImplementation(() => {
                throw new Error('Hash computation failed');
            });

            await expect(service.storeFile(mockStorageService, mockCryptoService, validParams)).rejects.toThrow(
                ApplicationError,
            );
            await expect(service.storeFile(mockStorageService, mockCryptoService, validParams)).rejects.toThrow(
                'An unexpected error occurred while storing the file.',
            );
        });

        it('should successfully store a JPEG file with correct extension', async () => {
            const result = await service.storeFile(mockStorageService, mockCryptoService, {
                ...validParams,
                mimeType: 'image/jpeg',
            });

            expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
                'my-bucket',
                '123e4567-e89b-12d3-a456-426614174000.jpg',
                fileBuffer,
                'image/jpeg',
            );
            expect(result).toEqual({
                uri: expect.any(String),
                hash: expect.any(String),
            });
        });

        it('should throw BadRequestError when extension() returns false for the MIME type', async () => {
            // Mock mime-types extension to return false for a valid but unresolvable MIME type
            const mimeTypes = require('mime-types');
            const originalExtension = mimeTypes.extension;
            mimeTypes.extension = jest.fn().mockReturnValue(false);

            try {
                await expect(
                    service.storeFile(mockStorageService, mockCryptoService, {
                        ...validParams,
                        mimeType: 'image/png',
                    }),
                ).rejects.toThrow(BadRequestError);
                await expect(
                    service.storeFile(mockStorageService, mockCryptoService, {
                        ...validParams,
                        mimeType: 'image/png',
                    }),
                ).rejects.toThrow('Unable to determine file extension');
            } finally {
                mimeTypes.extension = originalExtension;
            }
        });
    });
});
