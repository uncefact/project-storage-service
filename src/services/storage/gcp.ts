import { Storage } from '@google-cloud/storage';
import { IStorageService } from '.';
import { generatePublicUri } from '../../config';

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
    async uploadFile(bucket: string, key: string, body: string | Buffer, contentType: string) {
        const bucketInstance = this.storage.bucket(bucket);
        const file = bucketInstance.file(key);

        const options = {
            metadata: {
                contentType,
            },
        };

        await file.save(body, options);

        const publicUri = generatePublicUri(key);
        if (publicUri) return { uri: publicUri };

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
        const file = bucketInstance.file(key);
        const [exists] = await file.exists();
        return exists;
    }

    /**
     * Lists objects in a Google Cloud Storage bucket filtered by a prefix.
     * @param bucket The bucket name to list objects from.
     * @param prefix The prefix to filter objects by.
     * @returns A promise that resolves to an array of object names matching the prefix.
     */
    async listObjectsByPrefix(bucket: string, prefix: string): Promise<string[]> {
        const bucketInstance = this.storage.bucket(bucket);
        const [files] = await bucketInstance.getFiles({ prefix });
        return files.map((file) => file.name);
    }

    /**
     * Deletes a file from Google Cloud Storage.
     * @param bucket The bucket name containing the file.
     * @param key The key or path of the file to delete.
     * @returns A promise that resolves when the file is deleted.
     */
    async deleteFile(bucket: string, key: string): Promise<void> {
        const bucketInstance = this.storage.bucket(bucket);
        const file = bucketInstance.file(key);
        await file.delete();
    }
}
