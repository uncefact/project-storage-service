import { isPlainObject } from 'lodash';
import { v4 } from 'uuid';
import { IStorageService, ICryptographyService } from '../../services';
import { AVAILABLE_BUCKETS, ALLOWED_UPLOAD_TYPES, DEFAULT_BUCKET } from '../../config';
import { IStoreParams, IStoreFileParams } from '../../types';
import { isValidUUID } from '../../utils';
import { ApiError, ApplicationError, BadRequestError, ConflictError } from '../../errors';

export class PrivateService {
    /**
     * Encrypts and stores a JSON document in a storage service.
     *
     * The document is stringified, hashed, encrypted with a generated key, and stored
     * as a JSON envelope containing the cipher text, IV, auth tag, encryption type,
     * and content type.
     *
     * @param storageService - The storage service used for uploading the encrypted document.
     * @param cryptographyService - The cryptography service used for hashing, key generation, and encryption.
     * @param params - An object containing the following properties:
     * @param params.bucket - The name of the bucket where the document will be stored. Falls back to DEFAULT_BUCKET if omitted.
     * @param params.id - (Optional) The identifier for the document. If not provided, a UUID will be generated.
     * @param params.data - The data to be encrypted and stored. Must be a plain object.
     * @returns An object containing the URI of the uploaded file, the hash of the data, and the decryption key.
     * @throws {BadRequestError} If no bucket is resolved (neither provided nor configured via DEFAULT_BUCKET), or if the bucket is invalid.
     * @throws {BadRequestError} If the data is not a plain object.
     * @throws {BadRequestError} If the provided ID is not a valid UUID.
     * @throws {ConflictError} If a document with the same ID already exists in the bucket.
     * @throws {ApplicationError} If an unexpected error occurs during encryption or storage.
     */
    public async encryptAndStoreDocument(
        storageService: IStorageService,
        cryptographyService: ICryptographyService,
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

            const hash = cryptographyService.computeHash(stringifiedData);

            const key = await cryptographyService.generateEncryptionKey();

            const encryptedData = cryptographyService.encryptString(stringifiedData, key);

            const envelope = { ...encryptedData, contentType: 'application/json' };

            const encryptedDocument = JSON.stringify(envelope);

            const { uri } = await storageService.uploadFile(
                resolvedBucket,
                objectName,
                encryptedDocument,
                'application/json',
            );

            return {
                uri,
                hash,
                decryptionKey: key,
            };
        } catch (err: any) {
            console.error(
                '[PrivateService.encryptAndStoreDocument] An error occurred while encrypting and storing the document.',
                err,
            );

            if (err instanceof ApiError) {
                throw err;
            }

            throw new ApplicationError('An unexpected error occurred while encrypting and storing the document.');
        }
    }

    /**
     * Encrypts and stores a binary file in a storage service.
     *
     * The file buffer is hashed (before encoding), base64-encoded, encrypted with a
     * generated key, and stored as a JSON envelope containing the cipher text, IV,
     * auth tag, encryption type, and content type. The encrypted file is always stored
     * with a `.json` extension because the envelope is JSON, regardless of the original
     * file's MIME type.
     *
     * @param storageService - The storage service used for uploading the encrypted file.
     * @param cryptographyService - The cryptography service used for hashing, key generation, and encryption.
     * @param params - An object containing the following properties:
     * @param params.bucket - The name of the bucket where the file will be stored. Falls back to DEFAULT_BUCKET if omitted.
     * @param params.id - (Optional) The identifier for the file. If not provided, a UUID will be generated.
     * @param params.file - The binary file content as a Buffer.
     * @param params.mimeType - The MIME type of the file.
     * @returns An object containing the URI of the uploaded file, the hash of the original file, and the decryption key.
     * @throws {BadRequestError} If no bucket is resolved (neither provided nor configured via DEFAULT_BUCKET), or if the bucket is invalid.
     * @throws {BadRequestError} If the file is not provided.
     * @throws {BadRequestError} If the MIME type is missing or not in the allowed types.
     * @throws {BadRequestError} If the provided ID is not a valid UUID.
     * @throws {ConflictError} If a file with the same ID already exists in the bucket.
     * @throws {ApplicationError} If an unexpected error occurs during encryption or storage.
     */
    public async encryptAndStoreFile(
        storageService: IStorageService,
        cryptographyService: ICryptographyService,
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

            const objectName = fileId + '.json';

            const objectExists = await storageService.objectExists(resolvedBucket, objectName);

            if (objectExists) {
                throw new ConflictError('A file with the provided ID already exists in the specified bucket.');
            }

            const hash = cryptographyService.computeHash(file);

            const base64Data = file.toString('base64');

            const key = await cryptographyService.generateEncryptionKey();

            const encryptedData = cryptographyService.encryptString(base64Data, key);

            const envelope = { ...encryptedData, contentType: mimeType };

            const encryptedDocument = JSON.stringify(envelope);

            const { uri } = await storageService.uploadFile(
                resolvedBucket,
                objectName,
                encryptedDocument,
                'application/json',
            );

            return {
                uri,
                hash,
                decryptionKey: key,
            };
        } catch (err: any) {
            console.error(
                '[PrivateService.encryptAndStoreFile] An error occurred while encrypting and storing the file.',
                err,
            );

            if (err instanceof ApiError) {
                throw err;
            }

            throw new ApplicationError('An unexpected error occurred while encrypting and storing the file.');
        }
    }
}
