import { formatDatetimeAsISO, parseDateTimeAsIsoString, formatDateAsISO } from './FormatUtils';

import Loggers from './logger/index';
import { isStringBoolean, isStringIsoDateTime, isStringNumber } from './TypeValidationUtils';
import { SmartSet } from './Collections';
import { EJSON, ObjectId } from 'bson';

const LOGGER = Loggers.getLogger('commons.queryParams')

// This is the prefix that indicates that data behind is encoded with data stream length explicitly specified.
// The length is followed by any of the other prefixes: STRING_PREFIX, OBJECT_PROP_SEPARATOR, EJSON_OBJECT_PREFIX, EJSON_ARRAY_PREFIX or MONGO_OBJECT_ID_PREFIX
//    Exp. ~4_a/b is length of 4 and _a/b - which is an encoded string
//    Exp. ~10/prop1/abc - length is 10, /prop1/abc is an object in simplified notation
//    Exp. ~21[aaa,bbb,ccc,ddd,eee] - length is 21, rest is array 
const ENCODING_PREFIX = "~"

// A prefix that indicates that data succeeding should be decoded as string
const STRING_PREFIX = "_"

// A prefix that indicates that data succeeding should be decoded as object in simplifed notation
const OBJECT_PROP_SEPARATOR = "/"

// A prefix that indicates BSON.ObjectId object
const MONGO_OBJECT_ID_PREFIX = "-"

// A prefix that indicates that data succeesing should be decoded as object/array in EJSON
const ARRAY_OPEN = "(";
const ARRAY_CLOSE = ")";
const ARRAY_SEPARATOR = ","

const NULL = "NULL"
const UNDEF = "UNDEF"

// List of characters that get URI encoded, but we don't want them to be
const CHARS_TO_DECODE = ",/\\"
const CHARS_TO_DECODE_REGEXP = new RegExp( Array.from(CHARS_TO_DECODE).map(encodeURIComponent).join("|"), 'g' )

function encodeURICharacters(s: string) {
    return encodeURIComponent(s).replace(CHARS_TO_DECODE_REGEXP, decodeURIComponent);
}

export type QueryParamType = number | string | Date | boolean | null | object | (QueryParamType | undefined)[]

export function urlBuilder(url: string) {
    return UrlBuilder.getBuilder(url);
}

export class UrlBuilder {
    private url: string;
    private queryParamSeparator: string;

    private morePathParamAllowed = true;
    private parameters = new SmartSet<string>();

    addPathParameter(param: QueryParamType) {
        if (!this.morePathParamAllowed) {
            throw `Cannot add more path parameters to URL ${this.url}`
        }

        this.url += (this.url.endsWith("/") ? '' : '/') + encodeURICharacters(QueryParameters.encodeQueryParameterToSingleString(param))

        return this;
    }

    addQueryParameter(param: string, value: QueryParamType) {
        // The same parameters should not be added multiple times
        if (this.parameters.includes(param)) {
            throw `Invalid parameter. You cannot add param ${param} twice!`
        }

        this.parameters.add(param);

        // Once we start adding query parameters, we cannot add more path parameters anymore
        this.morePathParamAllowed = false;
        
        // If one element array is given, we have to encode it as an array, not rely on url unwrapping
        if (!Array.isArray(value) || value.length===1) {
            value = [ value ]
        }

        for (let singleValue of value as any[]) {
            this.url += `${this.queryParamSeparator}${encodeURICharacters(param)}=${encodeURICharacters(QueryParameters.encodeQueryParameterToSingleString(singleValue))}`;
            this.queryParamSeparator = "&";
        }

        return this;
    }

    public build() {
        return this.url;
    }

    constructor(baseUrl: string) {
        this.url = baseUrl;
        this.queryParamSeparator = baseUrl.indexOf("?")>-1 ? "&" : "?";
    }
    
    public static getBuilder(baseUrl:string) {
        return new UrlBuilder(baseUrl);
    }
}

export class QueryParameters {
    private static encodeString(value: string) {
        return ENCODING_PREFIX + (value.length + STRING_PREFIX.length) + STRING_PREFIX + value;
    }

    private static encodeMongoObjectId(value: ObjectId) {
        const result = MONGO_OBJECT_ID_PREFIX + value.toHexString();
        return ENCODING_PREFIX + result.length + result;
    }
    
    private static encodeArray(value: any[], useJSON: boolean): string {
        const result = ARRAY_OPEN + value.map( (element) => this.encodeQueryParameterToSingleString(element, true)).join(ARRAY_SEPARATOR) + ARRAY_CLOSE;

        LOGGER.trace("Array {} is encoded as {}", value, result);

        if (useJSON) {
            return ENCODING_PREFIX + result.length + result;
        }
        else {
            return result;
        }
    }

