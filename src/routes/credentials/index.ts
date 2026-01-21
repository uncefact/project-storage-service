import { Router } from 'express';
import { storeCredential } from './controller';
import { authenticateRequest } from '../../middleware/authentication';

export const credentialsRouter = Router();

credentialsRouter.post('/', authenticateRequest, storeCredential);
