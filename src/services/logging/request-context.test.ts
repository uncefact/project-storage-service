import { getRequestContext, runWithRequestContext, updateRequestContext } from './request-context';

describe('request context', () => {
    it('returns undefined outside of any context', () => {
        expect(getRequestContext()).toBeUndefined();
    });

    it('exposes the correlationId inside runWithRequestContext', () => {
        runWithRequestContext('abc-123', () => {
            expect(getRequestContext()?.correlationId).toBe('abc-123');
        });
    });

    it('merges additional fields via updateRequestContext', () => {
        runWithRequestContext('abc-123', () => {
            updateRequestContext({ requestId: 'r-1', userId: 'u-9' });
            const ctx = getRequestContext();
            expect(ctx?.correlationId).toBe('abc-123');
            expect(ctx?.requestId).toBe('r-1');
            expect(ctx?.userId).toBe('u-9');
        });
    });

    it('isolates contexts across separate runs', () => {
        let outer: string | undefined;
        let inner: string | undefined;

        runWithRequestContext('outer-id', () => {
            outer = getRequestContext()?.correlationId;
            runWithRequestContext('inner-id', () => {
                inner = getRequestContext()?.correlationId;
            });
            // The outer context survives the nested run.
            expect(getRequestContext()?.correlationId).toBe('outer-id');
        });

        expect(outer).toBe('outer-id');
        expect(inner).toBe('inner-id');
    });

    it('updateRequestContext is a no-op outside a context', () => {
        expect(() => updateRequestContext({ anyKey: 'anyValue' })).not.toThrow();
        expect(getRequestContext()).toBeUndefined();
    });
});
