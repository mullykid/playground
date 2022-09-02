import { formatNumber } from "./FormatUtils";

function scaleValue(value: number, scaleFactor: number) : number;
function scaleValue(value: any, scaleFactor: number) : number | undefined;

function scaleValue(value: any, scaleFactor: number) {
    if (typeof value === "number") {
        return value * scaleFactor;
    }
    else {
        return undefined;
    }
}

export type CapacityUnit = 'B' | 'kB' | 'MB' | 'GB' | 'TB' | 'PB' | 'EB' | 'KiB' | 'MiB' | 'GiB' | 'TiB' | 'PiB' | 'EiB'
export const CAPACITY_UNITS = ([ 'B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB' ] as CapacityUnit[]).sort((a,b)=>b.length-a.length)

export function isCapacityUnit(s: string): s is CapacityUnit {
    return CAPACITY_UNITS.includes(s as any);
}

export type CapacityUnitScale = "1000" | "1024";

const CAPACITY_UNITS_1000: CapacityUnit[] = [ 'B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB' ]
const CAPACITY_UNITS_1000_SCALE = 1000;
const CAPACITY_UNITS_1024: CapacityUnit[] = [ 'B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB' ]
const CAPACITY_UNITS_1024_SCALE = 1024;

const MILLISECONDS_ONE_HOUR = 60*60*1000;
const MILLISECONDS_ONE_DAY = 24*MILLISECONDS_ONE_HOUR;

export function autoscaleCapacityUnits(value: number | undefined | null, sourceUnit: number | CapacityUnit = 1, destUnitType: CapacityUnitScale = "1024") {
    if (value===undefined || value===null) {
        return ""
    }
    
    let sourceUnitScale = (typeof sourceUnit === "number") ? sourceUnit : getCapacityUnitScale(sourceUnit);
    let valueInBytes = value * sourceUnitScale;

    let scaleToUse = destUnitType === "1000" ? CAPACITY_UNITS_1000_SCALE : CAPACITY_UNITS_1024_SCALE;
    let unitsToUse = destUnitType === "1000" ? CAPACITY_UNITS_1000 : CAPACITY_UNITS_1024

    let unitIndex = 0;
    let x = valueInBytes;
    
    while (Math.abs(x) >= 1000) {
        x /= scaleToUse;
        unitIndex++;
    }

    // That is scaled capacity now
    x = scaleCapacityUnits(valueInBytes, 'B', unitsToUse[unitIndex])
    
    let precision = 1;
    if (x<100) {precision=2}
    if (x<10) {precision=3}
    if (x===0) { precision=0 }
    
    return formatNumber(x, precision, precision) + ' ' + unitsToUse[unitIndex]
}

function getCapacityUnitScale(unit: CapacityUnit) {
    let scaleFactor = 1.0;

    switch (unit) {
        case ('PB'): scaleFactor *= 1000.0; 
        case ('TB'): scaleFactor *= 1000.0; 
        case ('GB'): scaleFactor *= 1000.0; 
        case ('MB'): scaleFactor *= 1000.0; 
        case ('kB'): scaleFactor *= 1000.0; 
        break;

        case ('PiB'): scaleFactor *= 1024.0; 
        case ('TiB'): scaleFactor *= 1024.0; 
        case ('GiB'): scaleFactor *= 1024.0; 
        case ('MiB'): scaleFactor *= 1024.0; 
        case ('KiB'): scaleFactor *= 1024.0; 
        break;
    }

    return scaleFactor;
}

function scaleCapacityUnits(value: number, sourceUnit: CapacityUnit | number, destUnit: CapacityUnit): number;
function scaleCapacityUnits(value: any, sourceUnit: CapacityUnit | number, destUnit: CapacityUnit)   : number | undefined;

function scaleCapacityUnits(value: any, sourceUnit: CapacityUnit | number, destUnit: CapacityUnit) {
    let scaleFactor = (typeof sourceUnit === "number" ? sourceUnit : getCapacityUnitScale( sourceUnit )) / getCapacityUnitScale( destUnit );

    return scaleValue(value, scaleFactor);
}

function validateEmail(email: string) {
    var EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    return EMAIL_REGEX.test(email);
}

//returns true if str has at least 1 upper case char.
function hasUpperCase(str: string){
    return ( /[A-Z]/.test(str))
}

//returns true if str has at least 1 lower case char.
function hasLowerCase(str: string){
    return ( /[a-z]/.test(str))
}

//returns true if str has at least 1 number.
function hasNumber(str: string){
    return ( /[0-9]/.test(str))
}

