export interface ILoggerFactorySimpleConfig {
    loggers: ILoggersSimpleConfig,
    transports?: ITransportsSimpleConfig
}

export interface ILoggersSimpleConfig {
    [loggerName: string]: string | string[]
}

export interface ITransportsSimpleConfig {
    [transportName: string]: string[]
}