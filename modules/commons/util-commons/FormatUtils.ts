import { stringify } from './EjsonParser';
export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTH_NAMES_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

export const DATE_FORMAT_MONTH_YEAR = "%n %Y"
export const DATE_FORMAT_SHORT = "%d %n %Y";
export const DATE_FORMAT_ISO_DATE = "%Y-%m-%d"
export const DATE_FORMAT_DATETIME = "%Y-%m-%d %H:%M:%S"
export const DATE_FORMAT_ISO_DATETIME = "%Y-%m-%dT%H:%M:%SZ"
export const DATE_FORMAT_ISO_DATETIME_WITH_MS = "%Y-%m-%dT%H:%M:%S.%LZ"
export const TIMEZONES: Timezone[] = [
    "Pacific/Honolulu",
    "America/Los_Angeles",
    "America/Denver",
    "America/Chicago",
    "America/New_York",        
    "GMT",
    "Europe/London",
    "Europe/Berlin",
    "Europe/Moscow",
    "Asia/Bangkok",
    "Asia/Kolkata",
    "Asia/Shanghai",
    "Asia/Tokyo",
    "Australia/Sydney"
]

export type Timezone = "Pacific/Honolulu" | "America/Los_Angeles" | "America/Denver" | "America/Chicago" | "America/New_York" | "GMT" | "Europe/London" | "Europe/Berlin" | "Europe/Moscow" | "Asia/Bangkok" | "Asia/Kolkata" | "Asia/Shanghai" | "Asia/Tokyo" | "Australia/Sydney"

export function formatNumber(v: number | undefined | null, maxPrecision = 3, minPrecision = 0, useSpaces?: boolean) {
    if (v===undefined || v===null) {
        return v;
    }
    
    // Making sure we have the comma
    let result = v.toFixed(maxPrecision + 1);

    // Removing zeros after the coma until we reach minPrecision
    let precision = maxPrecision + 1;
    while (precision === maxPrecision + 1 || precision > minPrecision && result.substr(result.length - 1) === '0') {
        result = result.substr(0, result.length - 1);
        precision--;
    }

    let coma = result.indexOf('.');
    if (useSpaces || useSpaces === undefined && coma > 4) {
        let spaceIndex = coma - 3;
        while (spaceIndex > 0) {
            result = result.substr(0, spaceIndex) + ' ' + result.substr(spaceIndex);
            spaceIndex -= 3;
        }

        // Add spaces to the fractional part..
        //
        // spaceIndex = result.indexOf('.')+4;
        // while (spaceIndex<result.length) {
        //     result = result.substr(0, spaceIndex)+ ' ' + result.substr(spaceIndex);
        //     spaceIndex += 4;
        // }
    }

    if (result.substring(result.length - 1) === '.') {
        result = result.substr(0, result.length - 1)
    }

    return result;
}

export function removeStartFromString(s: string, ...prefixes: string[]) {
    for (let prefix of prefixes) {
        if (s.startsWith(prefix)) {
            return s.substr(prefix.length);
        }
    }

    return s;
}

export function trimRight(s: string, ...suffixes: string[]) {
    for (let prefix of suffixes) {
        if (s.endsWith(prefix)) {
            return s.substr(0, s.length-prefix.length);
        }
    }

    return s;
}

export function trim(s: string, ...suffixes: string[]) {
    for (let prefix of suffixes) {
        if (s.endsWith(prefix)) {
            return s.substr(0, s.length-prefix.length);
        }

        if (s.startsWith(prefix)) {
            return s.substr(prefix.length);
        }
    }

    return s;
}


export const trimLeft = removeStartFromString;

export function padOrTrimString(s: any, len: number, padding = "0"): string {
    let result = padString(s, len, padding);

    if (result.length > len) {
        result = result.substr(result.length - len);
    }

    return result;
}

function padString(s: any, len: number, padding = "0"): string {
    let ss: string;

    if (typeof s === 'string') {
        ss = s;
    }
    else {
        ss = "" + s;
    }

    for (let i = ss.length; i < len; i++) {
        ss = padding + ss;
    }

    return ss;
}