//returns true if str has at least 1 special char.
function hasSpecialCharacter(str: string){
    return /[$&+,:;=?@#|'<>.^*()%!-]/.test(str)
}

/**
 * 
 * @param _d Date to based the result on
 * @param offsetMonths Number of months to move the date (positive => moving to future, negative => moving back)
 */
export function discardTimeAndDay(_d: Date | number, offsetMonths = 0): Date {
    let r = new Date(_d);

    r.setUTCDate(1);
    r.setUTCHours(0);
    r.setUTCMinutes(0);
    r.setUTCSeconds(0);
    r.setUTCMilliseconds(0);

    // Changing the UTC Months now, after the day of the month is set to 1.
    //   We don't have to worry about the day-saving-time changes, as we are constantly operating in UTC.
    //   We don't have to worry about getting into a shorter month (exp. going from March to February), as the day of the month is already set to 1.
    r.setUTCMonth( r.getUTCMonth() + offsetMonths );

    return r;
}

/**
 * 
 * @param _d Date to based the result on
 * @param hour Specific hour that "day" begins  
 * @param offsetMonths Number of months to move the date (positive => moving to future, negative => moving back)
 */
export function setHour(d: Date | number, hour: number, daysOffset = 0): Date {
    let r = new Date(d);

    r.setUTCHours(hour);
    r.setUTCMinutes(0);
    r.setUTCSeconds(0);
    r.setUTCMilliseconds(0);

    r.setUTCDate(r.getUTCDate()+daysOffset);

    return r;
}

export function shiftForward(d: Date | number, shiftHours: number): Date {
    let t = typeof d === "number" ? d : d.getTime()
    t += shiftHours * MILLISECONDS_ONE_HOUR;

    return new Date(t);
}

export function discardTime(d: Date | number, daysOffset = 0): Date {
    let r = new Date(d);

    r.setUTCHours(0);
    r.setUTCMinutes(0);
    r.setUTCSeconds(0);
    r.setUTCMilliseconds(0);

    r.setUTCDate(r.getUTCDate()+daysOffset);

    return r;
}

export function setMidnight(d: Date | number, daysOffset = 0): Date {

    let to = new Date(d);
    to.setUTCHours(23);
    to.setUTCMinutes(59);
    to.setUTCSeconds(59);
    to.setUTCMilliseconds(999);
    return to
}

export function createDayRange(d: Date){
    /* params: d: Date */

    return ({
        from: discardTime(d),
        to: setMidnight(d)
    })
    
}

export function createDateRange(d: Date | number, daysOffset = 0){
    /* params: from: number, to: number. an offsets from todays date */
    return ({
        from: discardTime(d, daysOffset),
        to: setMidnight(d)
    })
    
}

//creates new Cal Day range via param d. Default is today
export function createCalDayDateRange(d: Date, daysOffset = 0){
    /* params: d:Date, monthsOffset = 0 */
    let from = discardTime(d, daysOffset)
    let to = setMidnight(from, daysOffset)
    return ({
        from: from,
        to: to
    })
}

//creates new Cal Week range via param d. Default is this week. Cal Week is Sunday to Saturday.
export function createCalWeekDateRange(d: Date, weeksOffset = 0){
    /* params: d:Date, monthsOffset = 0 */
    let to = discardTime(Date.now(), 7 * weeksOffset);
    to.setTime(to.getTime()-1);

    // Going forward one day until the day is Saturday, 23.59.59.999
    while (to.getUTCDay()!==6) {
        to.setTime(to.getTime()+MILLISECONDS_ONE_DAY);
    }

    let from = discardTime(to);
    from.setUTCDate(from.getUTCDate()-6);
    return ({
        from: from,
        to: to
    })
}

//creates new cal month range via param d. Default is this month. 
export function createCalMonthDateRange(d: Date, monthsOffset = 0){
    /* params: d:Date, monthsOffset = 0 */
    let from = discardTimeAndDay(d, monthsOffset)
    let to = new Date(from)
    to.setUTCMonth(to.getUTCMonth() + 1)
    to.setTime(to.getTime()-1);
    return ({
        from: from,
        to: to
    })
}

export function createInitialDate(from: number, to: number){
    /* params: from: number, to: number. an offsets from todays date */

    return ({
        from: discardTime(new Date(Date.now()), from),
        to: setMidnight(new Date(Date.now()), to),
    })
    
}
export function extractHostnameFromFQDN(s: string) {
    const dotPos = s.indexOf(".");

    if (dotPos>=0) {
        return s.substr(0, dotPos);
    }
    else {
        return s;
    }
}

const K_SCALE = 1000;
// Added decimalPlaces option as the whole number scale leads to incorrect data in charts
export function autoRateUnits(value: number | undefined | null, decimalPlaces?: number) {
    return value !== undefined && value !== null && Math.floor(value / K_SCALE) > 0 ?
        decimalPlaces ? `${(value / K_SCALE).toFixed(decimalPlaces)}k` : `${Math.floor(value / K_SCALE)}k` :
        value
}

export function getPercentage(used: any, total: any) {
    return Math.round((used / total) * 100);
}

export { validateEmail, scaleValue, scaleCapacityUnits, hasUpperCase, hasLowerCase, hasNumber, hasSpecialCharacter };