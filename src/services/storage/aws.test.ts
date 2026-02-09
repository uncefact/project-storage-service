import { S3Client, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => {
    return {
        S3Client: jest.fn().mockImplementation(() => ({
            send: mockSend,
        })),
        HeadObjectCommand: jest.fn(),
        PutObjectCommand: jest.fn(),
    };
});

describe('AWSStorageService', () => {
    beforeEach(() => {
        jest.resetModules();
        mockSend.mockReset();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('AWS S3 (no custom endpoint)', () => {
        beforeEach(() => {
            jest.doMock('../../config', () => ({
                S3_REGION: 'ap-southeast-2',
                S3_ENDPOINT: undefined,
                S3_FORCE_PATH_STYLE: false,
                S3_PUBLIC_URL: undefined,
            }));
        });

        it('should upload a file successfully with AWS S3 URI', async () => {
            mockSend.mockResolvedValueOnce({});
            const { AWSStorageService } = require('./aws');
            const awsStorageService = new AWSStorageService();

            const result = await awsStorageService.uploadFile(
                'test-bucket',
                'test-key',
                'test-body',
                'application/json',
            );

            expect(result).toEqual({ uri: 'https://test-bucket.s3.amazonaws.com/test-key' });
            expect(mockSend).toHaveBeenCalledTimes(1);
        });

        it('should upload a Buffer body successfully', async () => {
            mockSend.mockResolvedValueOnce({});
            const { AWSStorageService } = require('./aws');
            const awsStorageService = new AWSStorageService();

            const buffer = Buffer.from('binary content');
            const result = await awsStorageService.uploadFile(
                'test-bucket',
                'test-key.bin',
                buffer,
                'application/octet-stream',
            );

            expect(result).toEqual({ uri: 'https://test-bucket.s3.amazonaws.com/test-key.bin' });
            expect(mockSend).toHaveBeenCalledTimes(1);
        });

        it('should throw an error if upload fails', async () => {
            mockSend.mockRejectedValueOnce(new Error('Upload failed'));
            const { AWSStorageService } = require('./aws');
            const awsStorageService = new AWSStorageService();

            await expect(
                awsStorageService.uploadFile('test-bucket', 'test-key', 'test-body', 'text/plain'),
            ).rejects.toThrow('Upload failed');
            expect(mockSend).toHaveBeenCalledTimes(1);
        });

        it('should return true if the object exists', async () => {
            mockSend.mockResolvedValueOnce({});
            const { AWSStorageService } = require('./aws');
            const awsStorageService = new AWSStorageService();

            const result = await awsStorageService.objectExists('test-bucket', 'test-key');

            expect(result).toBe(true);
            expect(mockSend).toHaveBeenCalledTimes(1);
        });

        it('should return false if the object does not exist', async () => {
            mockSend.mockRejectedValueOnce(new Error('Not Found'));
            const { AWSStorageService } = require('./aws');
            const awsStorageService = new AWSStorageService();

            const result = await awsStorageService.objectExists('test-bucket', 'test-key');

            expect(result).toBe(false);
            expect(mockSend).toHaveBeenCalledTimes(1);
        });
    });

    describe('S3-compatible with path style (MinIO)', () => {
        beforeEach(() => {
            jest.doMock('../../config', () => ({
                S3_REGION: undefined,
                S3_ENDPOINT: 'http://localhost:9000',
                S3_FORCE_PATH_STYLE: true,
                S3_PUBLIC_URL: undefined,
            }));
        });

        it('should upload a file with path-style URI', async () => {
            mockSend.mockResolvedValueOnce({});
            const { AWSStorageService } = require('./aws');
            const awsStorageService = new AWSStorageService();

            const result = await awsStorageService.uploadFile(
                'test-bucket',
                'test-key',
                'test-body',
                'application/json',
            );

            expect(result).toEqual({ uri: 'http://localhost:9000/test-bucket/test-key' });
        });
    });

    describe('S3-compatible with virtual-hosted style (DigitalOcean Spaces)', () => {
        beforeEach(() => {
            jest.doMock('../../config', () => ({
                S3_REGION: undefined,
                S3_ENDPOINT: 'https://syd1.digitaloceanspaces.com',
                S3_FORCE_PATH_STYLE: false,
                S3_PUBLIC_URL: undefined,
            }));
        });

        it('should upload a file with virtual-hosted URI', async () => {
            mockSend.mockResolvedValueOnce({});
            const { AWSStorageService } = require('./aws');
            const awsStorageService = new AWSStorageService();

            const result = await awsStorageService.uploadFile(
                'test-bucket',
                'test-key',
                'test-body',
                'application/json',
            );

            expect(result).toEqual({ uri: 'https://test-bucket.syd1.digitaloceanspaces.com/test-key' });
        });
    });

    describe('S3_PUBLIC_URL override', () => {
        it('should use S3_PUBLIC_URL when set, ignoring bucket in URI', async () => {
            jest.doMock('../../config', () => ({
                S3_REGION: undefined,
                S3_ENDPOINT: 'https://syd1.digitaloceanspaces.com',
                S3_FORCE_PATH_STYLE: false,
                S3_PUBLIC_URL: 'https://documents.labs.pyx.io',
            }));
            mockSend.mockResolvedValueOnce({});
            const { AWSStorageService } = require('./aws');
            const awsStorageService = new AWSStorageService();
            const result = await awsStorageService.uploadFile(
                'test-bucket',
                'test-key.json',
                'test-body',
                'application/json',
            );
            expect(result).toEqual({ uri: 'https://documents.labs.pyx.io/test-key.json' });
        });

        it('should strip trailing slash from S3_PUBLIC_URL', async () => {
            jest.doMock('../../config', () => ({
                S3_REGION: undefined,
                S3_ENDPOINT: 'https://syd1.digitaloceanspaces.com',
                S3_FORCE_PATH_STYLE: false,
                S3_PUBLIC_URL: 'https://documents.labs.pyx.io/',
            }));
            mockSend.mockResolvedValueOnce({});
            const { AWSStorageService } = require('./aws');
            const awsStorageService = new AWSStorageService();
            const result = await awsStorageService.uploadFile(
                'test-bucket',
                'test-key.json',
                'test-body',
                'application/json',
            );
            expect(result).toEqual({ uri: 'https://documents.labs.pyx.io/test-key.json' });
        });

        it('should take precedence over S3_ENDPOINT and S3_FORCE_PATH_STYLE', async () => {
            jest.doMock('../../config', () => ({
                S3_REGION: undefined,
                S3_ENDPOINT: 'http://localhost:9000',
                S3_FORCE_PATH_STYLE: true,
                S3_PUBLIC_URL: 'https://cdn.example.com',
            }));
            mockSend.mockResolvedValueOnce({});
            const { AWSStorageService } = require('./aws');
            const awsStorageService = new AWSStorageService();
            const result = await awsStorageService.uploadFile(
                'test-bucket',
                'test-key',
                'test-body',
                'application/json',
            );
            expect(result).toEqual({ uri: 'https://cdn.example.com/test-key' });
        });

        it('should take precedence over AWS S3 default URI generation', async () => {
            jest.doMock('../../config', () => ({
                S3_REGION: 'ap-southeast-2',
                S3_ENDPOINT: undefined,
                S3_FORCE_PATH_STYLE: false,
                S3_PUBLIC_URL: 'https://cdn.example.com',
            }));
            mockSend.mockResolvedValueOnce({});
            const { AWSStorageService } = require('./aws');
            const awsStorageService = new AWSStorageService();
            const result = await awsStorageService.uploadFile(
                'test-bucket',
                'test-key',
                'test-body',
                'application/json',
            );
            expect(result).toEqual({ uri: 'https://cdn.example.com/test-key' });
        });

        it('should throw an error if S3_PUBLIC_URL is not a valid URL', async () => {
            jest.doMock('../../config', () => ({
                S3_REGION: undefined,
                S3_ENDPOINT: 'https://syd1.digitaloceanspaces.com',
                S3_FORCE_PATH_STYLE: false,
                S3_PUBLIC_URL: 'not-a-valid-url',
            }));
            mockSend.mockResolvedValueOnce({});
            const { AWSStorageService } = require('./aws');
            const awsStorageService = new AWSStorageService();
            await expect(
                awsStorageService.uploadFile('test-bucket', 'test-key', 'test-body', 'application/json'),
            ).rejects.toThrow('Invalid S3_PUBLIC_URL format');
        });
    });

    describe('Configuration validation', () => {
        it('should throw an error if S3_REGION is not set for AWS S3', async () => {
            jest.doMock('../../config', () => ({
                S3_REGION: undefined,
                S3_ENDPOINT: undefined,
                S3_FORCE_PATH_STYLE: false,
                S3_PUBLIC_URL: undefined,
            }));

            expect(() => {
                const { AWSStorageService } = require('./aws');
                new AWSStorageService();
            }).toThrow('S3_REGION is required when using AWS S3');
        });

        it('should not require S3_REGION when S3_ENDPOINT is set', async () => {
            jest.doMock('../../config', () => ({
                S3_REGION: undefined,
                S3_ENDPOINT: 'http://localhost:9000',
                S3_FORCE_PATH_STYLE: true,
                S3_PUBLIC_URL: undefined,
            }));

            expect(() => {
                const { AWSStorageService } = require('./aws');
                new AWSStorageService();
            }).not.toThrow();
        });

        it('should throw an error if S3_ENDPOINT is not a valid URL', async () => {
            jest.doMock('../../config', () => ({
                S3_REGION: undefined,
                S3_ENDPOINT: 'not-a-valid-url',
                S3_FORCE_PATH_STYLE: false,
                S3_PUBLIC_URL: undefined,
            }));
            mockSend.mockResolvedValueOnce({});
            const { AWSStorageService } = require('./aws');
            const awsStorageService = new AWSStorageService();

            await expect(
                awsStorageService.uploadFile('test-bucket', 'test-key', 'test-body', 'application/json'),
            ).rejects.toThrow('Invalid S3_ENDPOINT format');
        });
    });
});