export function fromCamelCase(s: string): string;
export function fromCamelCase(s: string, capitalize: "yes" | "no" | "leaveAsIs"): string;
export function fromCamelCase(s: string | null | undefined): string | undefined | null;
export function fromCamelCase(s: string | null | undefined, capitalize: "yes" | "no" | "leaveAsIs"): string | undefined | null;

export function fromCamelCase(s: string | null | undefined, capitalize: "yes" | "no" | "leaveAsIs" = "yes"): string | undefined | null {
    if (s===null || s===undefined) {
        return s;
    }
    
    let result = "";
    let newWord = true;

    for (let i = 0; i < s.length; i++) {
        if (s.charAt(i) === "_") {
            result += " ";
            newWord = true;
            i++;
        }
        // If the letter is uppercase
        else if (s.charAt(i).toUpperCase() === s.charAt(i)) {
            result += " ";
            newWord = true;
        }

        if (newWord && capitalize !== "leaveAsIs") {
            if (capitalize === "yes") {
                result += s.charAt(i).toLocaleUpperCase()
            }
            else if (capitalize === "no") {
                result += s.charAt(i).toLocaleLowerCase()
            }
        }
        else {
            result += s.charAt(i);
        }

        newWord = false;
    }

    return result;
}

export function toCamelCase(s: string): string {
    let result = "";
    let nextCapital = false;

    for (let i = 0; i < s.length; i++) {
        if (s.charAt(i) === '(') {
            // If there was a separator before the opening bracket, we want to reset the nextCapital, so the unit in the bracket remains unchaged
            nextCapital = false;
            result += "_(";
            continue;
        }

        if (s.charAt(i) === "$") {
            result += "S";
            nextCapital = true;
            continue;
        }

        if (s.charAt(i) === ' ' || s.charAt(i) === '.') {
            nextCapital = true;
            continue;
        }

        result += i == 0 ? s.charAt(i).toLocaleLowerCase() : (nextCapital ? s.charAt(i).toLocaleUpperCase() : s.charAt(i));
        nextCapital = false;
    }

    return result;

    // return s.substr(0, count).toLocaleLowerCase() + s.substr(count);
}

export function camelize(str: string) {
    return str.toLowerCase().replace(/(?:(^.)|(\s+.))/g, function (match: any) {
        return match.charAt(match.length - 1).toUpperCase();
    });
}

function toUpperCaseFirstChars(s: string, count: number = 1): string {
    return s.substr(0, count).toLocaleUpperCase() + s.substr(count);
}

export function isStringIsoDateTime(s: string | null): boolean {
    return s !== null && matchStringIsoDateTime(s) !== null;
}

export function isStringIsoDate(s: string | null): boolean {
    return s !== null && matchStringIsoDate(s) !== null;
}

function matchStringIsoDate(s: string): RegExpMatchArray | null {
    let regExp = /^(\d{4})-(\d{2})-(\d{2})$/

    return s.match(regExp);
}

function matchStringIsoDateTime(s: string): RegExpMatchArray | null {
    let regExp = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d\d):(\d\d)(?:(:\d\d(?:(.\d\d\d))?))?(?:Z|[+\-]\d\d:\d\d))?$/

    return s.match(regExp);
}

function parseStringToDateWithFormatCheck(s: string | null | undefined, f: (s: string) => boolean): Date | null {
    if (s === null || s === undefined || !f(s)) {
        return null;
    }

    let d = Date.parse(s);

    if (isNaN(d)) {
        return null;
    }

    return new Date(d);
}

export function parseStringAsDate(s: string | null | undefined) {
    return parseStringToDateWithFormatCheck(s, isStringIsoDate)
}

export function parseDateTimeAsIsoString(s: string | null | undefined | Date): Date | null {
    if (s instanceof Date) {
        return s;
    }

    return parseStringToDateWithFormatCheck(s, isStringIsoDateTime)
}

export function formatDateTimeDynamicFormat(date: Date): string {
    if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0 && date.getUTCMilliseconds() === 0) {
        return formatDateAsISO(date);
    }

    return formatDatetimeAsISO(date, date.getUTCMilliseconds() !== 0);
}

export function currentTimestamp() {
    return formatDate(new Date(), DATE_FORMAT_ISO_DATETIME_WITH_MS).replace(/[:-\s\.ZT]/g,"")
}

