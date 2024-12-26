import { S3Client, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { REGION } from '../../config';
import { AWSStorageService } from './aws';

jest.mock('@aws-sdk/client-s3');
jest.mock('../../config', () => ({
    REGION: 'ap-southeast-2',
}));

describe('AWSStorageService', () => {
    let awsStorageService: AWSStorageService;
    let s3ClientMock: jest.Mocked<S3Client>;

    beforeEach(() => {
        s3ClientMock = new S3Client({ region: REGION }) as jest.Mocked<S3Client>;
        awsStorageService = new AWSStorageService();
    });

    describe('uploadFile', () => {
        it('should upload a file successfully', async () => {
            s3ClientMock.send.mockResolvedValueOnce({} as never);

            const result = await awsStorageService.uploadFile('test-bucket', 'test-key', 'test-body', 'applicaton/json');

            expect(result).toEqual({ uri: 'https://test-bucket.s3.amazonaws.com/test-key' });
            expect(s3ClientMock.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
        });

        it('should throw an error if upload fails', async () => {
            s3ClientMock.send.mockRejectedValueOnce(new Error('Upload failed') as never);

            await expect(awsStorageService.uploadFile('test-bucket', 'test-key', 'test-body', 'text/plain')).rejects.toThrow('Upload failed');
            expect(s3ClientMock.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
        });
    });

    describe('objectExists', () => {
        it('should return true if the object exists', async () => {
            s3ClientMock.send.mockResolvedValueOnce(true as never);

            const result = await awsStorageService.objectExists('test-bucket', 'test-key');

            expect(result).toBe(true);
            expect(s3ClientMock.send).toHaveBeenCalledWith(expect.any(HeadObjectCommand));
        });

        it('should return false if the object does not exist', async () => {
            s3ClientMock.send.mockRejectedValueOnce(new Error('Not Found') as never);

            const result = await awsStorageService.objectExists('test-bucket', 'test-key');

            expect(result).toBe(false);
            expect(s3ClientMock.send).toHaveBeenCalledWith(expect.any(HeadObjectCommand));
        });
    });
});