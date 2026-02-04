import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import bodyParser from 'body-parser';
import { router } from './routes';
import swaggerDocument from './swagger/swagger.json';
import { updateSwagger } from './swagger/helpers';
import { API_VERSION, DOMAIN, PORT, PROTOCOL } from './config';

export const app = express();

let swaggerJson: any = { ...swaggerDocument };

app.use(
    '/api-docs',
    (req: any, res: any, next: any) => {
        // Build the Swagger server URL from config rather than request internals (req.protocol,
        // req.hostname, req.socket.localPort) which reflect the container's internal address.
        // Omit default ports (443 for HTTPS, 80 for HTTP) to produce standard URLs.
        const isDefaultPort =
            (PROTOCOL === 'https' && String(PORT) === '443') || (PROTOCOL === 'http' && String(PORT) === '80');
        const portSuffix = isDefaultPort ? '' : `:${PORT}`;
        const url = `${PROTOCOL}://${DOMAIN}${portSuffix}/api/${API_VERSION}`;
        swaggerJson = updateSwagger(swaggerJson, { version: API_VERSION, url });
        req.swaggerDoc = swaggerJson;
        next();
    },
    swaggerUi.serveFiles(swaggerJson, {}) as any,
    swaggerUi.setup() as any,
);

app.use(cors());

// Update limit to 50mb to allow for large data uploads
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json());

app.get('/health-check', (req, res) => {
    res.send('OK');
});

app.use(`/api/${API_VERSION}`, router);
