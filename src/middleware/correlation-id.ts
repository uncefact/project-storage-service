import crypto from 'crypto';
import type { RequestHandler } from 'express';
import { runWithRequestContext } from '../services/logging';
import type { LoggerService } from '../services/logging';

const CORRELATION_ID_HEADER = 'x-correlation-id';
const MAX_CORRELATION_ID_LENGTH = 128;
const CORRELATION_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

function isValidCorrelationId(value: string): boolean {
    return value.length > 0 && value.length <= MAX_CORRELATION_ID_LENGTH && CORRELATION_ID_PATTERN.test(value);
}

/**
 * Express middleware that establishes a request-scoped correlation ID.
 *
 * The inbound `x-correlation-id` header is validated (length cap, alphanumeric
 * plus `-` and `_`) before being trusted. Invalid or missing values are
 * replaced by a fresh `crypto.randomUUID()`; rejection of a malformed value is
 * recorded as a `warn` log line (the offending payload is not echoed back to
 * keep the log line safe from injection content).
 *
 * The resolved correlation ID is:
 *  1. Available to every handler / log line via `getRequestContext()` (Pino's
 *     mixin picks it up automatically).
 *  2. Echoed on the response as `x-correlation-id` so callers can trace the
 *     request without parsing the body.
 */
export function correlationIdMiddleware(logger: LoggerService): RequestHandler {
    return (req, res, next) => {
        const headerValue = req.headers[CORRELATION_ID_HEADER];
        const inbound = Array.isArray(headerValue) ? headerValue[0] : headerValue;

        let correlationId: string;
        if (inbound === undefined) {
            correlationId = crypto.randomUUID();
        } else if (isValidCorrelationId(inbound)) {
            correlationId = inbound;
        } else {
            correlationId = crypto.randomUUID();
            logger.warn(
                {
                    inboundLength: inbound.length,
                    replacedWith: correlationId,
                },
                'Rejected invalid x-correlation-id header; minted a fresh id',
            );
        }

        res.setHeader(CORRELATION_ID_HEADER, correlationId);
        runWithRequestContext(correlationId, () => next());
    };
}