    private static encodeObject(value: object) {
        let result = "";

        for (let propName in value) {
            if (propName.indexOf(OBJECT_PROP_SEPARATOR)!==-1) {
                throw `Unfortunately property ${propName} contains ${OBJECT_PROP_SEPARATOR}. Supporting this rare use-case is far too difficult! Refactor your code so that your objects don't have such properties.`
            }

            const propValue = (value as any)[propName];

            if (typeof propValue === "function") { 
                throw `Cannot encode functions. Refactor your code to serialize only data object, without any function. Got function ${propName}: ${propValue}`;
            }

            result += `${OBJECT_PROP_SEPARATOR}${propName}${OBJECT_PROP_SEPARATOR}${this.encodeQueryParameterToSingleString(propValue, false)}`
        }

        return ENCODING_PREFIX + result.length + result;
    }

    public static encodeQueryParameterToSingleString(value: QueryParamType, encodeObjectsWithEJSON = false): string {
        LOGGER.trace("Encoding value {}", value);
        
        if (value === null) {
            return NULL;
        }

        if (value === undefined) {
            return UNDEF;
        }
        
        if ((value as any)._bsontype === "ObjectID") {
            return this.encodeMongoObjectId(value as ObjectId);
        }

        if (value instanceof Date) {
            if (value.getUTCHours() === 0 && value.getUTCMinutes() === 0 && value.getUTCSeconds() === 0 && value.getUTCMilliseconds() === 0) {
                return formatDateAsISO(value as Date);
            }
            else {
                return formatDatetimeAsISO(value, value.getUTCMilliseconds()!==0);
            }
        }
        
        if (typeof value === "number") {
            return "" + value;
        }

        if (typeof value === "boolean") {
            return "" + value;
        }

        if (Array.isArray(value)) {
            return this.encodeArray(value, encodeObjectsWithEJSON);
        }

        if (typeof value === "object") {
            return this.encodeObject(value);
        }

        if (typeof value === "string" ) {
            // Check if the string could be parsed as number. If so, adding the prefix to make sure it won't be casted to number during deserialization
            if (isStringNumber(value)) {
                return this.encodeString(value);
            }
            
            // Check if the string could be parsed as DateTime. If so, adding the prefix to make sure it won't be casted to DateTime during deserialization
            if (isStringIsoDateTime(value)) {
                return this.encodeString(value);
            }

            // Check if the string could be parsed as boolean. If so, adding the prefix to make sure it won't be casted to boolean during deserialization
            if (isStringBoolean(value)) {
                return this.encodeString(value);
            }

            // If string starts or contains special characters, it needs to be also encoded.
            if (value.startsWith(ARRAY_OPEN) || value.includes(ARRAY_CLOSE) || value.startsWith(ENCODING_PREFIX) || value.includes(OBJECT_PROP_SEPARATOR) || value.includes(ARRAY_SEPARATOR)) {
                return this.encodeString(value);
            }

            // Check if the string could be parsed as null. Adding priefix to make sure it is not casted to null
            if (value===NULL || value===UNDEF) {
                return this.encodeString(value);
            }

            // Otherwise it can be simply returned as it for clean representation
            return value;
        }

        throw `Could not determine type of value ${value}. Will not encode.`
    }
    
    /** This should be called only for the query parameters parsed by express.  */
    public static decodeQueryParameterValue(value: string|string[]): any {
        if (!Array.isArray(value)) {
            return this.decodeQueryParameterSingleValue(value);
        }
        else {
            return value.map(v => this.decodeQueryParameterSingleValue(v));
        }
    }

    private static decodeEncoded(stream: string): { decoded: any, restOfStream: string, consumedChars: number } {
        // Reading how many characters we should consume
        const REGEX = new RegExp(`${ENCODING_PREFIX}(\\d+)(${OBJECT_PROP_SEPARATOR}|${STRING_PREFIX}|${MONGO_OBJECT_ID_PREFIX}|\\${ARRAY_OPEN})(.*)`);
        const regex = REGEX.exec(stream);

        if (regex === null) {
            throw `Illegal stream ${stream}: not correctly prefixed.`
        }

        const len = Number.parseInt(regex[1]);

        if (len > regex[3].length + regex[2].length) {
            throw `Illegal stream ${stream}: not enough data in the stream`
        }

        const prefix = regex[2];
        const streamToConsume = regex[3].substring(0, len - prefix.length);
        const restOfStream = regex[3].substring(len - prefix.length);

        let result: any;

        switch (prefix) {
            case STRING_PREFIX: 
                result = streamToConsume;
                break;
            case ARRAY_OPEN:
                result = this.decodeArray(prefix + streamToConsume);
                break;
            case OBJECT_PROP_SEPARATOR:
                result = this.decodeStreamToObject(prefix + streamToConsume);
                break;
            case MONGO_OBJECT_ID_PREFIX:
                result = new ObjectId(streamToConsume);
                break;
            default:
                throw `Illegal prefix ${prefix}`;
        }

        return { decoded: result, restOfStream, consumedChars: stream.length - restOfStream.length };
    }