function formatDateAsISO(date: Date): string;
function formatDateAsISO(date: Date | string): string | null;

function formatDateAsISO(date: Date | string) {
    return formatDate(date, DATE_FORMAT_ISO_DATE);
}

function formatDatetimeAsISO(data: Date, useMilliseconds?: boolean): string;
function formatDatetimeAsISO(data: Date | string, useMilliseconds?: boolean): string | null;

function formatDatetimeAsISO(date: Date | string, useMilliseconds = false) {
    return formatDate(date, useMilliseconds ? DATE_FORMAT_ISO_DATETIME_WITH_MS : DATE_FORMAT_ISO_DATETIME);
}
function formatDate(date: Date, format: string, utcTimeZoneOffsetMins?: number): string;
function formatDate(date: Date | string | null | undefined, format: string, utcTimeZoneOffsetMins?: number): string | null | undefined;

function formatDate(date: Date | string | null | undefined, format: string, utcTimeZoneOffsetMins = 0) {
    if (typeof date === "string") {
        date = parseDateTimeAsIsoString(date);
    }

    if (date === null) {
        return null;
    }

    if (date === undefined) {
        return undefined;
    }

    if (utcTimeZoneOffsetMins !== 0) {
        date = new Date(date.getTime() + utcTimeZoneOffsetMins * 60 * 1000);
    }

    let result = "";

    for (let i = 0; i < format.length; i++) {
        if (format.charAt(i) == '%') {
            switch (format.charAt(++i)) {
                case 'Y': result += date.getUTCFullYear(); break;
                case 'y': result += date.getUTCFullYear().toString().substr(-2); break;
                case 'm': result += padString(date.getUTCMonth() + 1, 2); break;
                case 'n': result += MONTH_NAMES[date.getUTCMonth()]; break;
                case 'N': result += MONTH_NAMES_LONG[date.getUTCMonth()]; break;
                case 'd': result += padString(date.getUTCDate(), 2); break;
                case 'e': result += padString(date.getUTCDate(), 2, " "); break;
                case 'j': result += date.getUTCDay(); break;

                case 'M': result += padString(date.getUTCMinutes(), 2); break;
                case 'H': result += padString(date.getUTCHours(), 2); break;
                case 'Q': result += date.getTime(); break;

                // 00:00 (24h) is 12:00 (am) 
                // 00:03 should be written as 12:03 (am)
                // 12:00 should be written as 12:00 (pm)
                // 12:03 should be written as 12:03 (pm). 
                case 'I': result += padString((date.getUTCHours() == 0 || date.getUTCHours() == 12) ? 12 : date.getUTCHours() % 12, 2); break;
                case 'S': result += padString(date.getUTCSeconds(), 2); break;
                case 'L': result += padString(date.getUTCMilliseconds(), 3); break;
                case 'p': result += date.getUTCHours() >= 12 ? 'pm' : 'am'; break;
            }
        }
        else {
            result += format.charAt(i);
        }
    }

    return result;
}

function format(fmt: string, ...args: any[]): string {
    let unnamedCursor = 0;
    let firstUnprocessedArgument = 0;

    let result = fmt.replace(/{(\d*)}/g, function (match, number) {
        let text = number ? args[number] : (unnamedCursor < args.length ? args[unnamedCursor++] : "{}");
        firstUnprocessedArgument = Math.max(unnamedCursor, firstUnprocessedArgument, number + 1);

        if (text instanceof Date) {
            text = formatDatetimeAsISO(text, text.getUTCMilliseconds() !== 0);
        }
        else if (typeof text === 'object') {
            text = JSON.stringify(text);
        }

        return text;
    });

    if (firstUnprocessedArgument < args.length) {
        let text = args[firstUnprocessedArgument++];

        if (typeof text === 'object') {
            text = JSON.stringify(text);
        }

        result += " " + text;
    }

    return result;
}

//function to receive a props UTC value and format with local timezone for presentation.
function formatForLocalTimezone(date: string | Date | null, format: string) {
    return formatDate(date, format, (new Date()).getTimezoneOffset());
};

function left(s: string | null, length: number) {
    return s ? s.substring(0, length) : null;
}

