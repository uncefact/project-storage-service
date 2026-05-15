export interface LogContext {
    [key: string]: unknown;
}

export interface LoggerService {
    debug(msg: string): void;
    debug(obj: LogContext, msg?: string): void;

    info(msg: string): void;
    info(obj: LogContext, msg?: string): void;

    warn(msg: string): void;
    warn(obj: LogContext, msg?: string): void;

    error(msg: string): void;
    error(obj: LogContext, msg?: string): void;

    /**
     * Fatal-level log. Use immediately before exiting the process on an
     * unrecoverable startup error so operators can find the cause in logs.
     */
    fatal(msg: string): void;
    fatal(obj: LogContext, msg?: string): void;

    child(bindings: LogContext): LoggerService;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LoggerConfig {
    level?: LogLevel;
    pretty?: boolean;
}
