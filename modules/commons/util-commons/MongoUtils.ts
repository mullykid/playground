/**
 * This module provides a wrapper around Mongo interface. 
 * The benefit of using this is when the mongo interface fails with 'Topology was destroyed' error. Typically this brings the 
 * 
 * The biggest change is the connection caching and reestablishing.
 * If the connectivity is lost, it tries to restablish it. 
 * If the connectivity cannot be established, the service is immediately terminated - so that Docker can restart it.  
 */

import * as Mongo from 'mongodb';

import Loggers from './logger/index';
import { format } from './FormatUtils';
import { timeoutPromise } from './PromiseUtils';

const LOGGER = Loggers.getLogger('commons.MongoUtils')

export type IMongoConnection = Mongo.Db;


/** 
 * Those map directly to all possible arguments configuration for initializeMongo. 
 * 
 * The arg1 will either be url or host. 
 * The arg2 might be database or port
 * The arg3 might be undefined or database
 * 
 * This function, based on the types of supplied arguments, will determine which maps to which and returns and array that contains:
 *   - url
 *   - database name
 */
function paserMongoConnectionParams(arg1: string, arg2: string | number, arg3: string | undefined): [ string, string ] {
    if (typeof arg1 === 'string' && typeof arg2 === 'string' && arg3 === undefined) {
        return [ arg1, arg2 ]
    }

    if (typeof arg1 === 'string' && typeof arg2 === 'number' && typeof arg3 === 'string') {
        const url = "mongodb://" + arg1 + ":" + arg2;

        return [ url, arg3 ]
    }

    throw `Cannot determine MongoDb parameters from config: ${arg1} ${arg2} ${arg3}`
}

/** Won't use wrapper unless explicitly reqested */
function initializeMongo(url: string, database: string): Promise<IMongoConnection>;
function initializeMongo(host: string, port: number, database: string): Promise<IMongoConnection>;

async function initializeMongo(arg1: string, arg2: string | number, arg3?: string): Promise<IMongoConnection> {
    const [ url, database ] = paserMongoConnectionParams(arg1, arg2, arg3);

    return initializeMongoNative(url, database);
}

let isInitTest = true;
async function testDb(url: string, database: string, db: Mongo.Db) {
    try {
        // Validate if we can read from that connection
        const collections = await db.collections();
        LOGGER.debug("Successfully validated connection to {}/{}. Found {} collections", url, database, collections.length);

        isInitTest = false;

        return db;
    }
    catch (error) {
        LOGGER.error("Could not connect to MongoDB at {}. Shutting down {}.", url, isInitTest ? "in 5 secs" : "");
        
        if (isInitTest) {
            await timeoutPromise(5000);
        }
        
        process.exit(-1);
    }
}

function initializeMongoNative(url: string, database: string): Promise<Mongo.Db>;
function initializeMongoNative(host: string, port: number, database: string): Promise<Mongo.Db>;

async function initializeMongoNative(urlOrHost: string, databaseOrPort: string | number, _database?: string): Promise<Mongo.Db> {
    let url = "";
    let database: string;

    if (typeof databaseOrPort==='string') {
        url = urlOrHost;
        database = databaseOrPort;
    }
    else {
        url = "mongodb://" + urlOrHost + ":" + databaseOrPort;
        database = _database!
    }

    try {
        LOGGER.debug("Connecting to {}, database {}", url, database)

        const client = await Mongo.MongoClient.connect( url,  { useNewUrlParser: true, useUnifiedTopology: true } as any as Mongo.MongoClientOptions)
        const db = await client.db( database );
    
        await testDb(url, database, db);
        setInterval( ()=> testDb(url, database, db), 15000);

        return db;
    }
    catch (error) {
        LOGGER.error("Could not connect to MongoDB at {}. Shutting down in 5 secs.", url);
        await timeoutPromise(5000);
        
        process.exit(-1);
    }
}

export function stringifyForShell(query: any, space?: string | number) {
    // We need the second replace because JSON.strigify would return something 
    // like this: "$gte": "ISODate(\"2021-07-01T00:00:00Z\")"
    // we want:   "$gte": ISODate("2021-07-01T00:00:00Z")

    return JSON.stringify(query, replacer, space).replace( /\"ISODate\(([^\)]+)\)\"/g, (match, dateAsString: string) => `ISODate("${dateAsString}")`); 
}

function replacer(this: any, key: string, value: any) {
    if (this[key] instanceof Date) {
        return format('ISODate({})', this[key])
    }
    else {
        return value;
    }
}

export { initializeMongo, initializeMongoNative }