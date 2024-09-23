import { RequestHandler } from 'express';
import { CryptographyService, IStorageService, initialiseStorageService } from '../../services';
import { ApiError } from '../../errors';
import { CredentialsService } from './service';

/**
 * Handles the request to store a credential.
 *
 * @param req The request object containing the credential data in the body.
 * @param res The response object.
 * @returns A JSON response with the stored credential's URI, hash, and key on success,
 *          or an error message with an appropriate status code on failure.
 */
export const storeCredential: RequestHandler = async (req, res) => {
    try {
        const params = req.body;

        const credentialsService = new CredentialsService();
        const storageService: IStorageService = initialiseStorageService();
        const cryptographyService = new CryptographyService();

        const response = await credentialsService.encryptAndStoreCredential(
            cryptographyService,
            storageService,
            params,
        );

        res.status(201).json(response);
    } catch (err: any) {
        console.log('[CredentialsController.storeCredential] An error occurred while storing the credential.', err);

        if (err instanceof ApiError) {
            return res.status(err.statusCode).json({ message: err.message });
        }

        res.status(500).json({
            message: 'An unexpected error occurred while storing the credential.',
        });
    }
};
