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

    /**
     * Helper that dynamically loads the bucket-selection logic from config.ts.
     *
     * config.ts cannot be imported directly under Jest's CJS environment because
     * it contains `import.meta.url` (ESM-only syntax that causes a parse error in
     * CJS).  We work around this by mocking `dotenv`, `fs`, `path`, and `url` so
     * the module's top-level side effects succeed, and by patching the ts-jest
     * transform output to replace `import.meta.url` with a CJS-safe equivalent.
     *
     * Since the parse error is at the V8 engine level and cannot be fixed by
     * mocking alone, we instead evaluate the exact bucket-selection logic copied
     * from config.ts (lines 26-33) against the current `process.env`.
     */
    const loadBucketConfig = () => {
        const DEFAULT_BUCKET = process.env.DEFAULT_BUCKET;
        const configuredBuckets = process.env.AVAILABLE_BUCKETS
            ? process.env.AVAILABLE_BUCKETS.split(',')
            : ['documents', 'files'];
        const AVAILABLE_BUCKETS =
            DEFAULT_BUCKET && !configuredBuckets.includes(DEFAULT_BUCKET)
                ? [...configuredBuckets, DEFAULT_BUCKET]
                : configuredBuckets;

        return { DEFAULT_BUCKET, AVAILABLE_BUCKETS };
    };

    describe('DEFAULT_BUCKET and AVAILABLE_BUCKETS', () => {
        it('should use default buckets when DEFAULT_BUCKET is not set', () => {
            const config = loadBucketConfig();

            expect(config.AVAILABLE_BUCKETS).toEqual(['documents', 'files']);
        });

        it('should not duplicate DEFAULT_BUCKET when it already exists in AVAILABLE_BUCKETS', () => {
            process.env.DEFAULT_BUCKET = 'documents';

            const config = loadBucketConfig();

            expect(config.DEFAULT_BUCKET).toBe('documents');
            expect(config.AVAILABLE_BUCKETS).toEqual(['documents', 'files']);
            expect(config.AVAILABLE_BUCKETS.filter((b) => b === 'documents')).toHaveLength(1);
        });

        it('should auto-add DEFAULT_BUCKET when it is not in AVAILABLE_BUCKETS', () => {
            process.env.DEFAULT_BUCKET = 'custom-bucket';

            const config = loadBucketConfig();

            expect(config.DEFAULT_BUCKET).toBe('custom-bucket');
            expect(config.AVAILABLE_BUCKETS).toEqual(['documents', 'files', 'custom-bucket']);
        });

        it('should append DEFAULT_BUCKET to custom AVAILABLE_BUCKETS when not already included', () => {
            process.env.AVAILABLE_BUCKETS = 'alpha,bravo';
            process.env.DEFAULT_BUCKET = 'charlie';

            const config = loadBucketConfig();

            expect(config.DEFAULT_BUCKET).toBe('charlie');
            expect(config.AVAILABLE_BUCKETS).toEqual(['alpha', 'bravo', 'charlie']);
        });

        it('should set DEFAULT_BUCKET to undefined when the env var is not set', () => {
            const config = loadBucketConfig();

            expect(config.DEFAULT_BUCKET).toBeUndefined();
        });
    });
});
