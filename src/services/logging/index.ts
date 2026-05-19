import { PinoLoggerAdapter, registerRequestContextProvider } from './pino-adapter';
import { getRequestContext } from './request-context';
import type { LogLevel, LoggerConfig, LoggerService } from './types';

export type { LogContext, LogLevel, LoggerConfig, LoggerService } from './types';
export { getRequestContext, runWithRequestContext, updateRequestContext } from './request-context';
export { registerRequestContextProvider } from './pino-adapter';

/**
 * Build a configured `LoggerService`. Also wires the request-context provider
 * so module-scope loggers pick up per-request fields (e.g. `correlationId`)
 * automatically.
 */
export function createLogger(config: LoggerConfig = {}): LoggerService {
    registerRequestContextProvider(() => getRequestContext());
    return new PinoLoggerAdapter(config);
}

// The root logger is a process-wide singleton, constructed at module load.
// `LOG_PRETTY` overrides the default; when unset, pretty output is on only in
// `NODE_ENV=development` so operators get readable logs in dev without
// flagging it on each shell, while tests (`NODE_ENV=test`) and production keep
// the structured JSON output that log aggregators expect.
const rootLogger: LoggerService = createLogger({
    level: (process.env.LOG_LEVEL as LogLevel | undefined) ?? 'info',
    pretty:
        process.env.LOG_PRETTY !== undefined
            ? process.env.LOG_PRETTY === 'true'
            : process.env.NODE_ENV === 'development',
});

/**
 * Pre-bound logger for the HTTP API layer (controllers and the services that
 * back them). Route files should narrow further with `.child({ route: '...' })`.
 */
export const apiLogger = rootLogger.child({ module: 'api' });

/** Pre-bound logger for the authentication layer (API-key validation, middleware). */
export const authLogger = rootLogger.child({ module: 'auth' });

/** Pre-bound logger for the cryptography layer (digest + encryption). */
export const cryptoLogger = rootLogger.child({ module: 'crypto' });

/** Pre-bound logger for the storage layer. Adapters should narrow with `.child({ adapter: '...' })`. */
export const storageLogger = rootLogger.child({ module: 'storage' });

/** Pre-bound logger for runtime configuration parsing. */
export const configLogger = rootLogger.child({ module: 'config' });

/** Pre-bound logger for the server entry point (startup / shutdown / validation). */
export const serverLogger = rootLogger.child({ module: 'server' });
