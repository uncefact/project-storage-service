import { Router } from 'express';
import { deleteResource } from './controller';
import { authenticateRequest } from '../../middleware/authentication';

export const deleteRouter = Router();

deleteRouter.delete('/:bucket/:id', authenticateRequest, deleteResource as any);
