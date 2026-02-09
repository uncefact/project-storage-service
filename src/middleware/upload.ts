import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import os from 'os';
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_SIZE } from '../config';
import { ApiError, BadRequestError, PayloadTooLargeError } from '../errors';

const storage = multer.diskStorage({
    destination: os.tmpdir(),
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
    if (!ALLOWED_UPLOAD_TYPES.includes(file.mimetype)) {
        return cb(
            new BadRequestError(
                `File type '${file.mimetype}' is not allowed. Allowed types: ${ALLOWED_UPLOAD_TYPES.join(', ')}`,
            ),
        );
    }
    cb(null, true);
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_UPLOAD_SIZE,
    },
});

/**
 * Conditional middleware that applies multer only for multipart/form-data requests.
 * JSON requests bypass multer entirely.
 */
export const conditionalUpload = (req: Request, res: Response, next: NextFunction) => {
    if (req.is('multipart/form-data')) {
        return (upload.single('file') as any)(req, res, next);
    }
    next();
};

/**
 * Error-handling middleware for multer upload errors.
 * Converts multer-specific errors into appropriate API errors.
 */
export const handleUploadError = (err: any, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            err = new PayloadTooLargeError(`File exceeds the maximum allowed size of ${MAX_UPLOAD_SIZE} bytes.`);
        } else {
            err = new BadRequestError(err.message);
        }
    }

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({ message: err.message });
    }

    next(err);
};
