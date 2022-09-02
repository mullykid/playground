import * as Fs from 'fs';

import { padString, formatDate, format, formatDatetimeAsISO, padOrTrimString, formatDateTimeDynamicFormat } from "../FormatUtils";
import { LogLevel } from "./Logger";
import LoggerFactory from "./index";

export interface ITransport {
    logObject(message: IMessage): void;
}

export class FileTransport implements ITransport {
    handle?: Fs.WriteStream;
    
    constructor(filename: string) {
        this.handle = Fs.createWriteStream(filename, { flags:'a', encoding: 'utf-8' } )

        this.handle.on("error", (error) => {
            if (this.handle) {
                this.handle.end()
                this.handle = undefined
            }

            LoggerFactory.getLogger("commons.logger").error("Error creating logfile {}: {}", filename, error.message);
        })
    }
    
    logObject(message: IMessage): void {
        if (!this.handle) {
            return
        }

        let logLevelAsString: string;

        switch( message.level ) {
            case (LogLevel.TRACE): logLevelAsString = "trace"; break;
            case (LogLevel.DEBUG): logLevelAsString = "debug"; break;
            case (LogLevel.INFO):  logLevelAsString = " info"; break;
            case (LogLevel.WARN):  logLevelAsString = " warn"; break;
            case (LogLevel.ERROR): logLevelAsString = "error"; break;
            default:               logLevelAsString = "fatal";
        }

        let messageAsTxt = format('{} - {}: [{}] ' + message.payload.format + "\n", formatDate(message.timestamp, '%Y-%m-%d %H:%M:%S.%L'), padString(message.loggerName,25, " "), logLevelAsString, ...message.payload.objects);
        
        this.handle.write( messageAsTxt )
    }
}

export class ConsoleTransport implements ITransport {
    logObject(message: IMessage): void {
        let logLevelAsString: string;
        let logFunction: (...data: any[]) => void;

        switch( message.level ) {
            case (LogLevel.TRACE): logLevelAsString = "trace"; logFunction = console.debug; break;
            case (LogLevel.DEBUG): logLevelAsString = "debug"; logFunction = console.debug; break;
            case (LogLevel.INFO):  logLevelAsString = " info"; logFunction = console.info;  break;
            case (LogLevel.WARN):  logLevelAsString = " warn"; logFunction = console.warn;  break;
            case (LogLevel.ERROR): logLevelAsString = "error"; logFunction = console.error; break;
            default:               logLevelAsString = "fatal"; logFunction = console.error;
        }

        let messageObjects: any[] = [];
        let formatSegments = message.payload.format.split( /\{\}/ );

        for (let i=0; i<Math.max(formatSegments.length, message.payload.objects.length); i++) {
            if (i<formatSegments.length) {
                let s = formatSegments[i].trim();

                if (s.length>0) {
                    messageObjects.push(s);
                }
            }

            if (i<message.payload.objects.length) {
                let value = message.payload.objects[i] 

                if (typeof value === 'object' && value instanceof Date) {
                    messageObjects.push(formatDatetimeAsISO(value, value.getUTCMilliseconds()!==0))
                }
                else {
                    messageObjects.push(message.payload.objects[i]);
                }
            }
        }

        logFunction(format('{} - {}: [{}] ', formatDate(message.timestamp, '%Y-%m-%d %H:%M:%S.%L'), padOrTrimString(message.loggerName, 30, " "), logLevelAsString), ...messageObjects);
    }
}

export interface IMessage {
    level: LogLevel;
    loggerName: string;
    timestamp: Date;
    payload: {
        format: string,
        objects: any[]
    }
}
