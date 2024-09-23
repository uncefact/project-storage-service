import fs from 'fs';
import path from 'path';
import { IStorageService } from '.';
import { API_VERSION, DOMAIN, LOCAL_DIRECTORY, PORT, PROTOCOL, __dirname } from '../../config';

/**
 * A storage service that uploads files to the local file system.
 * !WARNING: This service is for development purposes only.
 */
export class LocalStorageService implements IStorageService {
    constructor() {}

    /**
     * Uploads a file to Local file system.
     * @param bucket The bucket name will be used as a directory.
     * @param key The key or path of the file in the bucket.
     * @param body The content of the file to upload.
     * @param contentType The content type of the file.
     * @returns A promise that resolves to the public URL of the uploaded file.
     */
    async uploadFile(bucket: string, key: string, body: string, contentType: string) {
        const filePath = path.join(__dirname, LOCAL_DIRECTORY, bucket, key);

        const directory = path.dirname(filePath);
        // Create directories if they don't exist
        fs.mkdirSync(directory, { recursive: true });

        // Write JSON data to file
        fs.writeFileSync(filePath, body);
        return { uri: `${PROTOCOL}://${DOMAIN}:${PORT}/${API_VERSION}/${bucket}/${key}` };
    }

    /**
     * Checks if an object exists in the local file system.
     * @param bucket The bucket name (directory).
     * @param key The key or path of the file in the bucket.
     * @returns A promise that resolves to a boolean indicating whether the object exists.
     */
    async objectExists(bucket: string, key: string): Promise<boolean> {
        const filePath = path.join(__dirname, LOCAL_DIRECTORY, bucket, key + '.json');
        return new Promise<boolean>((resolve) => {
            fs.access(filePath, fs.constants.F_OK, (err) => {
                resolve(!err);
            });
        });
    }
}
