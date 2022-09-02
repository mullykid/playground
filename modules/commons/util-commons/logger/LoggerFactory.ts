import * as Fs from "fs";
import { promisify } from "util";
import { ILogger, LogLevel, isLogLevel } from "./Logger";
import { LinkedList } from "../Collections";
import { ITransport, IMessage, ConsoleTransport, FileTransport } from "./Transport";
import { ILoggerFactorySimpleConfig } from "./LoggerConfig";
import { defValue } from "../ObjectUtils";

const ROOT_LOGGER_NAME = 'ROOT'
const LF_LOGGER_NAME = 'commons.logger'

export class LoggerFactory {
    private loggers = new Map<string, Logger>();
    private transports = new Map<string, ITransport>();

    private configFileName?: string;
    private configFileTimestamp: number = 0;

    private consoleTransport = new ConsoleTransport()

    private LOGGER: ILogger;

    constructor() {
        // Defaults... 
        this.loggers.set(ROOT_LOGGER_NAME, new Logger(this, null, ROOT_LOGGER_NAME, LogLevel.INFO, [ this.consoleTransport ]));

        this.LOGGER = this.getLogger(LF_LOGGER_NAME)
        
        this.reloadIfNeeded(true)
    }

    parseJson(s: string) {
        return Function('"use strict";return (' + s + ')')();
    }

    // The initial call we want to execute with Sync calls, to make sure that all logging configuration is loaded before all other stuff gets executed.
    async reloadIfNeeded(useSync = false) {
        // Slightly ugly at this stage (using previous/default config). But this way can have consistent logging format for the configuration parsing.
        let effectiveFilename = this.configFileName || "config/logging.json5";

        if (Fs.statSync) {
            this.LOGGER.debug("Checking for new contents of the logging config in {}", effectiveFilename)
            
            try {                
                let configFileStat = useSync 
                    ? Fs.statSync(effectiveFilename) 
                    : await promisify(Fs.stat)(effectiveFilename)

                if (configFileStat.mtimeMs !== this.configFileTimestamp) {
                    this.LOGGER.info("Loading logging configuration from file {}...", effectiveFilename);

                    let data = useSync 
                        ? Fs.readFileSync(effectiveFilename, { encoding: "utf8" }) 
                        : await promisify(Fs.readFile)(effectiveFilename, { encoding: "utf8" } )
                    
                    let parsedData = this.parseJson(data);

                    if (parsedData.loggers === undefined) {
                        throw new Error("The configuration does not include loggers property...");
                    }

                    this.setConfig(parsedData);
                    this.configFileTimestamp = configFileStat.mtimeMs;
                }
            }
            catch (error: any) {
                if (this.configFileName===undefined && error.code === 'ENOENT') {
                    this.LOGGER.debug("Default configuration file", effectiveFilename, "could not be found.");
                }
                else {
                    this.LOGGER.error("Could not load logging configuration file {}: {}", effectiveFilename, error.message);
                }
            }

            // Check for config changes every 5 seconds.
            setTimeout( ()=> this.reloadIfNeeded(), 5000);    
        }
        else {
            this.LOGGER.info("Filesystem support is not available. To configure loggers you would need to set it explicitly by calling LoggerFactory.setConfig()")
        }
    }

    setConfigFile(filename?: string) {
        if (filename) {
            this.configFileName = filename;
            this.configFileTimestamp = 0;
            
            this.reloadIfNeeded();
        }
    }

