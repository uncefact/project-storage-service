import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../errors';
import { ApiKeyAuthenticationService } from '../services/authentication';
import { authenticateRequest } from './authentication';

// Mock the ApiKeyAuthenticationService
jest.mock('../services/authentication', () => ({
    ApiKeyAuthenticationService: jest.fn(),
}));

describe('Authentication Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;
    let mockAuthService: jest.Mocked<ApiKeyAuthenticationService>;

    beforeEach(() => {
        mockRequest = {
            headers: {},
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        mockNext = jest.fn();

        mockAuthService = {
            authenticate: jest.fn(),
        } as any;

        (ApiKeyAuthenticationService as jest.MockedClass<typeof ApiKeyAuthenticationService>).mockImplementation(
            () => mockAuthService,
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('authenticateRequest', () => {
        it('should call next() when authentication is successful', async () => {
            mockAuthService.authenticate.mockResolvedValue({
                authenticated: true,
            });

            await authenticateRequest(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockAuthService.authenticate).toHaveBeenCalledWith(mockRequest);
            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should return 401 when authentication fails', async () => {
            const errorMessage = 'API key is required. Please provide a valid API key in the X-API-Key header.';
            mockAuthService.authenticate.mockResolvedValue({
                authenticated: false,
                error: errorMessage,
            });

            await authenticateRequest(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockAuthService.authenticate).toHaveBeenCalledWith(mockRequest);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: errorMessage,
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 when authentication fails without error message', async () => {
            mockAuthService.authenticate.mockResolvedValue({
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
            mockAuthService.authenticate.mockRejectedValue(new UnauthorizedError(errorMessage));

            await authenticateRequest(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: errorMessage,
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle unexpected errors', async () => {
            mockAuthService.authenticate.mockRejectedValue(new Error('Unexpected error'));

            await authenticateRequest(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'An unexpected error occurred during authentication.',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
});

