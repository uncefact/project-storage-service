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

// @types/multer 2.0.0 predates the two field-name limits, so they are declared here
// rather than cast away. multer 2.5.0 validates and enforces both at runtime.
const limits: multer.Options['limits'] & { fieldNestingDepth: number; fieldArrayIndexLimit: number } = {
    fileSize: MAX_UPLOAD_SIZE,
    // The upload routes accept only the flat fields `bucket`, `id` and `file`.
    // GHSA-72gw-mp4g-v24j: append-field builds nested objects from bracketed names
    // with no depth bound. One level is allowed because multer checks depth first, and
    // at 0 every indexed name would be rejected before the array index limit below runs.
    // One level cannot build a deep structure.
    fieldNestingDepth: 1,
    // GHSA-535w-7cp7-47q4: a large index such as `items[4294967294]`, followed by a
    // non-numeric key on the same base, makes append-field iterate the whole sparse
    // array synchronously. No field here is an array, so only index 0 is accepted.
    fieldArrayIndexLimit: 0,
};

export const upload = multer({
    storage,
    fileFilter,
    limits,
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
