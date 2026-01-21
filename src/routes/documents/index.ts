import { Router } from 'express';
import { storeDocument } from './controller';
import { authenticateRequest } from '../../middleware/authentication';

export const documentsRouter = Router();

documentsRouter.post('/', authenticateRequest, storeDocument);
