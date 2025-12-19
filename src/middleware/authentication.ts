import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../errors';
import { ApiKeyAuthenticationService } from '../services/authentication';

/**
 * Middleware to authenticate requests using API key authentication.
 * If authentication fails, returns a 401 Unauthorized response.
 *
 * @param req The Express request object.
 * @param res The Express response object.
 * @param next The next middleware function.
 */
export const authenticateRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authService = new ApiKeyAuthenticationService();
        const result = await authService.authenticate(req);

        if (!result.authenticated) {
            throw new UnauthorizedError(result.error || 'Authentication failed.');
        }

        next();
    } catch (err: any) {
        console.log('[AuthenticationMiddleware] Authentication failed.', err);

        if (err instanceof UnauthorizedError) {
            return res.status(err.statusCode).json({ message: err.message });
        }

        res.status(500).json({
            message: 'An unexpected error occurred during authentication.',
        });
    }
};

