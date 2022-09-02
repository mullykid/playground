import { AggPeriod, IProcessingResult, createProcessingResult } from "import-commons/src/IObjectProcessor";
import { AbstractEvent, IEvent } from "periscope-commons/events/IEvent";
import { getPercentage } from "periscope-commons/DataUtils";
import { format, padString } from "../FormatUtils";
import { Iterable } from "../Collections";

export namespace Events {
    function aggPeriodToPriority(a: AggPeriod | null): number {
        switch (a) {
            case null:            return 0;
            case AggPeriod.RT:    return 0.100;
            case AggPeriod.HOUR:  return 0.200;
            case AggPeriod.DAY:   return 0.300;
            case AggPeriod.WEEK:  return 0.500;
            case AggPeriod.MONTH: return 0.700;
            case AggPeriod.YEAR:  return 0.800;
        }
    }

    export abstract class DataReady extends AbstractEvent {
        static readonly SUB_EVENT_TYPE = "AbstractDataReadyEvent"
        static readonly PRIORITY = 20;
        
        private readonly eventSubType = DataReady.SUB_EVENT_TYPE;
        
        /**
         * @param eventType 
         * @param aggPeriod AggregationPeriod for which the data is available. Null if the data is RAW (unprocessed yet, exp. FileAvailable)
         * @param isHighPriority 
         */
        constructor(eventType: string, readonly aggPeriod: AggPeriod | null, isHighPriority = false) {
            // There is potential of the data in shorter AggPeriods to influence data for longer AggPeriods. 
            // That's why the calculated priority is slightly higher for longer AggPeriods, so that they get processed later. 
            super(eventType, DataReady.PRIORITY - (isHighPriority ? 1 : 0) + aggPeriodToPriority(aggPeriod));
        }

        static isOfType(a: any): a is DataReady {
            return a.eventSubType === DataReady.SUB_EVENT_TYPE;
        }
    }

    export class RetagData extends AbstractEvent {
        static readonly EVENT_TYPE = "ReApplyTagging"

        constructor(readonly pipelineName: string, readonly timestampFrom: Date, readonly timestampTo: Date) {
            super(RetagData.EVENT_TYPE, 15);
        }

        static isRetagData(a: IEvent): a is RetagData {
            return a.eventType === RetagData.EVENT_TYPE;
        }
    }

    export class DataLoaded extends DataReady {
        static readonly EVENT_TYPE = "DataLoaded";
        
        constructor(readonly objectType: string, readonly pipelineName: string, readonly aggPeriod: AggPeriod, readonly timestampFrom: Date, readonly timestampTo: Date) {
            super(DataLoaded.EVENT_TYPE, aggPeriod);
        }

        static isDataLoaded(i: IEvent): i is DataLoaded {
            return i.eventType === DataLoaded.EVENT_TYPE;
        }
    }

    export class DataRetention extends AbstractEvent {
        static readonly EVENT_TYPE = "DataRetention"

        constructor(readonly objectType: string, readonly pipelineName: string, readonly aggType: AggPeriod, readonly days: Number) {
            super(DataRetention.EVENT_TYPE, 20);
        }

        static isDataRetention(i: IEvent): i is DataRetention {
            return i.eventType === DataRetention.EVENT_TYPE;
        }
    }
    
    export class SourceProcessed extends AbstractEvent {
        static readonly EVENT_TYPE = "SourceProcessed"
        static readonly MAX_ERRORS_IN_EVENT = 100;

        readonly totalRecordCount: number;
        readonly processingResult: IProcessingResult;

        constructor(readonly pipelineName: string, readonly sourceName: string, readonly sourceSize: number | undefined, readonly elapsedTimeMs: number, processingResult: IProcessingResult, readonly executionId: string) {
            super(SourceProcessed.EVENT_TYPE, 5);

            this.totalRecordCount = (processingResult.errorCount || 0) + (processingResult.successCount || 0) + (processingResult.warningCount || 0)

            // We don't want to send all errors or warnings, just a small subset
            this.processingResult = createProcessingResult(processingResult.successCount, processingResult.warningCount, processingResult.errorCount, processingResult.errorList.slice(0, SourceProcessed.MAX_ERRORS_IN_EVENT), processingResult.warningList.slice(0, SourceProcessed.MAX_ERRORS_IN_EVENT) );
            if (processingResult.errorList.length>SourceProcessed.MAX_ERRORS_IN_EVENT) {
                this.processingResult.errorList.push("... and more " + (processingResult.errorList.length - SourceProcessed.MAX_ERRORS_IN_EVENT))
            }

            if (processingResult.warningList.length>SourceProcessed.MAX_ERRORS_IN_EVENT) {
                this.processingResult.warningList.push("... and more " + (processingResult.warningList.length - SourceProcessed.MAX_ERRORS_IN_EVENT))
            }
        }