    private static decodeStreamToObject(value: string) {
        let result: any = {};
        let unprocessedValue = value;

        while (unprocessedValue.startsWith(OBJECT_PROP_SEPARATOR)) {
            // The position of second split separator. Exp. |propName|propValue the pos would be 9
            const pos = unprocessedValue.indexOf(OBJECT_PROP_SEPARATOR, 1);

            if (pos===-1) {
                throw `Illegally encoded object. ${unprocessedValue} doesn't start with ${OBJECT_PROP_SEPARATOR}`
            }

            const propName = unprocessedValue.substring(OBJECT_PROP_SEPARATOR.length, pos);
            const propValueAsString: string = unprocessedValue.substring(pos + OBJECT_PROP_SEPARATOR.length);

            let propValue: any;
            if (propValueAsString.startsWith(ENCODING_PREFIX)) {
                const decoded = this.decodeEncoded(propValueAsString);
                propValue = decoded.decoded;
                unprocessedValue = decoded.restOfStream;
            }
            else {
                // Looking for next separator. Should it be part of the string, it would have been encoded with lenght and decoded above
                const pos = propValueAsString.indexOf(OBJECT_PROP_SEPARATOR);
                if (pos===-1) {
                    propValue = this.decodeQueryParameterSingleValue(propValueAsString);
                    unprocessedValue = "";
                }
                else {
                    propValue = this.decodeQueryParameterSingleValue(propValueAsString.substring(0, pos));
                    unprocessedValue = propValueAsString.substring(pos);
                }
            }
            
            result[propName] = propValue;
        }

        if (unprocessedValue!=='') {
            throw `Incorrect object encoding string ${value}. Leftoever value ${unprocessedValue}`;
        }
        
        return result;
    }

    private static decodeArray(values: string): any[] {
        if (!values.startsWith(ARRAY_OPEN) || !values.endsWith(ARRAY_CLOSE)) {
            throw `Illegaly encoded array ${values}. Missing opening or closing bracket`
        };
        
        values = values.substring(ARRAY_OPEN.length, values.length-ARRAY_CLOSE.length)
        
        let result = [];
        let cursorPos = 0;

        while (cursorPos<values.length) {
            // If there is encoding at current position, decode it.
            if (values.indexOf(ENCODING_PREFIX, cursorPos)===cursorPos) {
                let decoded = this.decodeEncoded(values.substring(cursorPos));

                result.push(decoded.decoded);
                cursorPos += decoded.consumedChars;
            }
            else {
                let pos = values.indexOf(ARRAY_SEPARATOR, cursorPos);

                // ARRAY_SEPARATOR not found - current element spans to the end of the remaining string
                if (pos===-1) {
                    pos = values.length;
                }

                result.push( this.decodeQueryParameterSingleValue( values.substring(cursorPos, pos)) );

                cursorPos=pos;
            }

            // Make sure that we have end of array or ARRAY_SEPARATOR now!
            // This might not be the case if incoming stream is not properly encoded
            const restOfStream = values.substr(cursorPos);
            if (!restOfStream.startsWith(ARRAY_SEPARATOR) && restOfStream!=="") {
                throw `Illegal array stream ${values}. Invalid restOfStream is ${restOfStream}`
            }

            cursorPos+=ARRAY_SEPARATOR.length;
        }

        return result;
    }

    public static decodeQueryParameterSingleValue(value: string): any {
        if (value===NULL) {
            return null;
        }

        if (value===UNDEF) {
            return undefined;
        }

        if (value.startsWith(ENCODING_PREFIX) ) {
            const decoded = this.decodeEncoded(value);

            if (decoded.restOfStream !== "") {
                throw `Illegal encoding ${value} of single value. Stream contains too much data!`
            }

            return decoded.decoded;
        }
        
        let asDate = parseDateTimeAsIsoString(value);
        if (asDate) {
            return asDate;
        }

        if (isStringNumber(value)) {
            return +value;
        }

        if (isStringBoolean(value)) {
            return (value === 'true'); 
        }

        if (value.startsWith(ARRAY_OPEN) && value.endsWith(ARRAY_CLOSE)) {
            return this.decodeArray(value);
        } 
        
        // No special encoding nor condition - returning the string as is
        return value;
    }
    
    public static getTypedQueryParameter(requestQuery: any, name: string): QueryParamType {
        let value = requestQuery[name];

        if (value===undefined) {
            throw new Error("Parameter " + name + "is not defined");
        }

        return this.decodeQueryParameterValue( value );
    }
}
