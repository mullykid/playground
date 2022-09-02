export function timeoutPromise(timeout: number) {
    if (timeout<=0)
        return Promise.resolve();
    
    return new Promise<void>( resolve => {
        setTimeout( () => resolve(), timeout);
    })
}

export class DoNotRetryException {
    private __doNotRetryId = "DoNotRetryId"

    public constructor(public exception: any) {
    }

    public static isOfType(a: any): a is DoNotRetryException {
        return a.__doNotRetryId === "DoNotRetryId";
    }
}

/**
 * Tries to perform the callback function and retry if it fails.
 * 
 * @param maxAttempts Number of times the call should be retired
 * @param callback   Function that should be executed
 * @throws If unsuccessful, the last exception thrown by the callback will be thrown again.
 */
export async function retry<T>(maxAttempts: number, callback: (willRetry: boolean, attemptNo: number) => Promise<T>, timeBetweenTriesMs = 500): Promise<T> {
    let attemptNo = 0;
    while (true) {
        try {
            return await callback(maxAttempts>1, attemptNo++);
        }
        catch (error: any) {
            if (DoNotRetryException.isOfType(error)) {
                throw error.exception;
            }

            if (--maxAttempts <= 0) {
                throw error;
            }

            await timeoutPromise(timeBetweenTriesMs);
        }
    }
}