import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { BadRequestError, PayloadTooLargeError } from '../errors';

jest.mock('../config', () => ({
    ALLOWED_BINARY_TYPES: ['image/png', 'image/jpeg', 'application/pdf'],
    MAX_BINARY_FILE_SIZE: 10485760,
}));

// Capture the fileFilter passed to multer when the upload module initialises.
let capturedFileFilter: multer.Options['fileFilter'];

jest.mock('multer', () => {
    const actual = jest.requireActual('multer');

    const multerFn = (options: multer.Options) => {
        capturedFileFilter = options.fileFilter;
        return actual(options);
    };

    multerFn.memoryStorage = actual.memoryStorage;
    multerFn.diskStorage = actual.diskStorage;
    multerFn.MulterError = actual.MulterError;

    return {
        __esModule: true,
        default: multerFn,
    };
});

// This import triggers the multer mock above, capturing the fileFilter.
import { handleUploadError } from './upload';

describe('Upload Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('fileFilter', () => {
        it('should accept files with allowed MIME types', () => {
            const cb = jest.fn();
            const file = { mimetype: 'image/png' } as Express.Multer.File;

            capturedFileFilter!(mockRequest as any, file, cb);

            expect(cb).toHaveBeenCalledWith(null, true);
        });

        it('should accept another allowed MIME type', () => {
            const cb = jest.fn();
            const file = { mimetype: 'application/pdf' } as Express.Multer.File;

            capturedFileFilter!(mockRequest as any, file, cb);

            expect(cb).toHaveBeenCalledWith(null, true);
        });

        it('should reject files with disallowed MIME types', () => {
            const cb = jest.fn();
            const file = { mimetype: 'application/zip' } as Express.Multer.File;

            capturedFileFilter!(mockRequest as any, file, cb);

            expect(cb).toHaveBeenCalledWith(expect.any(BadRequestError));
            const error = cb.mock.calls[0][0] as BadRequestError;
            expect(error.message).toContain('application/zip');
            expect(error.message).toContain('not allowed');
        });
    });

    describe('handleUploadError', () => {
        it('should convert LIMIT_FILE_SIZE MulterError to PayloadTooLargeError', () => {
            const multerError = new multer.MulterError('LIMIT_FILE_SIZE');

            handleUploadError(multerError, mockRequest as any, mockResponse as any, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(PayloadTooLargeError));
            const passedError = (mockNext as jest.Mock).mock.calls[0][0] as PayloadTooLargeError;
            expect(passedError.statusCode).toBe(413);
        });

        it('should convert other MulterError to BadRequestError', () => {
            const multerError = new multer.MulterError('LIMIT_UNEXPECTED_FILE');

            handleUploadError(multerError, mockRequest as any, mockResponse as any, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
            const passedError = (mockNext as jest.Mock).mock.calls[0][0] as BadRequestError;
            expect(passedError.statusCode).toBe(400);
        });

        it('should pass non-multer errors through to next', () => {
            const genericError = new Error('Something went wrong');

            handleUploadError(genericError, mockRequest as any, mockResponse as any, mockNext);

            expect(mockNext).toHaveBeenCalledWith(genericError);
        });
    });
});