    setConfig(config: ILoggerFactorySimpleConfig) {
        // Slightly ugly at this stage (using previous/default config). But this way can have consistent logging format for the configuration parsing.
        let getTransportsByName = (names: string[]) => {
            return names.reduce( (result: ITransport[], transportName:string) => { 
                let x = this.transports.get(transportName.toUpperCase()); 
                if (x!==undefined) { 
                    result.push(x)
                }
                else {
                    this.LOGGER.error("Transport", transportName, "is referenced, but nowhere defined. Ignoring")
                }
                
                return result
            }, [])
        }
        
        let createLogger = (loggerName: string) => {
            const loggerConfig = config.loggers[loggerName];
            let result: Logger;

            // Checking if we have valid config for this logger
            let loggerLogLevel: LogLevel | undefined;

            if (loggerConfig) {
                const logLevelAsString = (typeof loggerConfig == "string" ? loggerConfig : loggerConfig[0]).toUpperCase()

                if (isLogLevel(logLevelAsString)) {
                    loggerLogLevel = LogLevel[logLevelAsString]
                }
                else {
                    this.LOGGER.error("Invalid loglevel {} for logger {}. Ignoring...", logLevelAsString, loggerName);
                }
            }

            // We have valid config for this logger. Updating the logger or creating a new one
            if (loggerLogLevel!==undefined) {
                let _result = this.loggers.get(loggerName);

                let loggerTransports = typeof loggerConfig=="string" ? undefined : getTransportsByName(loggerConfig.slice(1))

                // Logger is already created, updating the configuration
                if (_result) {
                    result = _result;
                    result.setLogLevel( loggerLogLevel );
                    result.setTransports( loggerTransports );
                }
                else {
                    let parentLogger = loggerName!==ROOT_LOGGER_NAME ? createLogger(this.getParentLoggerName(loggerName)) : null;

                    this.loggers.set(loggerName, result = new Logger(this, parentLogger, loggerName, loggerLogLevel, loggerTransports))
                }
            }
            else {
                this.loggers.set(loggerName, result = new Logger(this, createLogger(this.getParentLoggerName(loggerName)), loggerName));
            }

            return result;
        }
    
        const createTransport = (transportName: string, transportClass: string, args: string[]) => {
            try {
                switch (transportClass.toUpperCase()) {
                    case ('CONSOLE'):
                        this.transports.set(transportName, new ConsoleTransport());
                        break;
                    case ('FILE'):
                        this.transports.set(transportName, new FileTransport(args[0]));
                        break;
                    default:
                        this.LOGGER.error("Unrecognized transport class {}", transportClass)
                }
            }
            catch (error) {
                this.LOGGER.error("Error creating transport {}.", transportName, error)
            }
        }

        // Clean all current loggers
        for (let [loggerName, logger] of this.loggers) {
            if (loggerName !== ROOT_LOGGER_NAME) {
                logger.setLogLevel( undefined );
            }
            
            logger.setTransports( undefined );
        }

        // this.loggers.clear();
        this.transports.clear();

        // default console, always present
        this.transports.set("CONSOLE", this.consoleTransport)

        // making some sane defaults for ROOT logger
        const rootLoggerConfig = config.loggers[ROOT_LOGGER_NAME];
        if (!rootLoggerConfig) {
            this.LOGGER.warn("ROOT not explicitly defined. Will use INFO/console.");

            config.loggers[ROOT_LOGGER_NAME] = [ 'INFO', 'console' ]
        }
        else if (typeof rootLoggerConfig==='string') {
            this.LOGGER.debug("ROOT transports not explicitly defined. Will use console.");

            config.loggers[ROOT_LOGGER_NAME] = [ rootLoggerConfig, 'console' ]
        }

        if (config.transports!==undefined) {
            for (let transportName in config.transports) {
                const transportClass = config.transports[transportName][0].toUpperCase()
                const transportArgs = config.transports[transportName].splice(1)
                
                createTransport(transportName.toUpperCase(), transportClass, transportArgs);
            }
        }

        for (let loggerName in config.loggers) {
            createLogger(loggerName);
        }
    }

    getLogger(loggerName: string): ILogger {
        // Trying to get previously created logger.
        // All explicityly configured loggers are here
        let result = this.loggers.get(loggerName);

        // Not found - creating a new one
        if (!result) {
            // First, get parent logger
            let parentLogger = this.getLogger(this.getParentLoggerName(loggerName)) as Logger;
            
            this.loggers.set(loggerName, result = new Logger(this, parentLogger, loggerName));
        }

        return result;
    }

    getParentLoggerName(loggerName: string) {
        let lastDot = loggerName.lastIndexOf(".");

        if (lastDot===-1) {
            return ROOT_LOGGER_NAME
        }
        else {
            return loggerName.substring(0, lastDot);
        }
    }
}

class Logger implements ILogger {
    private children = new LinkedList<Logger>();
    private parent: Logger | null;
    private loggerFactory: LoggerFactory;

