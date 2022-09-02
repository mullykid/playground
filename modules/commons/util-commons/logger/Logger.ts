export interface ILogger {
    trace(fmt: string, ...objects: any[]): void;
    isTraceEnabled(): boolean;

    debug(fmt: string, ...objects: any[]): void;
    isDebugEnabled(): boolean;

    info (fmt: string, ...objects: any[]): void;
    isInfoEnabled(): boolean;

    warn (fmt: string, ...objects: any[]): void;
    isWarnEnabled(): boolean;

    error(fmt: string, ...objects: any[]): void;
    isErrorEnabled(): boolean;
    
    fatal(fmt: string, ...objects: any[]): void;
    isFatalEnabled(): boolean;

    setLogLevel(logLevel?: LogLevel): void;
}

export enum LogLevel { 
    TRACE, DEBUG, INFO, WARN, ERROR, FATAL, OFF
};

export function isLogLevel(s: string): s is keyof typeof LogLevel {
    switch (s) {
        case "TRACE":
        case "DEBUG":
        case "INFO":
        case "WARN":
        case "ERROR":
        case "FATAL":
        case "OFF":
            return true
        default:
            return false
    }
}