import { IEvent, IEventDispatcher, IEventListener } from "./IEvent";
import { Queue, SmartSet, Set } from "../Collections";
import SequencialProcessor from '../SequencialProcessor';

import LOGGERS from "../logger/index";
import { retry } from "../PromiseUtils";
import { eventsToString, eventToString } from "./Events";

const LOGGER = LOGGERS.getLogger("import.EventDispatcher");

export interface IQueuedEvent<T extends IEvent = IEvent> {
    promiseMetadata: {
        resolve: (() => void)[],
        reject:  ((error: any) => void)[]
    },
    payload: T
}

export default class EventDispatcher<T extends IEvent = IEvent> implements IEventDispatcher {
    private readonly eventListeners: Set<IEventListener> = new SmartSet<IEventListener>();    
    private readonly processor: SequencialProcessor<IQueuedEvent<T>>;
    
    private getEvents() {
        return this.queue.map(v => v.payload);
    }

    queueEvent(event: T) {
        return new Promise<void>( (resolve, reject) => {
            if (LOGGER.isTraceEnabled()) {
                LOGGER.trace("Received    {} (priority {}). Will update queue {}", eventToString(event), event.priority, eventsToString(this.getEvents()));
            }

            this.processor.push({
                payload: event,
                promiseMetadata: {
                    resolve: [ resolve ], 
                    reject:  [ reject ]
                }
            });        

            if (LOGGER.isInfoEnabled()) {
                LOGGER.info("Received    {}. Updated queue {}", eventToString(event), eventsToString(this.getEvents()));
            }
        })
    }

    private async dispatchEvent(queuedEvent: IQueuedEvent<T>): Promise<void> {
        const event = queuedEvent.payload;

        if (LOGGER.isInfoEnabled()) {
            LOGGER.info("Dispatching {}. Remaining queue {}", eventToString(event), eventsToString(this.getEvents()));
        }

        for (let eventListener of this.eventListeners) {
            let el = eventListener as any;
            let eventListenerName = typeof el.getName === "function" ? el.getName() : el.constructor.name;

            try {
                LOGGER.trace("Notifying listener {} about event {}", eventListenerName, eventToString(event));
            
                await retry(3, ()=>eventListener.notify(event), 500);
            }
            catch (error: any) {
                LOGGER.error("Error while notifying listener {} about event {}", eventListenerName,  eventToString(event), error);

                // Reject all associated promises with the queued event
                for (let reject of queuedEvent.promiseMetadata.reject) {
                    reject(error)
                }
            }
        }

        LOGGER.debug("Resolving all promises associated with an event {}",  eventToString(event));
        for (let resolve of queuedEvent.promiseMetadata.resolve) {
            resolve()
        }

        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug("Dispatched  {}. Remaining queue: {}", eventToString(event), eventsToString(this.getEvents()));
        }
    }

    addListener(...eventListenrs: IEventListener[]) {
        eventListenrs.forEach( (el) => this.eventListeners.add(el) );
    }

    constructor(private queue: Queue<IQueuedEvent<T>>, private readonly preprocess = async() => {}) {
        this.processor = new SequencialProcessor<IQueuedEvent<T>>(queue, (event: IQueuedEvent<T>) => this.dispatchEvent(event), preprocess); 
    }
}