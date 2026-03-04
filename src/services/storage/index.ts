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

    /**
     * Lists object keys in a bucket that match a given prefix.
     * @param bucket The bucket or container name to search.
     * @param prefix The prefix to filter keys by.
     * @returns A promise that resolves to an array of matching object keys.
     */
    listObjectsByPrefix(bucket: string, prefix: string): Promise<string[]>;

    /**
     * Deletes a file from the storage service.
     * @param bucket The bucket or container name containing the file.
     * @param key The key or path of the file to delete.
     * @returns A promise that resolves when the file has been deleted.
     */
    deleteFile(bucket: string, key: string): Promise<void>;
}
