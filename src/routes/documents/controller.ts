import { RequestHandler } from 'express';
import { initialiseStorageService, CryptographyService, IStorageService } from '../../services';
import { DocumentsService } from './service';
import { ApiError } from '../../errors';

/**
 * Handles the request to a store document.
 *
 * @param req The request object.
 * @param res The response object.
 * @returns The response with the stored documents URI and hash.
 */
export const storeDocument: RequestHandler = async (req, res) => {
    try {
        const params = req.body;

        const documentsService = new DocumentsService();
        const cryptoService = new CryptographyService();
        const storageService: IStorageService = initialiseStorageService();

        const response = await documentsService.storeDocument(storageService, cryptoService, params);

        res.status(201).json(response);
    } catch (err: any) {
        console.log('[DocumentsController.storeDocument] An error occurred while storing the document.', err);

        if (err instanceof ApiError) {
            return res.status(err.statusCode).json({ message: err.message });
        }

        res.status(500).json({
            message: 'An unexpected error occurred while storing the document.',
        });
    }
};
