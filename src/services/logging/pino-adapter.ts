import pino from 'pino';
import type { LoggerService, LogContext, LoggerConfig } from './types';

type RequestContextProvider = () => Record<string, unknown> | undefined;

let requestContextProvider: RequestContextProvider | undefined;

/**
 * Register a function that supplies the current request context for log
 * enrichment. Invoked by Pino's mixin on every log call, so module-scope
 * loggers automatically pick up per-request fields such as `correlationId`.
 */
export function registerRequestContextProvider(fn: RequestContextProvider): void {
    requestContextProvider = fn;
}

export class PinoLoggerAdapter implements LoggerService {
    private readonly logger: pino.Logger;

    constructor(configOrLogger?: LoggerConfig | pino.Logger) {
        if (configOrLogger && typeof configOrLogger === 'object' && 'child' in configOrLogger) {
            this.logger = configOrLogger;
            return;
        }

        const config = (configOrLogger as LoggerConfig | undefined) ?? {};
        this.logger = pino({
            level: config.level ?? process.env.LOG_LEVEL ?? 'info',
            mixin() {
                if (!requestContextProvider) return {};
                try {
                    const context = requestContextProvider();
                    return context ? { ...context } : {};
                } catch (err) {
                    // Mixin must never throw; falling back to an empty object is the
                    // safest way to keep logging working when context wiring is broken.
                    return { logMixinError: err instanceof Error ? err.message : String(err) };
                }
            },
            ...(config.pretty && {
                transport: {
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                        translateTime: 'SYS:standard',
                        ignore: 'pid,hostname',
                    },
                },
            }),
        });
    }

    debug(msgOrObj: string | LogContext, msg?: string): void {
        if (typeof msgOrObj === 'string') {
            this.logger.debug(msgOrObj);
        } else {
            this.logger.debug(msgOrObj, msg);
        }
    }

    info(msgOrObj: string | LogContext, msg?: string): void {
        if (typeof msgOrObj === 'string') {
            this.logger.info(msgOrObj);
        } else {
            this.logger.info(msgOrObj, msg);
        }
    }

    warn(msgOrObj: string | LogContext, msg?: string): void {
        if (typeof msgOrObj === 'string') {
            this.logger.warn(msgOrObj);
        } else {
            this.logger.warn(msgOrObj, msg);
        }
    }

    error(msgOrObj: string | LogContext, msg?: string): void {
        if (typeof msgOrObj === 'string') {
            this.logger.error(msgOrObj);
        } else {
            this.logger.error(msgOrObj, msg);
        }
    }

    child(bindings: LogContext): LoggerService {
        return new PinoLoggerAdapter(this.logger.child(bindings));
    }
}
