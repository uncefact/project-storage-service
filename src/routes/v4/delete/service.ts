import { IStorageService } from '../../../services';
import { ApiError, ApplicationError, BadRequestError, NotFoundError } from '../../../errors';
import { AVAILABLE_BUCKETS } from '../../../config';
import { isValidUUID } from '../../../utils';
import { apiLogger } from '../../../services/logging';

export class DeleteService {
    public async deleteDocument(storageService: IStorageService, bucket: string, id: string): Promise<void> {
        const logger = apiLogger.child({ service: 'DeleteService', method: 'deleteDocument' });
        try {
            logger.info({ bucket, id }, 'Validating delete parameters');

            if (!AVAILABLE_BUCKETS.includes(bucket)) {
                logger.warn({ bucket }, 'Rejected unsupported bucket');
                throw new BadRequestError(
                    `Invalid bucket. Must be one of the following buckets: ${AVAILABLE_BUCKETS.join(', ')}`,
                );
            }

            if (!isValidUUID(id)) {
                logger.warn({ id }, 'Rejected invalid resource id');
                throw new BadRequestError(`Invalid id ${id}. Please provide a valid UUID.`);
            }

            logger.info({ bucket, id }, 'Listing objects by prefix');
            const matchingKeys = await storageService.listObjectsByPrefix(bucket, id);

            if (matchingKeys.length === 0) {
                logger.warn({ bucket, id }, 'No matching resource found for delete');
                throw new NotFoundError(`Resource with id ${id} not found in bucket ${bucket}.`);
            }

            logger.info({ bucket, id, count: matchingKeys.length }, 'Deleting matching objects');
            await Promise.all(matchingKeys.map((key) => storageService.deleteFile(bucket, key)));

            logger.info({ bucket, id }, 'Resource deleted successfully');
        } catch (err: any) {
            logger.error({ err }, 'Error deleting resource');

            if (err instanceof ApiError) {
                throw err;
            }

            throw new ApplicationError('An unexpected error occurred while deleting the resource.');
        }
    }
}
