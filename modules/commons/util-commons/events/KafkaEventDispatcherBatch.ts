import { IEvent, IEventDispatcher, IEventListener, isIEvent } from "./IEvent";
import { Kafka, Producer, logLevel as IKafkaLogLevel, LogEntry as IKafkaLogEntry, EachBatchPayload, Consumer } from "kafkajs";

// Inhouse parser/deparser, based on JSON and bson notation.
// Alternatively we could use avro-js
import * as EJSON from "../EjsonParser";

import LOGGERS from "../logger/index";
import { AutoCreateMap, OrderedList, Queue } from "../Collections";
import { ReducingEventQueue } from "import-commons/src/ReducingEventQueue";
import EventDispatcher, { IQueuedEvent } from "./EventDispatcher";
import { Events, eventToString } from "./Events";
import { timeoutPromise } from "../PromiseUtils";

const LOGGER =         LOGGERS.getLogger("kafka.EventDispatcherBatch");
const LOGGER_SEND =    LOGGERS.getLogger("kafka.EventDispatcherBatch.send");
const LOGGER_RECEIVE = LOGGERS.getLogger("kafka.EventDispatcherBatch.receive");


const TOPIC_SUFFIX = "_events";

const KAFKA_LOGGER_PREFIX = "kafka.kafkajs";

export const kafkaLogCreator = (level: IKafkaLogLevel) => {
    const kafkaLogFn = (logEntry: IKafkaLogEntry) => {
        const KAFKA_LOGGER = LOGGERS.getLogger(`${KAFKA_LOGGER_PREFIX}.${logEntry.namespace}`);
        
        const { timestamp, logger, message, ...log } = logEntry.log;
        const logAsString = EJSON.stringify(log)

        switch (logEntry.level) {
            case IKafkaLogLevel.ERROR:   KAFKA_LOGGER.error(message, logAsString); break;
            case IKafkaLogLevel.WARN:    KAFKA_LOGGER.warn (message, logAsString); break;
            case IKafkaLogLevel.INFO:    KAFKA_LOGGER.info (message, logAsString); break;
            case IKafkaLogLevel.DEBUG:   KAFKA_LOGGER.debug(message, logAsString); break;
            case IKafkaLogLevel.NOTHING: KAFKA_LOGGER.trace(message, logAsString); break;
        }
    }

    return kafkaLogFn
}

export class KafkaEventDispatcherWithLocalReducingQueue implements IEventDispatcher {
    private readonly kafkaHandle: Kafka;
    private readonly kafkaProducer: Producer;
    private readonly kafkaConsumer: Consumer;

    private readonly queue: Queue<IQueuedEvent>;
    private readonly localEventDispatcher: IEventDispatcher;

    private readonly offsets = new AutoCreateMap((s: string) => ({
        unprocessedOffsets: new OrderedList((a,b) => a-b),
        lastCommitedOffset: -1,
        highestSeenOffset: -1,
    }))

    private isInitDone = false;

