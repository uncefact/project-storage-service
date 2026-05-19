import { RequestHandler } from 'express';
import { initialiseStorageService, IStorageService } from '../../../services';
import { DeleteService } from './service';
import { ApiError } from '../../../errors';
import { apiLogger as logger, updateRequestContext } from '../../../services/logging';

const ROUTE = 'DELETE /api/v4/:bucket/:id';

export const deleteResource: RequestHandler = async (req, res) => {
    const { bucket, id } = req.params;
    try {
        updateRequestContext({ route: ROUTE });
        logger.info({ bucket, id }, 'Handling delete request');
        const deleteService = new DeleteService();
        const storageService: IStorageService = initialiseStorageService();

        await deleteService.deleteDocument(storageService, bucket, id);

        res.status(204).send();
    } catch (err: any) {
        logger.error({ err }, 'Error deleting resource');

        if (err instanceof ApiError) {
            return res.status(err.statusCode).json({ message: err.message });
        }

        res.status(500).json({
            message: 'An unexpected error occurred while deleting the resource.',
        });
    }
};
