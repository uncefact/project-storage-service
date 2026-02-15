import { isPlainObject } from 'lodash';
import { v4 } from 'uuid';
import { extension } from 'mime-types';
import { IStorageService, ICryptographyService } from '../../services';
import { ApiError, ApplicationError, BadRequestError, ConflictError } from '../../errors';
import { AVAILABLE_BUCKETS, ALLOWED_UPLOAD_TYPES, DEFAULT_BUCKET } from '../../config';
import { isValidUUID } from '../../utils';
import { IStoreParams, IStoreFileParams } from '../../types';

export class PublicService {
    /**
     * Stores a JSON document in a storage service without encryption.
     *
     * @param storageService - The storage service used for uploading the document.
     * @param cryptoService - The crypto service used for generating the hash.
     * @param params - An object containing the parameters for storing the document.
     * @param params.bucket - The name of the bucket where the document will be stored. Falls back to DEFAULT_BUCKET if omitted.
     * @param params.id - The optional ID of the document. If not provided, a new UUID will be generated.
     * @param params.data - The JSON object containing the document data.
     * @returns An object containing the URI of the uploaded document and the hash of the document data.
     * @throws {BadRequestError} If no bucket is resolved (neither provided nor configured via DEFAULT_BUCKET), or if the bucket is invalid, or if the data is not a JSON object.
     * @throws {BadRequestError} If the provided ID is not a valid UUID.
     * @throws {ConflictError} If a document with the provided ID already exists in the specified bucket.
     * @throws {ApplicationError} If an unexpected error occurs while storing the document.
     */
    public async storeDocument(
        storageService: IStorageService,
        cryptoService: ICryptographyService,
        { bucket, id, data }: IStoreParams,
    ) {
        try {
            const resolvedBucket = bucket || DEFAULT_BUCKET;

            if (!resolvedBucket) {
                throw new BadRequestError(
                    'Bucket is required. Please provide a bucket name, or set the DEFAULT_BUCKET environment variable.',
                );
            }

            if (!AVAILABLE_BUCKETS.includes(resolvedBucket)) {
                throw new BadRequestError(
                    `Invalid bucket. Must be one of the following buckets: ${AVAILABLE_BUCKETS.join(', ')}`,
                );
            }

            if (!isPlainObject(data)) {
                throw new BadRequestError('Data must be a JSON object. Please provide a valid JSON object.');
            }

            const documentId = id || v4();

            if (!isValidUUID(documentId)) {
                throw new BadRequestError(`Invalid id ${documentId}. Please provide a valid UUID.`);
            }

            const objectName = documentId + '.json';

            const objectExists = await storageService.objectExists(resolvedBucket, objectName);

            if (objectExists) {
                throw new ConflictError('A document with the provided ID already exists in the specified bucket.');
            }

            const stringifiedData = JSON.stringify(data);

            const hash = cryptoService.computeHash(stringifiedData);

            const { uri } = await storageService.uploadFile(
                resolvedBucket,
                objectName,
                stringifiedData,
                'application/json',
            );

            return {
                uri,
                hash,
            };
        } catch (err: any) {
            console.error('[PublicService.storeDocument] An error occurred while storing the document.', err);

            if (err instanceof ApiError) {
                throw err;
            }

            throw new ApplicationError('An unexpected error occurred while storing the document.');
        }
    }

    /**
     * Stores a binary file in a storage service without encryption.
     *
     * @param storageService - The storage service used for uploading the file.
     * @param cryptoService - The crypto service used for generating the hash.
     * @param params - An object containing the parameters for storing the file.
     * @param params.bucket - The name of the bucket where the file will be stored. Falls back to DEFAULT_BUCKET if omitted.
     * @param params.id - The optional ID of the file. If not provided, a new UUID will be generated.
     * @param params.file - The binary file content as a Buffer.
     * @param params.mimeType - The MIME type of the file.
     * @returns An object containing the URI of the uploaded file and the hash of the file content.
     * @throws {BadRequestError} If no bucket is resolved (neither provided nor configured via DEFAULT_BUCKET), or if the bucket is invalid, or if the file or MIME type is missing/invalid.
     * @throws {BadRequestError} If the provided ID is not a valid UUID.
     * @throws {ConflictError} If a file with the provided ID already exists in the specified bucket.
     * @throws {ApplicationError} If an unexpected error occurs while storing the file.
     */
    public async storeFile(
        storageService: IStorageService,
        cryptoService: ICryptographyService,
        { bucket, id, file, mimeType }: IStoreFileParams,
    ) {
        try {
            const resolvedBucket = bucket || DEFAULT_BUCKET;

            if (!resolvedBucket) {
                throw new BadRequestError(
                    'Bucket is required. Please provide a bucket name, or set the DEFAULT_BUCKET environment variable.',
                );
            }

            if (!AVAILABLE_BUCKETS.includes(resolvedBucket)) {
                throw new BadRequestError(
                    `Invalid bucket. Must be one of the following buckets: ${AVAILABLE_BUCKETS.join(', ')}`,
                );
            }

            if (!file) {
                throw new BadRequestError('File is required. Please provide a file.');
            }

            if (!mimeType || !ALLOWED_UPLOAD_TYPES.includes(mimeType)) {
                throw new BadRequestError(
                    `Invalid MIME type. Must be one of the following types: ${ALLOWED_UPLOAD_TYPES.join(', ')}`,
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

            const objectExists = await storageService.objectExists(resolvedBucket, objectName);

            if (objectExists) {
                throw new ConflictError('A file with the provided ID already exists in the specified bucket.');
            }

            const hash = cryptoService.computeHash(file);

            const { uri } = await storageService.uploadFile(resolvedBucket, objectName, file, mimeType);

            return {
                uri,
                hash,
            };
        } catch (err: any) {
            console.error('[PublicService.storeFile] An error occurred while storing the file.', err);

            if (err instanceof ApiError) {
                throw err;
            }

            throw new ApplicationError('An unexpected error occurred while storing the file.');
        }
    }
}
