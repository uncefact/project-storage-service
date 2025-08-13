import { S3Client, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { DigitalOceanStorageService } from './digitalocean';

jest.mock('@aws-sdk/client-s3');
jest.mock('../../config', () => ({
    REGION: 'syd1',
}));

const MockS3Client = S3Client as jest.Mock;
const mockSend = jest.fn();

describe('DigitalOceanStorageService', () => {
    let digitalOceanStorageService: DigitalOceanStorageService;

    beforeEach(() => {
        MockS3Client.mockClear();
        mockSend.mockClear();
        
        MockS3Client.mockImplementation(() => ({
            send: mockSend,
        }));
        
        digitalOceanStorageService = new DigitalOceanStorageService();
    });

    describe('uploadFile', () => {
        it('should upload a file successfully', async () => {
            mockSend.mockResolvedValueOnce({});

            const result = await digitalOceanStorageService.uploadFile('test-bucket', 'test-key', 'test-body', 'application/json');

            expect(result).toEqual({ uri: 'https://test-bucket.syd1.digitaloceanspaces.com/test-key' });
            expect(mockSend).toHaveBeenCalledWith(expect.any(PutObjectCommand));
        });

        it('should throw an error if upload fails', async () => {
            const uploadError = new Error('Upload failed');
            mockSend.mockRejectedValueOnce(uploadError);

            await expect(digitalOceanStorageService.uploadFile('test-bucket', 'test-key', 'test-body', 'text/plain')).rejects.toThrow('Upload failed');
            expect(mockSend).toHaveBeenCalledWith(expect.any(PutObjectCommand));
        });
    });

    describe('objectExists', () => {
        it('should return true if the object exists', async () => {
            mockSend.mockResolvedValueOnce({});

            const result = await digitalOceanStorageService.objectExists('test-bucket', 'test-key');

            expect(result).toBe(true);
            expect(mockSend).toHaveBeenCalledWith(expect.any(HeadObjectCommand));
        });

        it('should return false if the object does not exist', async () => {
            const notFoundError = new Error('Not Found');
            (notFoundError as any).name = 'NotFound';
            mockSend.mockRejectedValueOnce(notFoundError);

            const result = await digitalOceanStorageService.objectExists('test-bucket', 'test-key');

            expect(result).toBe(false);
            expect(mockSend).toHaveBeenCalledWith(expect.any(HeadObjectCommand));
        });
    });
});