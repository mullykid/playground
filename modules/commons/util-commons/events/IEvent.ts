import { LinkedList } from "periscope-commons/Collections";

export interface IEvent {
    readonly eventType: string;
    readonly priority: number;
}

export function isIEvent(a: any): a is IEvent {
    return typeof a.eventType === "string" && typeof a.priority === "number"
}

export interface IEventListener<T extends IEvent = IEvent> {
    notify(event: T): Promise<void>;

    /** Returns the list of names of the events this listener is interested in. */
    // Not required anymore with KafkaEventDispatcherWithLocalReducingQueue
    // getEventTypeNames(): string[];
}

export interface IEventDispatcher<T extends IEvent = IEvent> {
    queueEvent(event: T): Promise<void> | void;
    addListener(...listener: IEventListener<T>[]): Promise<void> | void;
}

export abstract class AbstractEvent implements IEvent {
    eventType: string;
    priority: number;

    constructor(eventType: string, priority: number) {
        this.eventType = eventType;
        this.priority = priority;
    }
}
