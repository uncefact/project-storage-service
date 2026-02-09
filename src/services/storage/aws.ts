import {
    S3Client,
    HeadObjectCommand,
    PutObjectCommand,
    PutObjectCommandInput,
    S3ClientConfig,
} from '@aws-sdk/client-s3';
import { IStorageService } from '.';
import { S3_REGION, S3_ENDPOINT, S3_FORCE_PATH_STYLE, PUBLIC_URL } from '../../config';

/**
 * Creates the S3 client configuration.
 * Supports AWS S3 and S3-compatible providers (MinIO, DigitalOcean Spaces, Cloudflare R2, etc.)
 */
const createS3ClientConfig = (): S3ClientConfig => {
    const config: S3ClientConfig = {};

    if (S3_ENDPOINT) {
        // S3-compatible provider with custom endpoint
        config.endpoint = S3_ENDPOINT;
        config.forcePathStyle = S3_FORCE_PATH_STYLE;
        // Region is optional for S3-compatible providers, default to us-east-1
        config.region = S3_REGION || 'us-east-1';
    } else {
        // AWS S3 - region is required
        if (!S3_REGION) {
            throw new Error('S3_REGION is required when using AWS S3 (no S3_ENDPOINT specified)');
        }
        config.region = S3_REGION;
    }

    return config;
};

/**
 * Generates the public URI for an uploaded object.
 * This only affects the URI returned in API responses — not where files are uploaded to.
 * When PUBLIC_URL is set, it is used as the base URL instead of S3_ENDPOINT.
 */
const generateUri = (bucket: string, key: string): string => {
    if (PUBLIC_URL) {
        let url: URL;
        try {
            url = new URL(PUBLIC_URL);
        } catch {
            throw new Error(`Invalid PUBLIC_URL format: "${PUBLIC_URL}" is not a valid URL`);
        }
        // CDN/custom domain — bucket routing handled externally
        return `${url.origin}/${key}`;
    }

    if (S3_ENDPOINT) {
        let url: URL;
        try {
            url = new URL(S3_ENDPOINT);
        } catch {
            throw new Error(`Invalid S3_ENDPOINT format: "${S3_ENDPOINT}" is not a valid URL`);
        }

        if (S3_FORCE_PATH_STYLE) {
            // Path-style: {endpoint}/{bucket}/{key}
            return `${url.origin}/${bucket}/${key}`;
        }
        // Virtual-hosted style with custom endpoint: {protocol}://{bucket}.{host}/{key}
        return `${url.protocol}//${bucket}.${url.host}/${key}`;
    }
    // AWS S3 default: https://{bucket}.s3.amazonaws.com/{key}
    return `https://${bucket}.s3.amazonaws.com/${key}`;
};

/**
 * AWS S3 Storage service.
 * Supports AWS S3 and any S3-compatible storage provider.
 */
export class AWSStorageService implements IStorageService {
    private storage: S3Client;

    constructor() {
        this.storage = new S3Client(createS3ClientConfig());
    }

    /**
     * Uploads a file to S3 or S3-compatible storage.
     * @param bucket The bucket name to upload the file to.
     * @param key The key or path of the file in the bucket.
     * @param body The content of the file to upload.
     * @param contentType The content type of the file.
     * @returns A promise that resolves to the public URL of the uploaded file.
     */
    async uploadFile(bucket: string, key: string, body: string | Buffer, contentType: string) {
        const params: PutObjectCommandInput = {
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
        };

        try {
            const command = new PutObjectCommand(params);
            await this.storage.send(command);
            console.log(`File uploaded successfully to ${bucket}/${key}`);
            return { uri: generateUri(bucket, key) };
        } catch (error) {
            console.error(`Error uploading file: ${error}`);
            throw error;
        }
    }

    /**
     * Checks if an object exists in S3 or S3-compatible storage.
     * @param bucket The bucket name to check.
     * @param key The key or path of the file in the bucket.
     * @returns A promise that resolves to a boolean indicating whether the object exists.
     */
    async objectExists(bucket: string, key: string): Promise<boolean> {
        const params = { Bucket: bucket, Key: key };

        try {
            const command = new HeadObjectCommand(params);
            await this.storage.send(command);
            return true;
        } catch (error) {
            return false;
        }
    }
}
