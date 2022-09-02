import { should, expect } from 'chai';

import { isStringIsoDateTime, isStringIsoDate, isStringNumber } from "./TypeValidationUtils"

describe("isStringDate", () => {
    function testDate(s: string|null, exp: boolean) {
        it(s===null ? "NULL" : s, () => {
            expect(isStringIsoDate(s)).equals(exp);
        });
    }
    
    testDate("2010-09", false);    
    testDate("2010-09-09", true);    
    testDate("2010-01-31T10:30Z", false);    
    testDate("2010-02-28T23:59:59Z", false);
    testDate("2010-02-28T23:59:59.312Z", false);
    testDate("2010-02-28T23:59-01:00", false);
    testDate("2010-02-28T23:59:59+00:00", false);
    testDate("2010-02-28T23:59:59.312+03:00", false);
    
    testDate("mark2010-02-28T23:59:59Z", false);
    testDate("Windows VSS-/Chrysler_WIN-2012", false);
    testDate("ziuu", false);
    testDate(null, false);
})


describe("isStringDateTimeIso", () => {
    function testDate(s: string|null, exp: boolean) {
        it(s===null ? "NULL" : s, () => {
            expect(isStringIsoDateTime(s)).equals(exp);
        });
    }
    
    testDate("2010-09-09", true);    
    testDate("2010-01-31T10:30Z", true);    
    testDate("2010-02-28T23:59:59Z", true);
    testDate("2010-02-28T23:59:59.312Z", true);
    testDate("2010-02-28T23:59-01:00", true);
    testDate("2010-02-28T23:59:59+00:00", true);
    testDate("2010-02-28T23:59:59.312+03:00", true);
    
    testDate("mark2010-02-28T23:59:59Z", false);
    testDate("Windows VSS-/Chrysler_WIN-2012", false);
    testDate("ziuu", false);
    testDate(null, false);
})

describe("isStringNumber", () => {
    it("integer", () => {
        expect(isStringNumber("315")).to.be.true;
    })

    it("negative-integer", () => {
        expect(isStringNumber("-81315")).to.be.true;
    })

    it("negative float", () => {
        expect(isStringNumber("-81.315")).to.be.true;
    })

    it("float with padding", () => {
        expect(isStringNumber("   81.99")).to.be.true;
    })

    it("weird chars", () => {
        expect(isStringNumber("209-1")).to.be.false;
    })

    it("no digits", () => {
        expect(isStringNumber("baboo")).to.be.false;
    })

    it("empty string", () => {
        expect(isStringNumber("")).to.be.false;
    })
})

