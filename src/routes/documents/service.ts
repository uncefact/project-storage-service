import { isPlainObject } from 'lodash';
import { v4 } from 'uuid';
import { IStorageService, CryptographyService } from '../../services';
import { ApiError, ApplicationError, BadRequestError, ConflictError } from '../../errors';
import { AVAILABLE_BUCKETS } from '../../config';
import { isValidUUID } from '../../utils';
import { IStoreParams } from '../../types';

export class DocumentsService {
    /**
     * Stores a document in a storage service.
     * @param storageService - The storage service used for uploading the document.
     * @param cryptoService - The crypto service used for generating the hash.
     * @param params - An object containing the parameters for storing the document.
     * @param params.bucket - The name of the bucket where the document will be stored.
     * @param params.id - The optional ID of the document. If not provided, a new UUID will be generated.
     * @param params.data - The JSON object containing the document data.
     * @returns An object containing the URI of the uploaded file and the hash of the document data.
     * @throws {BadRequestError} If the bucket is not provided, is invalid, or if the data is not a JSON object.
     * @throws {BadRequestError} If the provided ID is not a valid UUID.
     * @throws {ConflictError} If a document with the provided ID already exists in the specified bucket.
     * @throws {ApplicationError} If an unexpected error occurs while storing the document.
     */
    public async storeDocument(
        storageService: IStorageService,
        cryptoService: CryptographyService,
        { bucket, id, data }: IStoreParams,
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

            if (!isPlainObject(data)) {
                throw new BadRequestError('Data must be a JSON object. Please provide a valid JSON object.');
            }

            const credentialId = id || v4();

            if (!isValidUUID(credentialId)) {
                throw new BadRequestError(`Invalid id ${credentialId}. Please provide a valid UUID.`);
            }

            const objectExists = await storageService.objectExists(bucket, credentialId + '.json');

            if (objectExists) {
                throw new ConflictError('A document with the provided ID already exists in the specified bucket.');
            }

            const stringifiedData = JSON.stringify(data);

            const hash = cryptoService.computeHash(stringifiedData);

            const objectName = credentialId + '.json';

            const { uri } = await storageService.uploadFile(bucket, objectName, stringifiedData, 'application/json');

            return {
                uri,
                hash,
            };
        } catch (err: any) {
            console.error('[DocumentsService.storeDocument] An error occurred while storing the document.', err);

            if (err instanceof ApiError) {
                throw err;
            }

            throw new ApplicationError('An unexpected error occurred while storing the document.');
        }
    }
}
