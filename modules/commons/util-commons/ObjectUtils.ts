import { ILogger } from "./logger/Logger";

import * as Crypto from "crypto";

export function defValue<T>(x: T | null | undefined, defValue: T): T;
export function defValue<T>(x: T | null | undefined, x1: T | null | undefined, defValue: T): T;
export function defValue<T>(x: T | null | undefined, x1: T | null | undefined, x2: T | null | undefined, defValue: T): T;

export function defValue<T>(...x: any[]): any {
    for (let i = 0; i < x.length; i++) {
        let v = x[i];
        if (i == x.length - 1 || v !== undefined && v !== null) {
            return v;
        }
    }

    throw "Invalid parameters"
}

/**
 * Function takes an object, inspects its methods and binds those that start with a prefix 'on', for instance onPageChange.
 * This is very useful when you are constantly adding/removing numerous handlers
 * 
 * @param object Object of which handers should be bound
 */
export function bindHandlers(object: any, logger?: ILogger) {
    _bindHandlers(object, Object.getPrototypeOf(object), logger);
}

function _bindHandlers(object: any, prototype: any, logger?: ILogger) {
    let prototypeClassName = prototype.constructor.name;

    // If we have Object, we've reached the bottom of the tree
    // If we have Component, we got to React.Component (a bit hacky, but hey - works...)
    if (prototypeClassName === "Object" || prototypeClassName === "Component") {
        return;
    }

    Object.getOwnPropertyNames(prototype).forEach(propertyName => {
        // If property is a function and follows naming pattern onXxxxXxxxXXx, it will get bound
        if (/on[A-Z].*/.test(propertyName) && typeof object[propertyName] === 'function') {
            if (logger !== undefined) {
                let fun = object[propertyName].bind(object);

                object[propertyName] = function () {
                    logger.trace("bindHandlers-wrapper: {} entering", propertyName, arguments);

                    let result = fun(...arguments);

                    logger.trace("bindHandlers-wrapper: {} finished with result", propertyName, result, arguments);

                    return result;
                };
            }
            else {
                object[propertyName] = object[propertyName].bind(object);
            }
        }
    });

    _bindHandlers(object, Object.getPrototypeOf(prototype), logger);
}

export function getIsoWeek(d: Date) {
    let date = new Date(d.getTime());

    date.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    // January 4 is always in week 1.
    var week1 = new Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
        - 3 + (week1.getDay() + 6) % 7) / 7);
}

export function getIsoWeekYear(d: Date) {
    let date = new Date(d.getTime());

    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    return date.getFullYear();
}

export function setPropValue<T>(object: T, value: any, propName: string | string[]) {
    if (typeof propName === 'string') {
        propName = propName.split("\.");
    }

    return _setPropValue(object, value, propName, 0)
}

function _setPropValue<T>(_object: T, value: any, propName: string[], skip: number): T {
    // A Type hack.
    let object = _object as any;
    let localPropName = propName[skip];

    if (propName.length === skip + 1) {
        if (value === undefined) {
            delete object[localPropName]
        }
        else {
            object[localPropName] = value;
        }

        return object;
    }
    else {
        if (object[localPropName] === undefined || object[localPropName] === null || typeof object[localPropName] !== 'object') {
            object[localPropName] = {};
        }

        return _setPropValue(object[localPropName], value, propName, skip + 1);
    }
}

export function getPropValue(object: any, propName: string | string[], defValue?: any) {
    if (typeof propName === 'string') {
        propName = propName.split("\.");
    }

    return _getPropValue(object, propName, defValue, 0)
}

function _getPropValue(object: any, propName: string[], defValue: any, skip: number): any {
    if (propName.length === skip) {
        return object;
    }

    if (object !== null && propName[skip] in object) {
        return _getPropValue(object[propName[skip]], propName, defValue, skip + 1);
    }
    else {
        return defValue;
    }
}

export function castToArray<T>(data: undefined | T | T[]): T[] {
    if (data === undefined) {
        return [];
    }

    if (Array.isArray(data)) {
        return data;
    }

    return [data];
}

export function prefixObjectProps(filter: any | null | undefined, prefix: string): { [name: string]: any } {
    let result: any = {};

    if (filter) {
        for (let key in filter) {
            result[prefix + key] = filter[key]
        }
    }

    return result;
}

export function prefixObjectPropsForSpecificFilter(filter: any | null | undefined, prefix: string, specificValue: string): { [name: string]: any } {
    let result: any = {};

    if (filter) {
        for (let key in filter) {
            if (key.startsWith(specificValue)) {
                result[specificValue.replace('_', '') + prefix + key.split(specificValue)[1]] = filter[key]
            } else
                result[prefix + key] = filter[key]
        }
    }

    return result;
}

export function deepCopy<T>(object: T): T {
    if (object instanceof Date) {
        return new Date(object.getTime()) as any;
    }

    if (typeof object === "number" || typeof object === "string" || object === null || object === undefined) {
        return object;
    }

    if (Array.isArray(object)) {
        return (object as any[]).map(v => deepCopy(v)) as unknown as T
    }

    if (typeof object === "object") {
        let result: any = {};
        for (let propName in object) {
            let propValue = object[propName];

            result[propName] = deepCopy(propValue);
        }

        return result;
    }

    return object;
}

export function arraysEqual(a: any, b: any) {
    if (a === b) {
        return true;
    }

    if (a.length === undefined || b.length === undefined || a.length !== b.length) {
        return false;
    }

    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
}

export function hash(filter: any, force = false) {
    if (!force && (!filter || typeof filter !== 'object')) {
        return "" + filter
    }

    let hash_ = Crypto.createHash('md5');

    hash_.update(JSON.stringify(filter), 'utf8');
    return hash_.digest("hex");
}

export function hashEq(a: any, b: any) {
    if (a === b) {
        return true;
    }

    return hash(a) === hash(b);
}

export function parseJson5(s: string) {
    return Function('"use strict";return (' + s + ')')();
}

export function createMapFromArray<T>(data: T[] | Iterable<T>, idGen: (v: T) => string): { [id: string]: T } {
    const result = {} as { [id: string]: T }

    for (const v of data) {
        result[idGen(v)] = v;       
    }

    return result;
}