import { Request } from 'express';

jest.mock('../../config', () => ({
    getApiKey: jest.fn(() => process.env.API_KEY),
    AUTH_HEADER_NAME: 'x-api-key',
}));

import { ApiKeyAuthenticationService } from './apiKey';

describe('ApiKeyAuthenticationService', () => {
    let authService: ApiKeyAuthenticationService;
    let mockRequest: Partial<Request>;
    const originalApiKey = process.env.API_KEY;

    beforeEach(() => {
        // Set API_KEY for each test
        process.env.API_KEY = 'test-api-key';
        authService = new ApiKeyAuthenticationService();
        mockRequest = {
            headers: {},
        };
    });

    afterAll(() => {
        process.env.API_KEY = originalApiKey;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('authenticate', () => {
        it('should return authenticated false when API key is missing from headers', async () => {
            const result = await authService.authenticate(mockRequest as Request);

            expect(result.authenticated).toBe(false);
            expect(result.error).toBe(
                'API key is required. Please provide a valid API key in the X-API-Key header.',
            );
        });

        it('should return authenticated false when API key is invalid', async () => {
            mockRequest.headers = {
                'x-api-key': 'invalid-key',
            };

            const result = await authService.authenticate(mockRequest as Request);

            expect(result.authenticated).toBe(false);
            expect(result.error).toBe('Invalid API key. Please provide a valid API key.');
        });

        it('should return authenticated true when API key is valid', async () => {
            const validKey = 'valid-api-key';
            process.env.API_KEY = validKey;

            mockRequest.headers = {
                'x-api-key': validKey,
            };

            const result = await authService.authenticate(mockRequest as Request);

            expect(result.authenticated).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('should handle header name case insensitivity', async () => {
            const validKey = 'valid-api-key';
            process.env.API_KEY = validKey;

            // Express normalizes headers to lowercase
            mockRequest.headers = {
                'x-api-key': validKey,
            };

            const result = await authService.authenticate(mockRequest as Request);

            expect(result.authenticated).toBe(true);
        });
    });
});

