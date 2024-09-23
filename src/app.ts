import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import express from 'express';
import { API_VERSION } from './config';
import { router } from './routes';

export const app = express();

app.use(cors());

app.use(express.json());

app.get('/health-check', (req, res) => {
    res.send('OK');
});

app.use(`/${API_VERSION}`, router);
