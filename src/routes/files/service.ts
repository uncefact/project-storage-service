import { v4 } from 'uuid';
import { extension } from 'mime-types';
import { IStorageService, CryptographyService } from '../../services';
import { ApiError, ApplicationError, BadRequestError, ConflictError } from '../../errors';
import { AVAILABLE_BUCKETS, ALLOWED_BINARY_TYPES } from '../../config';
import { isValidUUID } from '../../utils';

export interface IStoreFileParams {
    bucket?: string;
    id?: string;
    file?: Buffer;
    mimeType?: string;
}

export class FilesService {
    /**
     * Stores a binary file in a storage service.
     * @param storageService - The storage service used for uploading the file.
     * @param cryptoService - The crypto service used for generating the hash.
     * @param params - An object containing the parameters for storing the file.
     * @param params.bucket - The name of the bucket where the file will be stored.
     * @param params.id - The optional ID of the file. If not provided, a new UUID will be generated.
     * @param params.file - The binary file content as a Buffer.
     * @param params.mimeType - The MIME type of the file.
     * @returns An object containing the URI of the uploaded file and the hash of the file content.
     * @throws {BadRequestError} If the bucket is not provided, is invalid, or if the file or MIME type is missing/invalid.
     * @throws {BadRequestError} If the provided ID is not a valid UUID.
     * @throws {ConflictError} If a file with the provided ID already exists in the specified bucket.
     * @throws {ApplicationError} If an unexpected error occurs while storing the file.
     */
    public async storeFile(
        storageService: IStorageService,
        cryptoService: CryptographyService,
        { bucket, id, file, mimeType }: IStoreFileParams,
    ) {
        try {
            if (!bucket) {
                throw new BadRequestError('Bucket is required. Please provide a bucket name.');
            }

            if (!AVAILABLE_BUCKETS.includes(bucket)) {
                throw new BadRequestError(
                    `Invalid bucket. Must be one of the following buckets: ${AVAILABLE_BUCKETS.join(', ')}`,
                );
            }

            if (!file) {
                throw new BadRequestError('File is required. Please provide a file.');
            }

            if (!mimeType || !ALLOWED_BINARY_TYPES.includes(mimeType)) {
                throw new BadRequestError(
                    `Invalid MIME type. Must be one of the following types: ${ALLOWED_BINARY_TYPES.join(', ')}`,
                );
            }

            const fileId = id || v4();

            if (!isValidUUID(fileId)) {
                throw new BadRequestError(`Invalid id ${fileId}. Please provide a valid UUID.`);
            }

            const ext = extension(mimeType);

            if (!ext) {
                throw new BadRequestError(`Unable to determine file extension for MIME type '${mimeType}'.`);
            }

            const objectName = `${fileId}.${ext}`;

            const objectExists = await storageService.objectExists(bucket, objectName);

            if (objectExists) {
                throw new ConflictError('A file with the provided ID already exists in the specified bucket.');
            }

            const hash = cryptoService.computeHash(file);

            const { uri } = await storageService.uploadFile(bucket, objectName, file, mimeType);

            return {
                uri,
                hash,
            };
        } catch (err: any) {
            console.error('[FilesService.storeFile] An error occurred while storing the file.', err);

            if (err instanceof ApiError) {
                throw err;
            }

            throw new ApplicationError('An unexpected error occurred while storing the file.');
        }
    }
}
