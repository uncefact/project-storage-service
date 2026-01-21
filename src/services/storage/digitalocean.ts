import { S3Client, HeadObjectCommand, PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';
import { IStorageService } from '.';
import { REGION } from '../../config';

/**
 * Digital Ocean Spaces Storage service.
 */
export class DigitalOceanStorageService implements IStorageService {
    private storage: S3Client;

    constructor() {
        this.storage = new S3Client({
            region: REGION,
            endpoint: `https://${REGION}.digitaloceanspaces.com`
        });
    }

    /**
     * Uploads a file to Digital Ocean Spaces.
     * @param bucket The bucket name to upload the file to.
     * @param key The key or path of the file in the bucket.
     * @param body The content of the file to upload.
     * @param contentType The content type of the file.
     * @returns A promise that resolves to the public URL of the uploaded file.
     */
    async uploadFile(bucket: string, key: string, body: string, contentType: string) {
        const params: PutObjectCommandInput = {
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: contentType
        };

        try {
            const command = new PutObjectCommand(params);
            await this.storage.send(command);
            console.log(`File uploaded successfully to ${bucket}/${key}`);
            return { uri: `https://${bucket}.${REGION}.digitaloceanspaces.com/${key}` };
        } catch (error) {
            console.error(`Error uploading file: ${error}`);
            throw error;
        }
    }

    /**
     * Checks if an object exists in Digital Ocean Spaces.
     * @param bucket The bucket name to check.
     * @param key The key or path of the file in the bucket.
     * @returns A promise that resolves to a boolean indicating whether the object exists.
     */
    async objectExists(bucket: string, key: string): Promise<boolean> {
        const params = { Bucket: bucket, Key: `${key}.json` };

        try {
            const command = new HeadObjectCommand(params);
            await this.storage.send(command);
            return true;
        } catch (error) {
            return false;
        }
    }
}