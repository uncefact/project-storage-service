import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import os from 'os';
import { ALLOWED_BINARY_TYPES, MAX_BINARY_FILE_SIZE } from '../config';
import { ApiError, BadRequestError, PayloadTooLargeError } from '../errors';

const storage = multer.diskStorage({
    destination: os.tmpdir(),
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
    if (!ALLOWED_BINARY_TYPES.includes(file.mimetype)) {
        return cb(new BadRequestError(`File type '${file.mimetype}' is not allowed. Allowed types: ${ALLOWED_BINARY_TYPES.join(', ')}`));
    }
    cb(null, true);
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_BINARY_FILE_SIZE,
    },
});

/**
 * Error-handling middleware for multer upload errors.
 * Converts multer-specific errors into appropriate API errors.
 */
export const handleUploadError = (err: any, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            err = new PayloadTooLargeError(`File exceeds the maximum allowed size of ${MAX_BINARY_FILE_SIZE} bytes.`);
        } else {
            err = new BadRequestError(err.message);
        }
    }

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({ message: err.message });
    }

    next(err);
};
