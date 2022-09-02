import * as Bson from "bson";
import { parseDateTimeAsIsoString, formatDatetimeAsISO } from "./FormatUtils";

const CODECS: { [name: string]: (value: any) => any } = {
    "$oid": (value: string) => new Bson.ObjectID(value),
    "$numberInt": (value: number|string) => typeof value === "number" ? value : parseInt(value),
    "$numberLong": (value: number|string) => typeof value === "number" ? value : parseInt(value),
    "$numberDouble": (value: number|string) => typeof value === "number" ? value : parseFloat(value),
    "$date": (value: number | string) => typeof value === "number" ? new Date(value) : parseDateTimeAsIsoString(value)
}


export function deserializeValue(key: string, value: any) {
    if (typeof value === "object" && value!==null) {
        for (let codecName in CODECS) {
            if (value[codecName]!==undefined) {
                let valueCandidate = CODECS[codecName](value[codecName]);

                return valueCandidate;
            }
        }
    }

    return value;
}

export function replaceValue(this: any, key: string, value: any) {
    if (this[key] && this[key]._bsontype) {
        if (this[key]._bsontype==="ObjectID") {
            return { "$oid": value };
        }
    }

    if (this[key]  instanceof Date) {
        return { "$date": formatDatetimeAsISO(value, true) };
    }

    return value;
}

export function stringify(object: any, space?: string) {
    return JSON.stringify(object, replaceValue, space);
}

export function parse(text: string) {
    return JSON.parse(text, deserializeValue);
}