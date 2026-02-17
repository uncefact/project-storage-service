import { RequestHandler } from 'express';
import { initialiseStorageService, IStorageService } from '../../services';
import { DeleteService } from './service';
import { ApiError } from '../../errors';

export const deleteResource: RequestHandler = async (req, res) => {
    try {
        const deleteService = new DeleteService();
        const storageService: IStorageService = initialiseStorageService();

        const { bucket, id } = req.params;

        await deleteService.deleteDocument(storageService, bucket, id);

        res.status(204).send();
    } catch (err: any) {
        console.error('[DeleteController.deleteResource] An error occurred while deleting the resource.', err);

        if (err instanceof ApiError) {
            return res.status(err.statusCode).json({ message: err.message });
        }

        res.status(500).json({
            message: 'An unexpected error occurred while deleting the resource.',
        });
    }
};
