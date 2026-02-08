import { Router } from 'express';
import { storePrivate } from './controller';
import { authenticateRequest } from '../../middleware/authentication';
import { conditionalUpload, handleUploadError } from '../../middleware/upload';

export const privateRouter = Router();

privateRouter.post('/', authenticateRequest, conditionalUpload as any, handleUploadError as any, storePrivate as any);
