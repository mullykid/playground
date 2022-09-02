import { should, expect } from 'chai';
import { parseDateTimeAsIsoString, formatDatetimeAsISO } from './FormatUtils';
import { autoscaleCapacityUnits, CapacityUnit, CapacityUnitScale, discardTimeAndDay, createCalMonthDateRange, createCalWeekDateRange, createCalDayDateRange } from './DataUtils';

describe("discardTimeAndDay", () => {
    it("nothing tricky", ()=> {
        let d = parseDateTimeAsIsoString("2010-03-14T03:41:24.111Z") as Date;

        let r = discardTimeAndDay(d);

        // Make sure the discardTimeAndDay returns a copy of Date
        expect(r).not.eq(d);
        expect(d.getUTCMinutes()).eq(41);

        // Make sure the sicardTimeAndDay returns correct value
        expect(formatDatetimeAsISO(r)).eq("2010-03-01T00:00:00Z")
    })    

    it("monthOffset=-1, going into February from March 31st", ()=> {
        let d = parseDateTimeAsIsoString("2010-03-31T03:41:24.111Z") as Date;

        let r = discardTimeAndDay(d, -1);

        // Make sure the discardTimeAndDay returns a copy of Date
        expect(r).not.eq(d);
        expect(d.getUTCMinutes()).eq(41);

        // Make sure the sicardTimeAndDay returns correct value
        expect(formatDatetimeAsISO(r)).eq("2010-02-01T00:00:00Z")
    })    

    it("monthOffset=-1, going into February from March 1st", ()=> {
        let d = parseDateTimeAsIsoString("2010-03-01T03:41:24.111Z") as Date;

        let r = discardTimeAndDay(d, -1);

        // Make sure the discardTimeAndDay returns a copy of Date
        expect(r).not.eq(d);
        expect(d.getUTCMinutes()).eq(41);

        // Make sure the sicardTimeAndDay returns correct value
        expect(formatDatetimeAsISO(r)).eq("2010-02-01T00:00:00Z")
    })    


    it("monthOffset=1, going into April", ()=> {
        let d = parseDateTimeAsIsoString("2010-03-31T03:41:24.111Z") as Date;

        let r = discardTimeAndDay(d, 1);

        // Make sure the sicardTimeAndDay returns correct value
        expect(formatDatetimeAsISO(r)).eq("2010-04-01T00:00:00Z")
    })    

    it("monthOffset=1, going into April from 1st March", ()=> {
        let d = parseDateTimeAsIsoString("2010-03-01T03:41:24.111Z") as Date;

        let r = discardTimeAndDay(d, 1);

        // Make sure the discardTimeAndDay returns a copy of Date
        expect(r).not.eq(d);
        expect(d.getUTCMinutes()).eq(41);

        // Make sure the sicardTimeAndDay returns correct value
        expect(formatDatetimeAsISO(r)).eq("2010-04-01T00:00:00Z")
    })    


    it("monthOffset=14, going into May", ()=> {
        let d = parseDateTimeAsIsoString("2010-03-31T03:41:24.111Z") as Date;

        let r = discardTimeAndDay(d, 1);

        // Make sure the discardTimeAndDay returns a copy of Date
        expect(r).not.eq(d);
        expect(d.getUTCMinutes()).eq(41);

        // Make sure the sicardTimeAndDay returns correct value
        expect(formatDatetimeAsISO(r)).eq("2010-04-01T00:00:00Z")
    })    

})

