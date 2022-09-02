import * as Fs from "fs";
import { promisify } from "util";

import Loggers from '../logger/index';
import { parseJson5, deepCopy } from "periscope-commons/ObjectUtils";

const LOGGER = Loggers.getLogger("auth.utils");

export default abstract class ConfigFileBackend<T, PersistedT = T> {
    private filename: string;

    // Initializing with a dummy timestamp
    private lastTimestampMs: number = 0;

    private rawData?: any;
    protected data?: T;

    private timeout: NodeJS.Timeout;

    // Promise that is resolved when the file is loaded for the first time
    // This is being returned when waitForInit() method is called. 
    private waitForInitPromise: Promise<void>;
    
    // Those callbacks are initialized inside the constructor, inside a promise that is immediately executed.
    private waitForDataPromiseResolve = () => {};
    private waitForDataPromiseReject  = (error: any) => {};

    // Initializes defaults in the config data.
    protected fillDefaults(data: PersistedT): T {
        return data as any as T;
    }

    // Does encrypt the config. 
    //    If no encryption was required, returns null
    //    Otherwise return the object with updated data (might be a copy if needed)
    // This can potencially receive any object that is part of the config file, so type validation is essential!
    protected prepareForPersist(data: any): Promise<PersistedT | null > | PersistedT | null {
        return null;
    }
    
    // Processes the updated data. 
    // If forceFileSave is set to true, the file will allways be rewriten. 
    //     This is the typical call from outside the Backend. 
    // If forceFileSave is set to false, the file will be rewriten only if the prepareForPersist modifies the config. 
    //     This will be called when a new contents of the file have been observed
    async updateConfig(data: any, forceFileSave: boolean = true) {
        const dataProcessed = await this.prepareForPersist(deepCopy(data))
        
        // If prepareForPersist returned null, the data is already in correct, readty to persist state.
        this.rawData = dataProcessed || data as PersistedT;

        // FillDefaults receives a copy of the rawData, so that the defaults are not being stored in the rawData object rising being polluted
        // We don't want to use simple ... unwrapping, as the data might be an object or an array
        this.data = await this.fillDefaults(deepCopy(this.rawData));

        // We are delaying the saving of the file in case the fillDefaults throws exception
        // If prepareForPersist returned non-null or we forceFileSave, we can save the config now.
        if (dataProcessed !== null || forceFileSave) {
            await this.writeConfigFile(this.rawData);
        }
        
        // At this stage we have successfully loaded the file. We can resolve the promise now. 
        this.waitForDataPromiseResolve();
    }

    private async writeConfigFile(parsedData: any) {
        LOGGER.info("Rewriting config file {}", this.filename);
        await promisify(Fs.writeFile)(this.filename, JSON.stringify(parsedData, null, "\t"), { encoding: "utf8", mode: 0o600 });

        this.lastTimestampMs = Fs.statSync(this.filename).mtimeMs;
        LOGGER.debug("Saved file Timestamp: {}", this.lastTimestampMs)
    }

    private async reloadIfNeeded() {
        try {
            let configFileStat = await promisify(Fs.stat)(this.filename);

            LOGGER.debug("Timestamp of the file {} is: {}, last observed timestamp is {}", this.filename, configFileStat.mtimeMs, this.lastTimestampMs)

            if (configFileStat.mtimeMs !== this.lastTimestampMs) {
                LOGGER.info("Loading contents from file {}...", this.filename);
    
                // Saving the observed timestamp - we don't want to reload the same file if it is faulty...
                this.lastTimestampMs = configFileStat.mtimeMs;

                let bodyAsString = await promisify(Fs.readFile)(this.filename, { encoding: "utf8" } );
                let body = parseJson5(bodyAsString);

                LOGGER.debug("Parsed data from file {}", this.filename);

                await this.updateConfig(body, false);
            }
        }
        catch (error) {
            LOGGER.error("Could not read the config file {}. Will keep using the old one.", this.filename, error);

            // We rejecting the promise. If this is not first loading of the file, this will have no effect.
            this.waitForDataPromiseReject(error);
        }
    }

    public getData(): T {
        if (this.data===undefined) {
            throw new Error("Config is not initialized.")
        }

        // Returning deep copy so that the client doesn't pollute this data.
        return deepCopy(this.data);
    }

    public getRawData(): PersistedT {
        // Returning deep copy so that the client doesn't pollute this data.
        return deepCopy(this.rawData);
    }

    constructor(filename: string) {
        this.filename = filename;

        // The code inside promise is executed immediately. 
        // It is only when this handler finishes the code outside will resume.
        this.waitForInitPromise = new Promise<void>((resolve, reject) => {
            this.waitForDataPromiseReject = reject;
            this.waitForDataPromiseResolve = resolve;
        })

        // Try to load the config file immediately
        this.reloadIfNeeded();

        this.timeout = setInterval( () => { this.reloadIfNeeded() }, 5000);
    }

    public finalize() {
        this.timeout.unref();
    }

    /**
     * Returns a promise that will resolve when the backend is loaded for the first time.
     * Constructor cannot be async function, so if the Context of the app needs to wait on the loading of the file, 
     * it can await this Promise.
     */
    public waitForInit(): Promise<void> {
        return this.waitForInitPromise;
    }
}

export interface IConfigProvider<T> {
    getData(): T;
    getRawData(): any;

    updateConfig(data: T): void
}
