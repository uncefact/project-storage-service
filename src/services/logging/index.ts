import { PinoLoggerAdapter, registerRequestContextProvider } from './pino-adapter';
import { getRequestContext } from './request-context';
import type { LogLevel, LoggerConfig, LoggerService } from './types';

export type { LogContext, LogLevel, LoggerConfig, LoggerService } from './types';
export { getRequestContext, runWithRequestContext, updateRequestContext } from './request-context';
export { registerRequestContextProvider } from './pino-adapter';

/**
 * Build a configured `LoggerService`. The first call to this in the process
 * lifetime also wires the request-context provider so module-scope loggers
 * pick up per-request fields (e.g. `correlationId`) automatically.
 */
export function createLogger(config: LoggerConfig = {}): LoggerService {
    registerRequestContextProvider(() => getRequestContext());
    return new PinoLoggerAdapter(config);
}

let rootLogger: LoggerService | undefined;

/**
 * Returns the process-wide root logger, instantiating it on first access from
 * `LOG_LEVEL` / `LOG_PRETTY` environment variables. Modules that need a logger
 * should call this and (optionally) attach a `child` binding with their name
 * so log lines self-identify in aggregation.
 */
export function getLogger(): LoggerService {
    if (!rootLogger) {
        rootLogger = createLogger({
            level: (process.env.LOG_LEVEL as LogLevel | undefined) ?? 'info',
            pretty: process.env.LOG_PRETTY === 'true',
        });
    }
    return rootLogger;
}
