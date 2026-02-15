import { getBucketConfiguration } from './bucket-config';
import { createPublicUriGenerator } from './public-url';

describe('config', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
        delete process.env.DEFAULT_BUCKET;
        delete process.env.AVAILABLE_BUCKETS;
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('DEFAULT_BUCKET and AVAILABLE_BUCKETS', () => {
        it('should use default buckets when DEFAULT_BUCKET is not set', () => {
            const config = getBucketConfiguration(process.env);

            expect(config.AVAILABLE_BUCKETS).toEqual(['documents', 'files']);
        });

        it('should not duplicate DEFAULT_BUCKET when it already exists in AVAILABLE_BUCKETS', () => {
            process.env.DEFAULT_BUCKET = 'documents';

            const config = getBucketConfiguration(process.env);

            expect(config.DEFAULT_BUCKET).toBe('documents');
            expect(config.AVAILABLE_BUCKETS).toEqual(['documents', 'files']);
            expect(config.AVAILABLE_BUCKETS.filter((b) => b === 'documents')).toHaveLength(1);
        });

        it('should auto-add DEFAULT_BUCKET when it is not in AVAILABLE_BUCKETS', () => {
            process.env.DEFAULT_BUCKET = 'custom-bucket';

            const config = getBucketConfiguration(process.env);

            expect(config.DEFAULT_BUCKET).toBe('custom-bucket');
            expect(config.AVAILABLE_BUCKETS).toEqual(['documents', 'files', 'custom-bucket']);
        });

        it('should append DEFAULT_BUCKET to custom AVAILABLE_BUCKETS when not already included', () => {
            process.env.AVAILABLE_BUCKETS = 'alpha,bravo';
            process.env.DEFAULT_BUCKET = 'charlie';

            const config = getBucketConfiguration(process.env);

            expect(config.DEFAULT_BUCKET).toBe('charlie');
            expect(config.AVAILABLE_BUCKETS).toEqual(['alpha', 'bravo', 'charlie']);
        });

        it('should set DEFAULT_BUCKET to undefined when the env var is not set', () => {
            const config = getBucketConfiguration(process.env);

            expect(config.DEFAULT_BUCKET).toBeUndefined();
        });
    });

    describe('generatePublicUri', () => {
        it('should return null when PUBLIC_URL is not set', () => {
            const generatePublicUri = createPublicUriGenerator(undefined);

            expect(generatePublicUri('my-bucket/file.pdf')).toBeNull();
        });

        it('should return {origin}/{key} for a valid PUBLIC_URL', () => {
            const generatePublicUri = createPublicUriGenerator('https://cdn.example.com');

            expect(generatePublicUri('my-bucket/file.pdf')).toBe('https://cdn.example.com/my-bucket/file.pdf');
        });

        it('should strip path components and use only the origin', () => {
            const generatePublicUri = createPublicUriGenerator('https://cdn.example.com/some/path');

            expect(generatePublicUri('my-bucket/file.pdf')).toBe('https://cdn.example.com/my-bucket/file.pdf');
        });

        it('should preserve non-standard ports in the origin', () => {
            const generatePublicUri = createPublicUriGenerator('https://cdn.example.com:8080');

            expect(generatePublicUri('my-bucket/file.pdf')).toBe('https://cdn.example.com:8080/my-bucket/file.pdf');
        });

        it('should strip trailing slash from origin', () => {
            const generatePublicUri = createPublicUriGenerator('https://cdn.example.com/');

            expect(generatePublicUri('my-bucket/file.pdf')).toBe('https://cdn.example.com/my-bucket/file.pdf');
        });

        it('should throw at creation time if PUBLIC_URL is an invalid URL', () => {
            expect(() => createPublicUriGenerator('not-a-url')).toThrow(
                'Invalid PUBLIC_URL format: "not-a-url" is not a valid URL',
            );
        });
    });
});
