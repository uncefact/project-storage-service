import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import bodyParser from 'body-parser';
import { API_VERSION } from './config';
import { router } from './routes';
import swaggerDocument from './swagger/swagger.json';
import { updateSwagger } from './swagger/helpers';

export const app = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(updateSwagger(swaggerDocument)));

app.use(cors());

// Update limit to 50mb to allow for large data uploads
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json());

app.get('/health-check', (req, res) => {
    res.send('OK');
});

app.use(`/${API_VERSION}`, router);
