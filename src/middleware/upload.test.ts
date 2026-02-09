import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ApiError, BadRequestError, PayloadTooLargeError } from '../errors';

jest.mock('../config', () => ({
    ALLOWED_UPLOAD_TYPES: ['image/png', 'image/jpeg', 'application/pdf'],
    MAX_UPLOAD_SIZE: 10485760,
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
import { conditionalUpload, handleUploadError, upload } from './upload';

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

    describe('conditionalUpload', () => {
        it('should call next() immediately when the request is not multipart/form-data', () => {
            mockRequest.is = jest.fn().mockReturnValue(false);

            conditionalUpload(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockRequest.is).toHaveBeenCalledWith('multipart/form-data');
            expect(mockNext).toHaveBeenCalled();
        });

        it('should invoke multer upload.single when the request is multipart/form-data', () => {
            const mockMulterMiddleware = jest.fn();
            const singleSpy = jest.spyOn(upload, 'single').mockReturnValue(mockMulterMiddleware as any);
            mockRequest.is = jest.fn().mockReturnValue('multipart/form-data');

            conditionalUpload(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockRequest.is).toHaveBeenCalledWith('multipart/form-data');
            expect(singleSpy).toHaveBeenCalledWith('file');
            expect(mockMulterMiddleware).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
            expect(mockNext).not.toHaveBeenCalled();

            singleSpy.mockRestore();
        });
    });

    describe('handleUploadError', () => {
        it('should respond with 413 JSON for LIMIT_FILE_SIZE MulterError', () => {
            const multerError = new multer.MulterError('LIMIT_FILE_SIZE');

            handleUploadError(multerError, mockRequest as any, mockResponse as any, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(413);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: expect.stringContaining('maximum allowed size'),
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should respond with 400 JSON for other MulterErrors', () => {
            const multerError = new multer.MulterError('LIMIT_UNEXPECTED_FILE');

            handleUploadError(multerError, mockRequest as any, mockResponse as any, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: expect.any(String),
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should respond with JSON for ApiError instances (e.g. fileFilter rejection)', () => {
            const badRequestError = new BadRequestError("File type 'application/zip' is not allowed.");

            handleUploadError(badRequestError, mockRequest as any, mockResponse as any, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: expect.stringContaining('not allowed'),
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should pass unknown errors through to next', () => {
            const genericError = new Error('Something went wrong');

            handleUploadError(genericError, mockRequest as any, mockResponse as any, mockNext);

            expect(mockNext).toHaveBeenCalledWith(genericError);
        });
    });
});
