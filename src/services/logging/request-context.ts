import { AsyncLocalStorage } from 'async_hooks';

interface RequestContext {
    correlationId: string;
    [key: string]: unknown;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Returns the current request context, or undefined if called outside a context.
 * Always carries `correlationId` when present; additional fields are whatever
 * `updateRequestContext` has merged in.
 */
export function getRequestContext(): RequestContext | undefined {
    return asyncLocalStorage.getStore();
}

/**
 * Merges the provided partial into the current request context.
 * No-op if called outside a context (does not throw).
 */
export function updateRequestContext(partial: Record<string, unknown>): void {
    const store = asyncLocalStorage.getStore();
    if (store) {
        Object.assign(store, partial);
    }
}

/**
 * Runs the callback within a new request context. The correlationId is required;
 * additional fields can be added progressively via `updateRequestContext`.
 */
export function runWithRequestContext<R>(correlationId: string, callback: () => R): R {
    return asyncLocalStorage.run({ correlationId }, callback);
}
