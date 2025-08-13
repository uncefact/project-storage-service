import { S3Client, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { REGION } from '../../config';
import { DigitalOceanStorageService } from './digitalocean';

jest.mock('@aws-sdk/client-s3');
jest.mock('../../config', () => ({
    REGION: 'nyc3',
}));

describe('DigitalOceanStorageService', () => {
    let digitalOceanStorageService: DigitalOceanStorageService;
    let s3ClientMock: jest.Mocked<S3Client>;

    beforeEach(() => {
        s3ClientMock = new S3Client({
            region: 'us-east-1',
            endpoint: `https://${REGION}.digitaloceanspaces.com`,
            forcePathStyle: false
        }) as jest.Mocked<S3Client>;
        digitalOceanStorageService = new DigitalOceanStorageService();
    });

    describe('uploadFile', () => {
        it('should upload a file successfully', async () => {
            s3ClientMock.send.mockResolvedValueOnce({} as never);

            const result = await digitalOceanStorageService.uploadFile('test-bucket', 'test-key', 'test-body', 'application/json');

            expect(result).toEqual({ uri: 'https://test-bucket.nyc3.digitaloceanspaces.com/test-key' });
            expect(s3ClientMock.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
        });

        it('should throw an error if upload fails', async () => {
            s3ClientMock.send.mockRejectedValueOnce(new Error('Upload failed') as never);

            await expect(digitalOceanStorageService.uploadFile('test-bucket', 'test-key', 'test-body', 'text/plain')).rejects.toThrow('Upload failed');
            expect(s3ClientMock.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
        });
    });

    describe('objectExists', () => {
        it('should return true if the object exists', async () => {
            s3ClientMock.send.mockResolvedValueOnce(true as never);

            const result = await digitalOceanStorageService.objectExists('test-bucket', 'test-key');

            expect(result).toBe(true);
            expect(s3ClientMock.send).toHaveBeenCalledWith(expect.any(HeadObjectCommand));
        });

        it('should return false if the object does not exist', async () => {
            s3ClientMock.send.mockRejectedValueOnce(new Error('Not Found') as never);

            const result = await digitalOceanStorageService.objectExists('test-bucket', 'test-key');

            expect(result).toBe(false);
            expect(s3ClientMock.send).toHaveBeenCalledWith(expect.any(HeadObjectCommand));
        });
    });
});