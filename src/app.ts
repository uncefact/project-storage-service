import cors from 'cors';
import express, { Request, Response, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express';
import bodyParser from 'body-parser';
import { router } from './routes';
import swaggerDocument from './swagger/swagger.json';
import { updateSwagger } from './swagger/helpers';
import { API_VERSION, DOMAIN, EXTERNAL_PORT, MAX_UPLOAD_SIZE, PROTOCOL } from './config';
import { buildBaseUrl } from './utils';
import { apiLogger as logger } from './services/logging';
import { correlationIdMiddleware } from './middleware/correlation-id';

export const app = express();

// Correlation ID middleware runs FIRST so every downstream handler and every
// log line (via the registered request-context provider) carries the id.
app.use(correlationIdMiddleware(logger));

let swaggerJson: any = { ...swaggerDocument };

app.use(
    '/api-docs',
    (req: any, res: any, next: any) => {
        // Build the Swagger server URL from config rather than request internals (req.protocol,
        // req.hostname, req.socket.localPort) which reflect the container's internal address.
        const url = buildBaseUrl(PROTOCOL, DOMAIN, EXTERNAL_PORT, 'api/v4');
        swaggerJson = updateSwagger(swaggerJson, { version: API_VERSION, url });
        req.swaggerDoc = swaggerJson;
        next();
    },
    swaggerUi.serveFiles(swaggerJson, {}) as any,
    swaggerUi.setup() as any,
);

app.use(cors());

app.use(bodyParser.json({ limit: MAX_UPLOAD_SIZE }));
app.use(bodyParser.urlencoded({ limit: MAX_UPLOAD_SIZE, extended: true }));

app.get('/health-check', (req, res) => {
    res.send('OK');
});

app.use('/api', router);

// Global error handler for unhandled errors. Includes `method` and `path` so
// operators digging into a 500 know which route fired; `correlationId` is
// added automatically by Pino's mixin.
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    logger.error({ err, method: req.method, path: req.originalUrl }, '[GlobalErrorHandler] Unhandled error');
    res.status(500).json({
        message: 'An unexpected error occurred.',
    });
});
