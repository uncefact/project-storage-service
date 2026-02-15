export function getBucketConfiguration(env: NodeJS.ProcessEnv) {
    const DEFAULT_BUCKET = env.DEFAULT_BUCKET;
    const configuredBuckets = env.AVAILABLE_BUCKETS ? env.AVAILABLE_BUCKETS.split(',') : ['documents', 'files'];
    const AVAILABLE_BUCKETS =
        DEFAULT_BUCKET && !configuredBuckets.includes(DEFAULT_BUCKET)
            ? [...configuredBuckets, DEFAULT_BUCKET]
            : configuredBuckets;
    return { DEFAULT_BUCKET, AVAILABLE_BUCKETS };
}
