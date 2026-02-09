import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../errors';

const mockAuthenticate = jest.fn();

jest.mock('../services/authentication', () => ({
    ApiKeyAuthenticationService: jest.fn().mockImplementation(() => ({
        authenticate: mockAuthenticate,
    })),
}));

import { authenticateRequest } from './authentication';

describe('Authentication Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockRequest = {
            headers: {},
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        mockNext = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('authenticateRequest', () => {
        it('should call next() when authentication is successful', async () => {
            mockAuthenticate.mockResolvedValue({
                authenticated: true,
            });

            await authenticateRequest(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockAuthenticate).toHaveBeenCalledWith(mockRequest);
            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should return 401 when authentication fails', async () => {
            const errorMessage = 'API key is required. Please provide a valid API key in the X-API-Key header.';
            mockAuthenticate.mockResolvedValue({
                authenticated: false,
                error: errorMessage,
            });

            await authenticateRequest(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockAuthenticate).toHaveBeenCalledWith(mockRequest);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: errorMessage,
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 when authentication fails without error message', async () => {
            mockAuthenticate.mockResolvedValue({
                authenticated: false,
            });

            await authenticateRequest(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Authentication failed.',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle UnauthorizedError thrown by auth service', async () => {
            const errorMessage = 'Invalid API key';
            mockAuthenticate.mockRejectedValue(new UnauthorizedError(errorMessage));

            await authenticateRequest(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: errorMessage,
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle unexpected errors', async () => {
            mockAuthenticate.mockRejectedValue(new Error('Unexpected error'));

            await authenticateRequest(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'An unexpected error occurred during authentication.',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
});