    private async batchHandle({ batch, resolveOffset, heartbeat, isRunning, isStale, commitOffsetsIfNecessary, uncommittedOffsets }: EachBatchPayload ) {
        LOGGER_RECEIVE.debug("Recieved a batch! {} objects, uncommitedOffsets {}", batch.messages.length, uncommittedOffsets().topics[0]?.partitions)

        let lastHeartbeatTimestamp = Date.now();

        const doHeartbeatIfNeeded = async () => {
            const ts = Date.now();
            const d = ts-lastHeartbeatTimestamp;
            if (d > this.heartbeatInterval) {
                LOGGER.debug("Hearbeat. Duration is {}ms...", d);
                lastHeartbeatTimestamp = Number.MAX_SAFE_INTEGER;

                await heartbeat()
                LOGGER.debug("Hearbeat done...");

                lastHeartbeatTimestamp = ts;
            }
        }


        // Very quickly we resolve the batch - as we only get a promise for each of the messages here.
        // However, the offsets will not be commited until the messages are actually fully processed.
        const promises = batch.messages.map( async (msg, index) => {
            if (!isRunning() || isStale()) return

            await doHeartbeatIfNeeded();

            let s = msg.value?.toString();
            let o = s && EJSON.parse(s);

            if (!isIEvent(o)) {
                LOGGER_RECEIVE.error("Received a message, that is not an IEvent. Skipping {}", o);
                return;
            }

            if (LOGGER_RECEIVE.isTraceEnabled()) { LOGGER_RECEIVE.trace("Event {}, topic {}, offset {}", o, batch.topic, msg.offset) }
            else                                 { LOGGER_RECEIVE.debug ("Event {}, topic {}, offset {}", eventToString(o), batch.topic, msg.offset) }

            try {
                const msgOffset = parseInt(msg.offset);
                
                const offsetsForPartition = this.offsets.get(batch.topic + ":_:" + batch.partition);
                
                // Store the offset of the message in the list.
                offsetsForPartition.unprocessedOffsets.add(msgOffset);

                await doHeartbeatIfNeeded();

                // Update the highest seen offset for this topic/parition
                offsetsForPartition.highestSeenOffset = Math.max(msgOffset, offsetsForPartition.highestSeenOffset);

                // Add the event into local event dispatcher and wait until it is finished. 
                await this.localEventDispatcher.queueEvent(o)

                await doHeartbeatIfNeeded();

                // Message was successfully dispatched. 
                // If this message was successfully dispatched and processed, and as result the commited offset should move, we commit the new offset.
                // Why so weird? wouldn't dispatching of every message move the offset? 
                // Well, not necesarily. The messages in the localEventDispatcher queue are reordered to give us best performance possible.
                //          First, all messages that deal with RAW data are dispatched (exp. FileReader).
                //          DataLoaded is processed last.
                // So there is a poosiblity that a DataLoaded with low offset waits for its turn, while FileReady events are processed, 
                // even if they have higher offset

                offsetsForPartition.unprocessedOffsets.remove(msgOffset);

                await doHeartbeatIfNeeded();

                // Get smallest offset of messages that are still waiting to be fully processed
                // If the list of waiting message offsets is empty, we will commit to the highestSeenOffset so far.
                const candidateOffset = (offsetsForPartition.unprocessedOffsets.size()>0) ? offsetsForPartition.unprocessedOffsets.get(0) : offsetsForPartition.highestSeenOffset + 1;

                await doHeartbeatIfNeeded();

                if (offsetsForPartition.lastCommitedOffset<candidateOffset) {
                    LOGGER_RECEIVE.info("Finished event {}. Commiting offset {}. Last commitedOffset {}. Remaining events: {}", eventToString(o), candidateOffset, offsetsForPartition.lastCommitedOffset, offsetsForPartition.unprocessedOffsets.size());

                    offsetsForPartition.lastCommitedOffset = candidateOffset;

                    await this.kafkaConsumer.commitOffsets(
                        [
                            {
                                offset: "" + candidateOffset,
                                partition: batch.partition,
                                topic: batch.topic
                            }
                        ]
                    )
                }
                else {
                    LOGGER_RECEIVE.debug("Finished event {}. Nothing to commit - candidate offset {}, lastCommited {}. Skipping... Remaining events {}", eventToString(o), candidateOffset, offsetsForPartition.lastCommitedOffset, offsetsForPartition.unprocessedOffsets.size());
                }
            }
            catch (error) {
                LOGGER_RECEIVE.fatal("Non-resolvable error {} while distributing event {}. Shutting down...", error, o);

                process.exit(-1);
            }
        })

        // // Setup heartbeat to make sure coordinator knows we're still alive while we're waiting for the promises to resolve
        // const heartbeatHandle = setInterval( async () => {
        //     try {
        //         LOGGER.debug("Hearbeat...");

        //         await heartbeat();
        //     }
        //     catch (error) {
        //          LOGGER_RECEIVE.error("Error while doing hearbeat. ", error);
        //     }
        // }, this.heartbeatInterval)

        // // Clear the timeout when the whole batch finishes...
        // Promise.all(promises).then( () => {
        //     LOGGER_RECEIVE.info("All messages from the batch processed. Clearing the heartbeat handle.")

        //     clearInterval( heartbeatHandle ) 
        // });    
    }

