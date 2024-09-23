import { Storage } from '@google-cloud/storage';
import { IStorageService } from '.';

/**
 * Google Cloud Storage service.
 */
export class GCPStorageService implements IStorageService {
    private storage: Storage;

    constructor() {
        this.storage = new Storage();
    }

    /**
     * Uploads a file to Google Cloud Storage.
     * @param bucket The bucket name to upload the file to.
     * @param key The key or path of the file in the bucket.
     * @param body The content of the file to upload.
     * @param contentType The content type of the file.
     * @returns A promise that resolves to the public URL of the uploaded file.
     */
    async uploadFile(bucket: string, key: string, body: string, contentType: string) {
        const bucketInstance = this.storage.bucket(bucket);
        const file = bucketInstance.file(key);

        const options = {
            metadata: {
                contentType,
            },
        };

        await file.save(body, options);

        return { uri: `https://${bucket}.storage.googleapis.com/${key}` };
    }

    /**
     * Checks if an object exists in Google Cloud Storage.
     * @param bucket The bucket name to check.
     * @param key The key or path of the file in the bucket.
     * @returns A promise that resolves to a boolean indicating whether the object exists.
     */
    async objectExists(bucket: string, key: string): Promise<boolean> {
        const bucketInstance = this.storage.bucket(bucket);
        const file = bucketInstance.file(`${key}.json`);

        try {
            const [exists] = await file.exists();
            return exists;
        } catch (error) {
            return false;
        }
    }
}
