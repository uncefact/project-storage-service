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
            // Redact paths cover the secrets this service produces or accepts:
            // the `decryptionKey` returned with private uploads, plus the
            // request headers that carry credentials (`x-api-key`,
            // `authorization`, `cookie`). The list is deliberately narrow; add
            // to it only when new code starts emitting a new secret.
            redact: {
                paths: [
                    '*.decryptionKey',
                    'decryptionKey',
                    '*.headers["x-api-key"]',
                    'headers["x-api-key"]',
                    '*.headers.authorization',
                    'headers.authorization',
                    '*.headers.cookie',
                    'headers.cookie',
                ],
                censor: '[REDACTED]',
            },
            // Register Pino's standard error serializer under both common keys.
            // Callers can pass `logger.error({ err: someError }, '...')` (or `error`)
            // and Pino captures `message`, `stack`, `code`, `cause` as nested fields.
            serializers: {
                err: pino.stdSerializers.err,
                error: pino.stdSerializers.err,
            },
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

    fatal(msgOrObj: string | LogContext, msg?: string): void {
        if (typeof msgOrObj === 'string') {
            this.logger.fatal(msgOrObj);
        } else {
            this.logger.fatal(msgOrObj, msg);
        }
    }

    child(bindings: LogContext): LoggerService {
        return new PinoLoggerAdapter(this.logger.child(bindings));
    }
}