    private async doInitIfNeeded() {
        if (!this.isInitDone) {
            this.isInitDone = true;
            
            LOGGER.debug("Initializing...")

            await this.kafkaConsumer.subscribe({
                topic: this.getTopicNameForEventType(),
                fromBeginning: true
            })

            await this.kafkaConsumer.run({
                eachBatchAutoResolve: true,
                autoCommit: false, 

                eachBatch: (t) => this.batchHandle(t)
            })

            LOGGER.debug("Initializing done...")
        }
    }

    getTopicNameForEventType() {
        return this.hostId + TOPIC_SUFFIX;
    }

    async queueEvent(event: IEvent): Promise<void> {
        if (LOGGER_SEND.isTraceEnabled()) {
            LOGGER_SEND.trace("Queueing event {}", event)
        }
        else {
            LOGGER_SEND.info("Queueing event {}", eventToString(event))
        }

        /** Making sure producer is connected */
        await this.kafkaProducer.connect();

        LOGGER_SEND.debug("Producer connected, sending...")
        const recordMetadata = await this.kafkaProducer.send({
            topic: this.getTopicNameForEventType(),
            acks: 1,
            messages: [
                {
                    key: event.eventType,
                    value: EJSON.stringify(event)
                }
            ]
        })

        LOGGER_SEND.debug("Event sent. Metadata: {}", recordMetadata)
    }

    async addListener(...listeners: IEventListener[]): Promise<void> {
        await this.doInitIfNeeded();

        this.localEventDispatcher.addListener(...listeners);
    }

    constructor(private hostId: string, private moduleName: string, kafkaBrokerHost: string, kafkaBrokerPort: number = 9092, private readonly sessionTimeout = 120000, private readonly heartbeatInterval = 3000) {
        const clientId = moduleName + '@' + hostId;
        
        LOGGER.info("Connecting to broker {}:{} as client {}", kafkaBrokerHost, kafkaBrokerPort, clientId );
        LOGGER.info("  Hearbeat is {}ms, SessionTimeout is {}ms", heartbeatInterval, sessionTimeout);
        
        this.kafkaHandle = new Kafka({
            clientId,
            brokers: [ `${kafkaBrokerHost}:${kafkaBrokerPort}`],
            logCreator: kafkaLogCreator,
            connectionTimeout: 2500,
            authenticationTimeout: 2500
        })
    
        this.kafkaProducer = this.kafkaHandle.producer({
        });

        this.kafkaConsumer = this.kafkaHandle.consumer({
            groupId: clientId, /* In this implementation, each client represents unique group. */
            maxWaitTimeInMs: 1000,
            sessionTimeout,
            heartbeatInterval,                      
        })

        const delayIfNeeded = async () => {
            // Delay the processing of next event, in case new events are to arrive. 
            //   There might be events still in Kafka stream, that were yet not added into the local EventDispatcher, 
            //   but that should have higher priority than the next event in the local queue. 
            //   By delaing a bit here we allow Kafka to dispatch them and load them here, order and merge if needed
            //   We will delay only before processing event of DataReady... 
            // The more events are already in the local queue, the less delay we will introduce.
            if (this.queue.size()>0) {
                const e = this.queue.peek().payload
                if (Events.DataReady.isOfType(e) && e.aggPeriod !== null) {
                    const ms = Math.max(10, 100 - this.queue.size());
                    LOGGER_RECEIVE.debug("Sleeping {}ms before going forward with event {}", ms, eventToString(this.queue.peek().payload))

                    await timeoutPromise(ms);
                }
            }
        }

        this.queue = new ReducingEventQueue();
        this.localEventDispatcher = new EventDispatcher(this.queue, delayIfNeeded);
    }
}