function right(s: string | null, length: number) {
    return s ? s.substring(s.length > length ? s.length - length : 0) : null;
}

function endsWith(s: string | null, pattern: string) {
    return right(s, pattern.length) === pattern;
}

function startsWith(s: string | null, pattern: string) {
    return left(s, pattern.length) === pattern;
}

export function isStringNumber(s: string) {
    return (s.length > 0) && (+s === +s);
}

export function encodeToCsv(s: any, decimalSeparator: string = "."): string {
    if (typeof s === "string") {
        // Encode each quote character with double quotes
        s = s.replace(/"/g, '""')

        // If there is any special character, we need to put the whole string in quotes 
        // due to localization and encoding, we escape ";" as well
        if (s.match(/[,;\r\n\t"]/) !== null) {
            s = `"${s}"`
        }

        return s;
    }
    else if (typeof s === 'number') {
        let result = stringify(s);
        // Due to localization in Germany, we change decimalSeparator. By default it is "." 
        return result.replace(/\./, decimalSeparator)
    }
    else if (s === undefined || s === null) {
        return ''
    }
    else if (s instanceof Date) {
        // Convert timestamp to days since 1900/1/1
        let time = s.getTime() / 86400000 + 25569;
        return encodeToCsv(time, decimalSeparator)
    }
    else if (typeof s === 'object') {
        return encodeToCsv(JSON.stringify(s), decimalSeparator)
    }
    else {
        return encodeToCsv("" + s, decimalSeparator);
    }
}

export { right, left, endsWith, startsWith, formatForLocalTimezone, padString, formatDate, formatDateAsISO, formatDatetimeAsISO, format, toUpperCaseFirstChars };

/** 
 * function to take a date range and return a formatted string.
 * 
 * @deprecated
 */
export function formatDateRangeToString(v: IDateRange) {
    return `${formatDate(v.from, DATE_FORMAT_SHORT)} - ${formatDate(v.to, DATE_FORMAT_SHORT)}`
}

/** 
 * function to take a date range and return a formatted string.
 * 
 * @param v  Date to format
 * @deprecated use formatDate(v, DATE_FORMAT_SHORT) directly.
 */
export function formatDateToString(v: Date) {
    return formatDate(v, DATE_FORMAT_SHORT);
}

/**
 * @param v  Date to format
 * @deprecated use formatDate(v, DATE_FORMAT_MONTH_YEAR)
 */
export function formatDateToStringMonthly(v: Date) {
    return formatDate(v, DATE_FORMAT_MONTH_YEAR);
}


interface IDateRange {
    from: Date,
    to: Date
}

export function percentFormatter(v: number | undefined | null, digits = 1): string {
    if (v === undefined || v === null) {
        return "";
    }

    return Math.round(v * 100 * Math.pow(10, digits)) / Math.pow(10, digits) + "%";
}

/**
 * 
 * @param toSplit 
 * @param separators 
 * @param escapeCharacter 
 */
export function split(toSplit: string, separators: string | string[], escapeCharacter = '\\'): string[] {
    let result = [] as string[];

    let sepArray = Array.isArray(separators) ? separators : [separators];

    let iBeg = 0;
    for (let iCur = 0; iCur <= toSplit.length; iCur++) {
        // We found escape character. 
        // Skipping processing of the escape and the next one after escape character and starting over.
        if (toSplit.substr(iCur, 1) === escapeCharacter) {
            iCur++;
            continue;
        }

        // We have found separator
        if (iCur === toSplit.length || sepArray.includes(toSplit.substr(iCur, 1))) {
            result.push(toSplit.substring(iBeg, iCur));

            iBeg = iCur + 1;
        }
    }

    return result;
}

export function splitOnCamelCase(s: string) {
    return fromCamelCase(s, "leaveAsIs").split(" ");

    // return s.split(/(?<!(^|[A-Z]))(?=[A-Z])|(?<!^)(?=[A-Z][a-z])/).filter(v => v !== undefined)
}

export function yearMonth2String(s: string, delimiter: string) {
    let digits = s.split(delimiter)
    return `${MONTH_NAMES[parseInt(digits[1]) - 1]} ${digits[0]}`
}