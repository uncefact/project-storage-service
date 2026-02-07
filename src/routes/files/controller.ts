import fs from 'fs';
import { RequestHandler } from 'express';
import { initialiseStorageService, CryptographyService, IStorageService } from '../../services';
import { FilesService } from './service';
import { ApiError } from '../../errors';

/**
 * Handles the request to upload a binary file.
 *
 * @param req The request object.
 * @param res The response object.
 * @returns The response with the stored file URI and hash.
 */
export const uploadFile: RequestHandler = async (req, res) => {
    let tempPath: string | undefined;

    try {
        if (!req.file) {
            return res.status(400).json({ message: 'File is required. Please upload a file.' });
        }

        tempPath = req.file.path;
        const fileBuffer = fs.readFileSync(tempPath);

        const filesService = new FilesService();
        const cryptoService = new CryptographyService();
        const storageService: IStorageService = initialiseStorageService();

        const response = await filesService.storeFile(storageService, cryptoService, {
            bucket: req.body.bucket,
            id: req.body.id,
            file: fileBuffer,
            mimeType: req.file.mimetype,
        });

        res.status(201).json(response);
    } catch (err: any) {
        console.log('[FilesController.uploadFile] An error occurred while uploading the file.', err);

        if (err instanceof ApiError) {
            return res.status(err.statusCode).json({ message: err.message });
        }

        res.status(500).json({
            message: 'An unexpected error occurred while uploading the file.',
        });
    } finally {
        if (tempPath) {
            fs.unlink(tempPath, (err) => {
                if (err) {
                    console.error(`[FilesController.uploadFile] Failed to clean up temp file ${tempPath}:`, err);
                }
            });
        }
    }
};
