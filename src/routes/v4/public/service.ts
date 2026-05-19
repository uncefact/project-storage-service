import { isPlainObject } from 'lodash';
import { v4 } from 'uuid';
import { extension } from 'mime-types';
import { IStorageService, ICryptographyService } from '../../../services';
import { ApiError, ApplicationError, BadRequestError, ConflictError } from '../../../errors';
import { AVAILABLE_BUCKETS, ALLOWED_UPLOAD_TYPES, DEFAULT_BUCKET } from '../../../config';
import { isValidUUID } from '../../../utils';
import { IStoreParams, IStoreFileParams } from '../../../types';
import { apiLogger } from '../../../services/logging';

export class PublicService {
    /**
     * Stores a JSON document in a storage service without encryption.
     *
     * @param storageService - The storage service used for uploading the document.
     * @param cryptoService - The crypto service used for generating the multibase digest.
     * @param params - An object containing the parameters for storing the document.
     * @param params.bucket - The name of the bucket where the document will be stored. Falls back to DEFAULT_BUCKET if omitted.
     * @param params.id - The optional ID of the document. If not provided, a new UUID will be generated.
     * @param params.data - The JSON object containing the document data.
     * @returns An object containing the URI of the uploaded document and the multibase digest of the document data.
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
        const logger = apiLogger.child({ service: 'PublicService', method: 'storeDocument' });
        try {
            logger.info({ bucket, id: id ?? null }, 'Validating store-document parameters');
            const resolvedBucket = bucket || DEFAULT_BUCKET;

            if (!bucket && resolvedBucket) {
                logger.info({ defaultBucket: resolvedBucket }, 'No bucket specified; falling back to DEFAULT_BUCKET');
            }

            if (!resolvedBucket) {
                logger.warn('No bucket resolved; rejecting request');
                throw new BadRequestError(
                    'Bucket is required. Please provide a bucket name, or set the DEFAULT_BUCKET environment variable.',
                );
            }

            if (!AVAILABLE_BUCKETS.includes(resolvedBucket)) {
                logger.warn({ bucket: resolvedBucket }, 'Rejected unsupported bucket');
                throw new BadRequestError(
                    `Invalid bucket. Must be one of the following buckets: ${AVAILABLE_BUCKETS.join(', ')}`,
                );
            }

            if (!isPlainObject(data)) {
                logger.warn('Rejected non-object data payload');
                throw new BadRequestError('Data must be a JSON object. Please provide a valid JSON object.');
            }

            const documentId = id || v4();

            if (!isValidUUID(documentId)) {
                logger.warn({ id: documentId }, 'Rejected invalid document id');
                throw new BadRequestError(`Invalid id ${documentId}. Please provide a valid UUID.`);
            }

            const objectName = documentId + '.json';

            logger.info({ bucket: resolvedBucket, objectName }, 'Checking object existence');
            const objectExists = await storageService.objectExists(resolvedBucket, objectName);

            if (objectExists) {
                logger.warn({ bucket: resolvedBucket, objectName }, 'Rejected duplicate document id');
                throw new ConflictError('A document with the provided ID already exists in the specified bucket.');
            }

            const stringifiedData = JSON.stringify(data);

            logger.info('Computing multibase digest');
            const digestMultibase = await cryptoService.computeDigestMultibase(stringifiedData);

            logger.info({ bucket: resolvedBucket, objectName }, 'Uploading document to storage');
            const { uri } = await storageService.uploadFile(
                resolvedBucket,
                objectName,
                stringifiedData,
                'application/json',
            );

            logger.info({ uri }, 'Public document stored successfully');
            return {
                uri,
                digestMultibase,
            };
        } catch (err: any) {
            logger.error({ err }, 'Error storing public document');

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
     * @param cryptoService - The crypto service used for generating the multibase digest.
     * @param params - An object containing the parameters for storing the file.
     * @param params.bucket - The name of the bucket where the file will be stored. Falls back to DEFAULT_BUCKET if omitted.
     * @param params.id - The optional ID of the file. If not provided, a new UUID will be generated.
     * @param params.file - The binary file content as a Buffer.
     * @param params.mimeType - The MIME type of the file.
     * @returns An object containing the URI of the uploaded file and the multibase digest of the file content.
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
        const logger = apiLogger.child({ service: 'PublicService', method: 'storeFile' });
        try {
            logger.info({ bucket, id: id ?? null, mimeType }, 'Validating store-file parameters');
            const resolvedBucket = bucket || DEFAULT_BUCKET;

            if (!bucket && resolvedBucket) {
                logger.info({ defaultBucket: resolvedBucket }, 'No bucket specified; falling back to DEFAULT_BUCKET');
            }

            if (!resolvedBucket) {
                logger.warn('No bucket resolved; rejecting request');
                throw new BadRequestError(
                    'Bucket is required. Please provide a bucket name, or set the DEFAULT_BUCKET environment variable.',
                );
            }

            if (!AVAILABLE_BUCKETS.includes(resolvedBucket)) {
                logger.warn({ bucket: resolvedBucket }, 'Rejected unsupported bucket');
                throw new BadRequestError(
                    `Invalid bucket. Must be one of the following buckets: ${AVAILABLE_BUCKETS.join(', ')}`,
                );
            }

            if (!file) {
                logger.warn('Rejected missing file');
                throw new BadRequestError('File is required. Please provide a file.');
            }

            if (!mimeType || !ALLOWED_UPLOAD_TYPES.includes(mimeType)) {
                logger.warn({ mimeType }, 'Rejected unsupported MIME type');
                throw new BadRequestError(
                    `Invalid MIME type. Must be one of the following types: ${ALLOWED_UPLOAD_TYPES.join(', ')}`,
                );
            }

            const fileId = id || v4();

            if (!isValidUUID(fileId)) {
                logger.warn({ id: fileId }, 'Rejected invalid file id');
                throw new BadRequestError(`Invalid id ${fileId}. Please provide a valid UUID.`);
            }

            const ext = extension(mimeType);

            if (!ext) {
                logger.warn({ mimeType }, 'Rejected MIME type with no resolvable file extension');
                throw new BadRequestError(`Unable to determine file extension for MIME type '${mimeType}'.`);
            }

            const objectName = `${fileId}.${ext}`;

            logger.info({ bucket: resolvedBucket, objectName }, 'Checking object existence');
            const objectExists = await storageService.objectExists(resolvedBucket, objectName);

            if (objectExists) {
                logger.warn({ bucket: resolvedBucket, objectName }, 'Rejected duplicate file id');
                throw new ConflictError('A file with the provided ID already exists in the specified bucket.');
            }

            logger.info('Computing multibase digest');
            const digestMultibase = await cryptoService.computeDigestMultibase(file);

            logger.info({ bucket: resolvedBucket, objectName }, 'Uploading file to storage');
            const { uri } = await storageService.uploadFile(resolvedBucket, objectName, file, mimeType);

            logger.info({ uri }, 'Public file stored successfully');
            return {
                uri,
                digestMultibase,
            };
        } catch (err: any) {
            logger.error({ err }, 'Error storing public file');

            if (err instanceof ApiError) {
                throw err;
            }

            throw new ApplicationError('An unexpected error occurred while storing the file.');
        }
    }
}
