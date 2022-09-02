import { should, expect } from 'chai';

import { Semaphore } from "../Semaphore";
import { timeoutPromise } from '../PromiseUtils';

describe("Semaphore", () => {
    it("canAquireLock", async () => {
        let lock = new Semaphore(1);

        // Claim lock for 0.1 secs
        claimLockAndStall(lock, 100);
        
        expect(lock.canAcquire()).to.be.false;

        await timeoutPromise(200);

        expect(lock.canAcquire()).to.be.true;
    })

    it("tryLock", async ()=> {
        let lock = new Semaphore(1);

        // Claim lock for 0.1 secs
        claimLockAndStall(lock, 100);
        
        try {
            lock.tryAcquire()
            fail("Exected exception");
        } 
        catch (e) {
            // All OK
        }
        
        await timeoutPromise(200);

        lock.tryAcquire();
    })

    it("waitForLock", async ()=> {
        let lock = new Semaphore(1);

        // Claim lock for 0.1 secs
        claimLockAndStall(lock, 400);
        
        let time = Date.now();
        try {
            // This should not acquire the lock and throw an exception instead
            await lock.waitForLock(300)
            fail("Exected exception");
        } 
        catch (e) {
            // The exception above should be thrown in approximately 300ms 
            let timeEnd = Date.now();
            let duration = timeEnd-time;
            
            expect(Math.abs(duration-300)<30).to.be.true;
        }

        // This should resolve just fine
        await lock.waitForLock(1000)
    })
})

async function claimLockAndStall(semaphore: Semaphore, time: number) {
    semaphore.acquireLock();

    return new Promise<void>((resolve, reject) => {
        setTimeout(()=>{ semaphore.release(); resolve() }, time);
    })
}