describe("Autoscale capacity units", () => {
    function doTest(sourceValue: number, sourceUnit: CapacityUnit, destScale: CapacityUnitScale, expResult: string) {
        const name = `${sourceValue} ${sourceUnit} => ${expResult}`
        
        it(name, () => {
            const result = autoscaleCapacityUnits(sourceValue, sourceUnit, destScale);

            expect(result).to.eq(expResult);
        })
    }
    
    doTest(903931, "B", "1000", "903.9 kB");
    doTest(903931, "B", "1024", "882.7 KiB");
    doTest(1500000, "B", "1000", "1.500 MB");
    doTest(1255, "B", "1000", "1.255 kB");
    doTest(1255, "TB", "1000", "1.255 PB");
    doTest(100, "MiB", "1000", "104.8 MB");
    doTest(1255, "TiB", "1024", "1.225 PiB");
    doTest(12550, "B", "1000", "12.55 kB");
    doTest(125510, "B", "1000", "125.5 kB");
    doTest(1255156, "B", "1000", "1.255 MB");
    doTest(1255156, "kB", "1000", "1.255 GB");
    doTest(1255156, "MB", "1000", "1.255 TB");

    // With 1024 based units, the resulting value might fall between 1000 and 1024. 
    // We want to use next unit, so instead of 1023.0 MiB we will put 0.999 GiB. 
    doTest(1023, "B", "1024", "0.999 KiB")
    doTest(1024, "KiB", "1024", "1.000 MiB")
})

describe("createCalDayDateRange", () => {
    let d = parseDateTimeAsIsoString("2022-01-20T03:41:24.111Z") as Date;
    let r = createCalDayDateRange(d)

    expect(formatDatetimeAsISO(r.from)).eq("2022-01-20T00:00:00Z")
    expect(formatDatetimeAsISO(r.to)).eq("2022-01-20T23:59:59Z")

    d = parseDateTimeAsIsoString("2022-01-20T03:41:24.111Z") as Date;
    r = createCalDayDateRange(d, -1)

    expect(formatDatetimeAsISO(r.from)).eq("2022-01-19T00:00:00Z")
    expect(formatDatetimeAsISO(r.to)).eq("2022-01-19T23:59:59Z")

    d = parseDateTimeAsIsoString("2022-01-20T03:41:24.111Z") as Date;
    r = createCalDayDateRange(d, 1)

    expect(formatDatetimeAsISO(r.from)).eq("2022-01-21T00:00:00Z")
    expect(formatDatetimeAsISO(r.to)).eq("2022-01-21T23:59:59Z")
})

describe("createCalWeekDateRange", () => {
    let d = parseDateTimeAsIsoString("2022-01-20T03:41:24.111Z") as Date;
    let r = createCalWeekDateRange(d)

    expect(formatDatetimeAsISO(r.from)).eq("2022-01-16T00:00:00Z")
    expect(formatDatetimeAsISO(r.to)).eq("2022-01-22T23:59:59Z")

    d = parseDateTimeAsIsoString("2022-01-20T03:41:24.111Z") as Date;
    r = createCalWeekDateRange(d, -1)

    expect(formatDatetimeAsISO(r.from)).eq("2022-01-09T00:00:00Z")
    expect(formatDatetimeAsISO(r.to)).eq("2022-01-15T23:59:59Z")

    d = parseDateTimeAsIsoString("2022-01-20T03:41:24.111Z") as Date;
    r = createCalWeekDateRange(d, 1)

    expect(formatDatetimeAsISO(r.from)).eq("2022-01-23T00:00:00Z")
    expect(formatDatetimeAsISO(r.to)).eq("2022-01-29T23:59:59Z")
})

describe("createCalMonthDateRange", () => {
    let d = parseDateTimeAsIsoString("2022-01-20T03:41:24.111Z") as Date;
    let r = createCalMonthDateRange(d)

    expect(formatDatetimeAsISO(r.from)).eq("2022-01-01T00:00:00Z")
    expect(formatDatetimeAsISO(r.to)).eq("2022-01-31T23:59:59Z")

    d = parseDateTimeAsIsoString("2022-01-20T03:41:24.111Z") as Date;
    r = createCalMonthDateRange(d, 1)
    
    expect(formatDatetimeAsISO(r.from)).eq("2022-02-01T00:00:00Z")
    expect(formatDatetimeAsISO(r.to)).eq("2022-02-28T23:59:59Z")

    d = parseDateTimeAsIsoString("2022-01-02T03:41:24.111Z") as Date;
    r = createCalMonthDateRange(d, -1)
    
    expect(formatDatetimeAsISO(r.from)).eq("2021-12-01T00:00:00Z")
    expect(formatDatetimeAsISO(r.to)).eq("2021-12-31T23:59:59Z")
})  

