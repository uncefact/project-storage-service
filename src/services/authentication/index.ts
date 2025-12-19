import { Request } from 'express';

export interface AuthResult {
    authenticated: boolean;
    error?: string;
}

export interface IAuthenticationService {
    /**
     * Authenticates a request.
     * @param request The Express request object.
     * @returns A promise that resolves with the authentication result.
     */
    authenticate(request: Request): Promise<AuthResult>;
}

export * from './apiKey';

