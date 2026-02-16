interface BucketConfiguration {
    /** The default bucket name, or undefined if not configured. Always a member of AVAILABLE_BUCKETS when defined. */
    DEFAULT_BUCKET: string | undefined;
    /** The list of permitted bucket names. Always non-empty. */
    AVAILABLE_BUCKETS: string[];
}

export function getBucketConfiguration(env: NodeJS.ProcessEnv): BucketConfiguration {
    const DEFAULT_BUCKET = env.DEFAULT_BUCKET || undefined;
    const configuredBuckets = env.AVAILABLE_BUCKETS
        ? env.AVAILABLE_BUCKETS.split(',').filter(Boolean)
        : ['documents', 'files'];

    const shouldAutoAddDefaultBucket = DEFAULT_BUCKET && !configuredBuckets.includes(DEFAULT_BUCKET);

    if (shouldAutoAddDefaultBucket) {
        console.warn(
            `[config] DEFAULT_BUCKET="${DEFAULT_BUCKET}" is not in AVAILABLE_BUCKETS (${configuredBuckets.join(', ')}). ` +
                'It will be auto-added, but consider including it in AVAILABLE_BUCKETS explicitly.',
        );
    }

    const AVAILABLE_BUCKETS = shouldAutoAddDefaultBucket ? [...configuredBuckets, DEFAULT_BUCKET] : configuredBuckets;

    return { DEFAULT_BUCKET, AVAILABLE_BUCKETS };
}
