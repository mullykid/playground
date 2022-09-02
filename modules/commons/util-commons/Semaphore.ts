import Loggers from './logger/index';

let LOGGER = Loggers.getLogger("commons.Semaphore");

export class Semaphore {
    private readonly queue: (() => void)[] = [];
    private capacity: number;

    canAcquire() {
        return (this.capacity>0);
    }
    
    tryAcquire() {
        // There is more capacity available - immediately returning 
        if (this.capacity>0) {
            this.capacity--;
        }
        else {
            throw new Error("No capacity available at this moment.");
        }
    }
    
    async acquireLock() {
        return this.waitForLock();
    }
        
    async waitForLock(timeoutMs?: number) {
        // There is more capacity available - immediately resolving 
        if (this.capacity>0) {
            this.capacity--;

            return Promise.resolve();
        }

        // No capacity available - returning a promise that will be resolved when the release is called
        return new Promise<void>((resolve, reject) => {
            this.queue.push( resolve );

            // If the timeout is defined, adding the timeout that will reject the promise if the time lapses
            if (timeoutMs!==undefined) {
                setTimeout( () => {
                    //Check if the promise is already resolved or it is still waiting
                    let index = this.queue.indexOf(resolve);
                    
                    // Promise is still waiting
                    if (index!==-1) {
                        // Remove it from the waiting queue
                        this.queue.splice(index, 1);
                        
                        // And reject
                        reject("Timeout after " + timeoutMs + "ms");
                    }
                }, timeoutMs );
            }
        })
    }

    release() {
        // Is there anyone else waiting?!
        let resolve = this.queue.shift();
        
        // If yes, then resolving one of the waiting promises
        if (resolve!==undefined) {
            resolve();
        }
        // otherwise increasing the capacity
        else {
            this.capacity++;
        }
    }

    constructor(capacity = 1) {
        this.capacity = capacity;
    }
}