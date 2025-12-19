import { Request } from 'express';
import { AuthResult, IAuthenticationService } from '.';
import { getApiKey, AUTH_HEADER_NAME } from '../../config';

export class ApiKeyAuthenticationService implements IAuthenticationService {
    /**
     * Authenticates a request using API key validation.
     * @param request The Express request object.
     * @returns A promise that resolves with the authentication result.
     */
    async authenticate(request: Request): Promise<AuthResult> {
        // Get the API key from the request header
        const providedKey = request.headers[AUTH_HEADER_NAME] as string;

        // Check if the API key is missing
        if (!providedKey) {
            return {
                authenticated: false,
                error: 'API key is required. Please provide a valid API key in the X-API-Key header.',
            };
        }

        // Validate the API key - get it at runtime
        const apiKey = getApiKey();
        if (providedKey !== apiKey) {
            return {
                authenticated: false,
                error: 'Invalid API key. Please provide a valid API key.',
            };
        }

        return { authenticated: true };
    }
}