    /** Determines if the list of transports was cached from parent logger or is set explicity */
    transports?: ITransport[];

    /** Determines if the logLevel was cached from parent logger or is set explicitly */
    hasOwnLogLevel: boolean;
    logLevel: LogLevel;

    private name: string;

    /** Allows to change the log level */
    setLogLevel(logLevel?: LogLevel, isOwnLogLevel: boolean = true) {
        if (logLevel!==undefined) {
            if (!this.hasOwnLogLevel || isOwnLogLevel) {
                this.hasOwnLogLevel = isOwnLogLevel;
                this.logLevel = logLevel;
            }
        }
        else {
            if (this.parent!==null) {
                this.hasOwnLogLevel = false;
                this.logLevel = this.parent.logLevel;
            }
            else {
                this.loggerFactory.getLogger(LF_LOGGER_NAME).error("ROOT logger must have an explicit logLevel. Ignornig request to set it to undefined. ");
            }
        }

        for (let child of this.children) {
            child.setLogLevel(this.logLevel, false);
        }
    }

    protected getEffectiveTransports(): ITransport[] {
        if (this.transports!==undefined) {
            return this.transports;
        }
        else {
            return this.parent!==null ? this.parent.getEffectiveTransports() : [];
        }
    }

    setTransports(transports?: ITransport[]) {
        this.transports = transports;
    }

    private doLog(logLevel: LogLevel, frm: string, ...objects: any[]): void {
        // This logger ignores the messages at that level
        if (this.logLevel > logLevel) {
            return;
        }

        // A safeguard for a common pattern that TS cannot catch.  
        //   Sometimes people write the following catch statement: catch (error) { LOGGER.error(error); /.../ }
        if (typeof frm!=="string") {
            objects.splice(0, 0, frm);
            frm="";
        }

        let messageObj: IMessage = {
            timestamp: new Date(),
            level: logLevel,
            loggerName: this.name,
            payload: {
                format: frm,
                objects: objects
            }
        }

        for (let transport of this.getEffectiveTransports()) {
            transport.logObject(messageObj)
        }
    }

    protected addChildLogger(logger: Logger){
        this.children.add(logger);
    }

    trace(fmt: string, ...objects: any[]): void {
        this.doLog(LogLevel.TRACE, fmt, ...objects);
    }
    
    isTraceEnabled(): boolean {
        return this.logLevel <= LogLevel.TRACE;
    }

    debug(fmt: string, ...objects: any[]): void {
        this.doLog(LogLevel.DEBUG, fmt, ...objects);
    }
    
    isDebugEnabled(): boolean {
        return this.logLevel <= LogLevel.DEBUG;
    }

    info (fmt: string, ...objects: any[]): void {
        this.doLog(LogLevel.INFO, fmt, ...objects);
    }

    isInfoEnabled(): boolean {
        return this.logLevel <= LogLevel.INFO;
    }

    warn (fmt: string, ...objects: any[]): void {
        this.doLog(LogLevel.WARN, fmt, ...objects);
    }

    isWarnEnabled(): boolean {
        return this.logLevel <= LogLevel.WARN;
    }

    error(fmt: string, ...objects: any[]): void {
        this.doLog(LogLevel.ERROR, fmt, ...objects);
    }

    isErrorEnabled(): boolean {
        return this.logLevel <= LogLevel.ERROR;
    }
    
    fatal(fmt: string, ...objects: any[]): void {
        this.doLog(LogLevel.FATAL, fmt, ...objects);
    }
    
    isFatalEnabled(): boolean {
        return this.logLevel <= LogLevel.FATAL;
    }

    constructor(loggerFactory: LoggerFactory, parent: Logger|null, name: string, logLevel?: LogLevel, transports?: ITransport[]) {
        this.loggerFactory = loggerFactory;
        this.parent = parent;
        this.name = name;
        this.transports = transports;
        this.hasOwnLogLevel = logLevel!==undefined;
        
        if (this.parent!==null) {
            this.logLevel =  defValue(logLevel, this.parent.logLevel);
            this.parent.addChildLogger(this);
        }
        else {
            this.logLevel =  defValue<LogLevel>(logLevel, LogLevel.OFF);
        }
    }
}

const LOGGERS = new LoggerFactory();

export default LOGGERS;
