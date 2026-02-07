export * from './gcp';
export * from './local';
export * from './service';

export interface IStorageService {
    /**
     * Uploads a file to the storage service.
     * @param bucket The bucket or container name where the file will be stored.
     * @param key The key or path under which to store the file.
     * @param body The file content.
     * @param contentType The MIME type of the file being uploaded.
     * @returns A promise that resolves with the URI of the uploaded file.
     */
    uploadFile(bucket: string, key: string, body: string | Buffer, contentType: string): Promise<{ uri: string }>;

    /**
     * Checks if an object exists in the storage service.
     * @param bucket The bucket or container name to check.
     * @param key The key or path of the file to check.
     * @returns A promise that resolves to a boolean indicating whether the object exists.
     */
    objectExists(bucket: string, key: string): Promise<boolean>;
}
