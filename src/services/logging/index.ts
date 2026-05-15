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
 * `LOG_LEVEL` / `LOG_PRETTY` environment variables. Modules should not use this
 * directly; pick the matching pre-bound logger from this barrel (e.g.
 * {@link apiLogger}, {@link authLogger}) or attach a `.child({ module: '...' })`
 * binding so log lines self-identify when aggregated across services.
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

/**
 * Pre-bound logger for the HTTP API layer (controllers and the services that
 * back them). Route files should narrow further with `.child({ route: '...' })`.
 */
export const apiLogger = getLogger().child({ module: 'api' });

/** Pre-bound logger for the authentication layer (API-key validation, middleware). */
export const authLogger = getLogger().child({ module: 'auth' });

/** Pre-bound logger for the cryptography layer (digest + encryption). */
export const cryptoLogger = getLogger().child({ module: 'crypto' });

/** Pre-bound logger for the storage layer. Adapters should narrow with `.child({ adapter: '...' })`. */
export const storageLogger = getLogger().child({ module: 'storage' });

/** Pre-bound logger for runtime configuration parsing. */
export const configLogger = getLogger().child({ module: 'config' });

/** Pre-bound logger for the server entry point (startup / shutdown / validation). */
export const serverLogger = getLogger().child({ module: 'server' });