        static isOfType(i: IEvent): i is SourceProcessed {
            return i.eventType === SourceProcessed.EVENT_TYPE;
        }
    }

    export class ScanForFiles extends AbstractEvent {
        static readonly EVENT_TYPE = "ScanForFiles";
        static counter = 0;
        
        readonly id = ScanForFiles.counter++;

        constructor(readonly pipelineName: string, readonly path: string, readonly force: boolean, readonly highPriority: boolean, readonly archiveTo?: string) {
            super(ScanForFiles.EVENT_TYPE, 10);
        }

        static isOfType(i: IEvent): i is ScanForFiles {
            return i.eventType === ScanForFiles.EVENT_TYPE;
        }
    }

    export class APIReady extends DataReady {
        static readonly EVENT_TYPE = 'APIReady'

        constructor(readonly pipelineName: string, readonly apiname: string) {
            super(APIReady.EVENT_TYPE, null);
        }

        static isOfType(i: IEvent): i is APIReady {
            return i.eventType === APIReady.EVENT_TYPE;
        }
    }

    export class FileReady extends DataReady {
        static readonly EVENT_TYPE = "FileReady";

        constructor(readonly pipelineName: string, readonly filename: string, readonly force: boolean, readonly archiveTo?: string, priority = false) {
            super(FileReady.EVENT_TYPE, null, priority);
        }

        static isOfType(i: IEvent): i is FileReady {
            return i.eventType === FileReady.EVENT_TYPE;
        }
    }    

    export class MongoStats extends AbstractEvent {
        static readonly EVENT_TYPE = "MongoSizeStats" 
        static readonly PRIORITY = 15;

        constructor(readonly pipelineName: string) {
            super(MongoStats.EVENT_TYPE, MongoStats.PRIORITY);
        }

        static isMongoStats(i: IEvent): i is MongoStats {
            return i.eventType === MongoStats.EVENT_TYPE;
        }
    }
    
    export class PortalStats extends AbstractEvent {
        static readonly EVENT_TYPE = "FileSystemSizeStats"
        static readonly PRIORITY = 15;

        public readonly pct: number | undefined;

        constructor(public diskUsed: number, public diskSize: number) {
            super(PortalStats.EVENT_TYPE, PortalStats.PRIORITY);

            if (diskSize!==0) {
                this.pct = getPercentage(diskUsed, diskSize);
            }
        }

        static isPortalStats(i: IEvent): i is PortalStats {
            return i.eventType === PortalStats.EVENT_TYPE;
        }
    }

    export class CollectionError extends AbstractEvent {
        static readonly EVENT_TYPE = "CollectionError";
        static readonly PRIORITY   = 2;

        /**
         * @param serviceName 
         * @param sourceName 
         * @param pipelineName 
         * @param message 
         * @param type  Type of the failure, warning or error
         * @param scope If the failure caused a whole source to fail (exp. cannot read a file, cannot connect to RestAPI) or is content related (exp. incorrect record)
         */
        constructor(readonly serviceName: string, readonly sourceName: string, readonly pipelineName: string, readonly message: string, readonly type: 'Error' | 'Warning', readonly scope: 'Source' | 'Content') {
            super(CollectionError.EVENT_TYPE, CollectionError.PRIORITY);
        }

        static isOfType(i: IEvent): i is CollectionError {
            return i.eventType === CollectionError.EVENT_TYPE;
        }
    }
}

export interface IUsageStats{
    size: number,
    used: number,
    free?: number,
    pctUsed: number
}

export function eventToString(e: IEvent) {
    if (Events.DataLoaded.isDataLoaded(e)) {
        return format("{} {} ({}-{})", e.eventType, e.objectType + "." + e.aggPeriod, e.timestampFrom, e.timestampTo);
    }   
    else if (Events.SourceProcessed.isOfType(e)) {
        return e.eventType + " " + e.sourceName
    }
    else if (Events.FileReady.isOfType(e)) {
        return e.eventType + " " + e.filename + (e.force ? " FORCE" : "")
    }
    else if (Events.CollectionError.isOfType(e)) {
        return e.eventType + " " + e.sourceName + ":" + e.message
    }
    else {
        return e.eventType;
    }
}

export function eventsToString(events: Iterable<IEvent>, separator = '\n     ') {
    return events.reduce( (acc, v) => { return acc + separator + padString(v.priority.toFixed(1), 4, ' ') + ": " + eventToString(v) }, "");
}