import { Router } from 'express';
import { storePublic } from './controller';
import { authenticateRequest } from '../../middleware/authentication';
import { conditionalUpload, handleUploadError } from '../../middleware/upload';

export const publicRouter = Router();

publicRouter.post('/', authenticateRequest, conditionalUpload as any, handleUploadError as any, storePublic as any);
