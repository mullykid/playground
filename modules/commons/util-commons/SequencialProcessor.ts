import LOGGERS from './logger/index'
import { Queue } from './Collections'

const LOGGER = LOGGERS.getLogger("commons.SequencialProcessor")

export default class SequencialProcessor<T> {
    private isProcessQueueRunning = false;
    private isStopped = false;

    constructor(private queue: Queue<T>, private process: (elem: T) => Promise<void> | void, private preprocess?: undefined | (() => Promise<void> | void) ) {
    }

    push(elem: T): boolean {
        let result = this.queue.push(elem);

        // If the processQueue was not running (asyncronously) anymore and processor wasn't stopped - we need to start it again
        if (!this.isProcessQueueRunning && !this.isStopped) {
            LOGGER.debug("Added element to a sleeping processing queue. Resuming...")

            this.processQueue();
        }
        else {
            if (LOGGER.isDebugEnabled()) {
                LOGGER.debug("Added elemenent to queue. Queue is {} and has now {} elements.", this.isStopped ? "stopped" : "already running", this.queue.size());
            }
        }

        return result;
    }

    stop() {
        this.isStopped = true;
    }

    resume() {
        this.isStopped = false;

        if (!this.isProcessQueueRunning) {
            this.processQueue();
        }
    }

    private async processQueue() {
        this.isProcessQueueRunning = true;

        try {
            while (this.queue.hasMore() && !this.isStopped) {
                if (this.preprocess) {
                    await this.preprocess()
                }

                // When it is time to process the element
                //   Take the element from the list
                //   Start processing
                //   Wait until this is finished
                await this.process(this.queue.pop());
            }
        }
        finally {
            this.isProcessQueueRunning = false;

            LOGGER.info("Queue empty. Sleeping...")
        }
    }

    toArray(): T[] {
        return this.queue.toArray();
    }

    size() {
        return this.queue.size();
    }
}