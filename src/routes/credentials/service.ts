import { isPlainObject } from 'lodash';
import { v4 } from 'uuid';
import { IStorageService, ICryptographyService } from '../../services';
import { AVAILABLE_BUCKETS } from '../../config';
import { IStoreParams } from '../../types';
import { isValidUUID } from '../../utils';
import { ApiError, ApplicationError, BadRequestError, ConflictError } from '../../errors';

export class CredentialsService {
    /**
     * Encrypts and stores credentials in a storage service.
     * @param cryptographyService - The cryptography service used for encryption and key generation.
     * @param storageService - The storage service used for uploading the encrypted credentials.
     * @param params - An object containing the following properties:
     * @param params.bucket - The name of the bucket where the credentials will be stored.
     * @param params.id - (Optional) The identifier for the credentials. If not provided, a UUID will be generated.
     * @param params.data - The data to be encrypted and stored. Must be a plain object.
     * @returns An object containing the URI of the uploaded file, the hash of the data, and the decryption key.
     * @throws {Error} If the bucket is not provided or is invalid.
     * @throws {Error} If the data is not a plain object.
     * @throws {Error} If an object with the same ID already exists in the bucket.
     * @throws {Error} If the provided ID is not a valid UUID.
     */

    public async encryptAndStoreCredential(
        cryptographyService: ICryptographyService,
        storageService: IStorageService,
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

            const hash = cryptographyService.computeHash(stringifiedData);

            const key = cryptographyService.generateEncryptionKey();

            const encryptedData = cryptographyService.encryptString(stringifiedData, key);

            const objectName = credentialId + '.json';

            const encryptedDocument = JSON.stringify(encryptedData);

            const { uri } = await storageService.uploadFile(bucket, objectName, encryptedDocument, 'application/json');

            return {
                uri,
                hash,
                key,
            };
        } catch (err: any) {
            console.error(
                '[CredentialsService.encryptAndStoreCredential] An error occurred while encrypting and storing the credential.',
                err,
            );

            if (err instanceof ApiError) {
                throw err;
            }

            throw new ApplicationError('An unexpected error occurred while encrypting and storing the document.');
        }
    }
}
