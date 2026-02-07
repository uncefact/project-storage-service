import { Router } from 'express';
import { authenticateRequest } from '../../middleware/authentication';
import { upload, handleUploadError } from '../../middleware/upload';
import { uploadFile } from './controller';

export const filesRouter = Router();

// Cast middlewares to `any` to work around conflicting Express type definitions
// from @types/express vs swagger-ui-express's bundled types (pre-existing project issue).
filesRouter.post('/', authenticateRequest, upload.single('file') as any, handleUploadError as any, uploadFile as any);
