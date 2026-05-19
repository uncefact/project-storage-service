import fs from 'fs';
import path from 'path';
import os from 'os';
import { RequestHandler } from 'express';
import { initialiseStorageService, CryptographyService, IStorageService } from '../../../services';
import { PublicService } from './service';
import { ApiError, BadRequestError } from '../../../errors';
import { apiLogger as logger, updateRequestContext } from '../../../services/logging';

const ROUTE = 'POST /api/v4/public';
const UPLOAD_DIR = path.resolve(os.tmpdir());

/**
 * Handles the request to store a public document or file.
 *
 * For multipart/form-data requests (binary uploads), reads the uploaded file
 * from the temporary path, stores it via PublicService.storeFile(), and cleans
 * up the temporary file afterwards.
 *
 * For JSON requests, extracts parameters from the request body and stores the
 * document via PublicService.storeDocument().
 *
 * @param req The request object.
 * @param res The response object.
 * @returns The response with the stored URI and multibase digest.
 */
export const storePublic: RequestHandler = async (req, res) => {
    let tempPath: string | undefined;

    try {
        updateRequestContext({ route: ROUTE });
        logger.info({ contentType: req.headers['content-type'] }, 'Handling public store request');
        const publicService = new PublicService();
        const storageService: IStorageService = initialiseStorageService();
        const cryptoService = new CryptographyService();

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

            response = await publicService.storeFile(storageService, cryptoService, {
                bucket: req.body.bucket,
                id: req.body.id,
                file: fileBuffer,
                mimeType: req.file.mimetype,
            });
        } else if (req.is('multipart/form-data')) {
            logger.warn('Rejected multipart request with no file part');
            throw new BadRequestError('File is required for multipart uploads.');
        } else {
            logger.info('Storing JSON document');
            const params = req.body;

            response = await publicService.storeDocument(storageService, cryptoService, params);
        }

        res.status(201).json(response);
    } catch (err: any) {
        logger.error({ err }, 'Error storing public resource');

        if (err instanceof ApiError) {
            return res.status(err.statusCode).json({ message: err.message });
        }

        res.status(500).json({
            message: 'An unexpected error occurred while storing the resource.',
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
