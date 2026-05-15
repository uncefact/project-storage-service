import { IStorageService } from '../../services';
import { ApiError, ApplicationError, BadRequestError, NotFoundError } from '../../errors';
import { AVAILABLE_BUCKETS } from '../../config';
import { isValidUUID } from '../../utils';
import { getLogger } from '../../services/logging';

const logger = getLogger();

export class DeleteService {
    public async deleteDocument(storageService: IStorageService, bucket: string, id: string): Promise<void> {
        try {
            if (!AVAILABLE_BUCKETS.includes(bucket)) {
                throw new BadRequestError(
                    `Invalid bucket. Must be one of the following buckets: ${AVAILABLE_BUCKETS.join(', ')}`,
                );
            }

            if (!isValidUUID(id)) {
                throw new BadRequestError(`Invalid id ${id}. Please provide a valid UUID.`);
            }

            const matchingKeys = await storageService.listObjectsByPrefix(bucket, id);

            if (matchingKeys.length === 0) {
                throw new NotFoundError(`Resource with id ${id} not found in bucket ${bucket}.`);
            }

            await Promise.all(matchingKeys.map((key) => storageService.deleteFile(bucket, key)));
        } catch (err: any) {
            logger.error(
                { err: err instanceof Error ? err.message : err },
                '[DeleteService.deleteDocument] An error occurred while deleting the resource',
            );

            if (err instanceof ApiError) {
                throw err;
            }

            throw new ApplicationError('An unexpected error occurred while deleting the resource.');
        }
    }
}
