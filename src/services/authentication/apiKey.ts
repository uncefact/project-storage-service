import crypto from 'crypto';
import { Request } from 'express';
import { AuthResult, IAuthenticationService } from '.';
import { AUTH_HEADER_NAME, getApiKey } from '../../config';

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

        // Validate the API key
        const apiKey = getApiKey();

        const invalidKeyResponse = {
            authenticated: false,
            error: 'Invalid API key. Please provide a valid API key.',
        } as const;

        if (!apiKey) {
            return invalidKeyResponse;
        }

        const keyBuffer = Buffer.from(apiKey);
        const providedKeyBuffer = Buffer.from(providedKey);

        // Use a constant-time comparison to prevent timing attacks.
        // If lengths don't match, crypto.timingSafeEqual will throw, so we catch it.
        try {
            if (!crypto.timingSafeEqual(keyBuffer, providedKeyBuffer)) {
                return invalidKeyResponse;
            }
        } catch (err: unknown) {
            console.error('[ApiKeyAuthenticationService] Error comparing API keys:', err);

            return invalidKeyResponse;
        }

        return { authenticated: true };
    }
}

