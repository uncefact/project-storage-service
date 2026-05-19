import fs from 'fs';
import path from 'path';
import os from 'os';
import { RequestHandler } from 'express';
import { CryptographyService, IStorageService, initialiseStorageService } from '../../../services';
import { ApiError, BadRequestError } from '../../../errors';
import { PrivateService } from './service';
import { apiLogger } from '../../../services/logging';

const logger = apiLogger.child({ route: 'POST /api/v4/private' });
const UPLOAD_DIR = path.resolve(os.tmpdir());

/**
 * Handles the request to store private data (JSON or binary) with encryption.
 *
 * For binary uploads (multipart/form-data), the file is read from the temporary
 * path, encrypted, and stored. The temporary file is cleaned up in a finally block.
 *
 * For JSON uploads, the body parameters are passed directly to the service for
 * encryption and storage.
 *
 * @param req The request object containing either a file upload or JSON body.
 * @param res The response object.
 * @returns A JSON response with the stored item's URI, multibase digest, and decryption key on success,
 *          or an error message with an appropriate status code on failure.
 */
export const storePrivate: RequestHandler = async (req, res) => {
    let tempPath: string | undefined;

    try {
        logger.info({ contentType: req.headers['content-type'] }, 'Handling private store request');
        const privateService = new PrivateService();
        const storageService: IStorageService = initialiseStorageService();
        const cryptographyService = new CryptographyService();

        let response;

        if (req.file) {
            logger.info({ mimeType: req.file.mimetype }, 'Reading uploaded file from temp path');
            const resolvedPath = path.resolve(req.file.path);
            if (!resolvedPath.startsWith(UPLOAD_DIR + path.sep)) {
                logger.warn({ uploadPath: req.file.path }, 'Rejected upload outside permitted directory');
                throw new BadRequestError('Invalid upload path.');
            }
            tempPath = resolvedPath;
            const fileBuffer = await fs.promises.readFile(tempPath);

            response = await privateService.encryptAndStoreFile(storageService, cryptographyService, {
                bucket: req.body.bucket,
                id: req.body.id,
                file: fileBuffer,
                mimeType: req.file.mimetype,
            });
        } else if (req.is('multipart/form-data')) {
            logger.warn('Rejected multipart request with no file part');
            throw new BadRequestError('File is required for multipart uploads.');
        } else {
            logger.info('Encrypting and storing JSON document');
            const params = req.body;

            response = await privateService.encryptAndStoreDocument(storageService, cryptographyService, params);
        }

        res.status(201).json(response);
    } catch (err: any) {
        logger.error({ err }, 'Error storing private data');

        if (err instanceof ApiError) {
            return res.status(err.statusCode).json({ message: err.message });
        }

        res.status(500).json({
            message: 'An unexpected error occurred while storing private data.',
        });
    } finally {
        if (tempPath && tempPath.startsWith(UPLOAD_DIR + path.sep)) {
            try {
                await fs.promises.unlink(tempPath);
            } catch (cleanupErr: any) {
                if (cleanupErr.code !== 'ENOENT') {
                    logger.error({ tempPath, err: cleanupErr }, 'Failed to clean up temp file');
                }
            }
        }
    }
};
