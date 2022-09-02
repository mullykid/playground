export function isArrayOfType<T>(a: any, f: (v: any) => v is T): a is T[] {
    if (!Array.isArray(a)) return false;

    for (const v of a) {
        if (!f(v)) return false;
    }

    return true;
}

function matchStringIsoDate(s: string): RegExpMatchArray|null  {
    let regExp = /^(\d{4})-(\d{2})-(\d{2})$/

    return s.match(regExp);
}

function matchStringIsoDateTime(s: string): RegExpMatchArray|null  {
    let regExp = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d\d):(\d\d)(?:(:\d\d(?:(.\d\d\d))?))?(?:Z|[+\-]\d\d:\d\d))?$/

    return s.match(regExp);
}

export function isStringNumber(s: string|null|undefined) {
    return !!s && (+s === +s);
}

export function isStringIsoDateTime(s: string|null|undefined): boolean {
    return !!s && matchStringIsoDateTime(s) !== null;
}

export function isStringIsoDate(s: string|null|undefined): boolean {
    return !!s && matchStringIsoDate(s) !== null;
}

export function isStringBoolean(s: string|null|undefined) {
    return !!s && ['true', 'false'].includes(s.toLocaleLowerCase())
}

export function getAsType<T>(value: any, p: (v:any) => v is T, errorMsg?: string) {
    if (p(value)) { return value }

    throw errorMsg || `TypeError: Value ${value} cannot be casted to required type`
}

export function getAsArrayOfType<T>(value: any, p: (v:any) => T, errorMsg?: string) {
    if (!Array.isArray(value)) {
        throw errorMsg || `TypeError: Value ${value} expected to be an array`
    }

    return value.map(p);
}

export function getAsNumber(a: any, fieldName?: string) {
    if (typeof a === "number") { return a; }
    if (typeof a === "string" && isStringNumber(a)) { return Number.parseFloat(a); }

    throw `TypeError: ${fieldName ? ` Getting field ${fieldName}: ` : ""}Value ${a} cannot be casted to number`
}

export function getAsString(a: any, fieldName?: string) {
    if (typeof a === "string") { return a };

    throw `TypeError: ${fieldName ? ` Getting field ${fieldName}: ` : ""}Value ${a} cannot be casted to string`
}

export function getAsDate(a: any, fieldName?: string) {
    if (typeof a === "string") {
        if (isStringIsoDateTime(a)) { return new Date(a) }
        else if (isStringNumber(a)) { a = Number.parseFloat(a) }
        else {
            const d = new Date(a);
            if (!isNaN(d as any)) { return d }
        }
    }
    
    if (typeof a === "number" ) { 
        if (a>1e+7) { return new Date(a); }
        else        { return new Date(a*1000); }
    }
    
    if (a?.getUTCMilliseconds !== undefined && a instanceof Date) { return a }

    throw `TypeError: ${fieldName ? ` Getting field ${fieldName}: ` : ""}Value ${a} cannot be casted to Date`
}

export function getAsBoolean(a: any, fieldName?: string) {
    if (typeof a === "string" && isStringBoolean(a)) { return 'true'===a.toLocaleLowerCase() }
    if (typeof a === "boolean") { return a }

    throw `TypeError: ${fieldName ? ` Getting field ${fieldName}: ` : ""}Value ${a} cannot be casted to boolean`
}

export function allowNull<T>(castFunction:(a: any, errorMsg?: string) => T, a: any, errorMsg?: string) {
    if (a===null) return a;
    return castFunction(a, errorMsg);
}

export function allowUndefined<T>(castFunction:(a: any, errorMsg?: string) => T, a: any, errorMsg?: string) {
    if (a===undefined) return a;
    return castFunction(a, errorMsg);
}

export function allowUndefinedOrNull<T>(castFunction:(a: any, errorMsg?: string) => T, a: any, errorMsg?: string) {
    if (a===undefined || a===null) return a;
    return castFunction(a, errorMsg);
}

export function emptyToUndef(a: any): any {
    if (a==="") return undefined;
    return a;
}