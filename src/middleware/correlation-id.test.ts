import { getMockReq, getMockRes } from '@jest-mock/express';
import { correlationIdMiddleware } from './correlation-id';
import { getRequestContext } from '../services/logging';
import type { LoggerService } from '../services/logging';

function buildMockLogger(): jest.Mocked<LoggerService> {
    const logger: any = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    };
    logger.child = jest.fn(() => logger);
    return logger;
}

describe('correlationIdMiddleware', () => {
    const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let logger: jest.Mocked<LoggerService>;

    beforeEach(() => {
        logger = buildMockLogger();
    });

    it('uses the inbound x-correlation-id when it is valid', () => {
        const inbound = 'request-12345_abc';
        const req = getMockReq({ headers: { 'x-correlation-id': inbound } });
        const { res, next } = getMockRes();

        let observed: string | undefined;
        const captureContext = () => {
            observed = getRequestContext()?.correlationId;
        };

        correlationIdMiddleware(logger)(req, res, () => captureContext());

        expect(observed).toBe(inbound);
        expect(res.setHeader).toHaveBeenCalledWith('x-correlation-id', inbound);
        expect(logger.warn).not.toHaveBeenCalled();
    });

    it('mints a fresh UUID when no header is present', () => {
        const req = getMockReq();
        const { res, next } = getMockRes();

        let observed: string | undefined;
        correlationIdMiddleware(logger)(req, res, () => {
            observed = getRequestContext()?.correlationId;
        });

        expect(observed).toMatch(UUID_PATTERN);
        expect(res.setHeader).toHaveBeenCalledWith('x-correlation-id', observed);
        expect(logger.warn).not.toHaveBeenCalled();
    });

    it('mints a fresh UUID and warns when the header fails validation', () => {
        const malformed = 'has whitespace and unicode  bell';
        const req = getMockReq({ headers: { 'x-correlation-id': malformed } });
        const { res, next } = getMockRes();

        let observed: string | undefined;
        correlationIdMiddleware(logger)(req, res, () => {
            observed = getRequestContext()?.correlationId;
        });

        expect(observed).toMatch(UUID_PATTERN);
        expect(observed).not.toBe(malformed);
        expect(res.setHeader).toHaveBeenCalledWith('x-correlation-id', observed);
        expect(logger.warn).toHaveBeenCalledWith(
            expect.objectContaining({ inboundLength: malformed.length, replacedWith: observed }),
            expect.stringContaining('Rejected invalid x-correlation-id header'),
        );
    });

    it('rejects a header that exceeds the length cap', () => {
        const tooLong = 'a'.repeat(129);
        const req = getMockReq({ headers: { 'x-correlation-id': tooLong } });
        const { res, next } = getMockRes();

        let observed: string | undefined;
        correlationIdMiddleware(logger)(req, res, () => {
            observed = getRequestContext()?.correlationId;
        });

        expect(observed).toMatch(UUID_PATTERN);
        expect(observed).not.toBe(tooLong);
        expect(logger.warn).toHaveBeenCalled();
    });

    it('rejects an empty-string header', () => {
        const req = getMockReq({ headers: { 'x-correlation-id': '' } });
        const { res, next } = getMockRes();

        let observed: string | undefined;
        correlationIdMiddleware(logger)(req, res, () => {
            observed = getRequestContext()?.correlationId;
        });

        expect(observed).toMatch(UUID_PATTERN);
        expect(logger.warn).toHaveBeenCalled();
    });

    it('uses the first value when the header is multi-valued', () => {
        const req = getMockReq({ headers: { 'x-correlation-id': ['first-value', 'second-value'] as any } });
        const { res, next } = getMockRes();

        let observed: string | undefined;
        correlationIdMiddleware(logger)(req, res, () => {
            observed = getRequestContext()?.correlationId;
        });

        expect(observed).toBe('first-value');
        expect(logger.warn).not.toHaveBeenCalled();
    });
});
