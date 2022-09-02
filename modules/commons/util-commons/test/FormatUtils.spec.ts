import * as FormatUtils from '../FormatUtils';

import { should, expect } from 'chai';

describe("FormatUtils.padString", ()=> {
    it("Pad shorter string", ()=>{
        expect(FormatUtils.padString("762", 10)).equals("0000000762");
    })

    it("Pad longer string", ()=>{
        expect(FormatUtils.padString("This is very long string", 10)).equals("This is very long string");
    })

    it("Pad short number", ()=>{
        expect(FormatUtils.padString(572, 5)).equals("00572");
    })

    it("Pad float number", ()=>{
        expect(FormatUtils.padString(572.721, 8)).equals("0572.721");
    })

    it("Pad with spaces", ()=>{
        expect(FormatUtils.padString("short", 8, " ")).equals("   short");
    })
})

describe("FormatUtils.isStringDate", () => {
    function testDate(s: string|null, exp: boolean) {
        it(s===null ? "NULL" : s, () => {
            expect(FormatUtils.isStringIsoDate(s)).equals(exp);
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


describe("FormatUtils.isStringDateTimeIso", () => {
    function testDate(s: string|null, exp: boolean) {
        it(s===null ? "NULL" : s, () => {
            expect(FormatUtils.isStringIsoDateTime(s)).equals(exp);
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


describe("FormatUtils.parseDateTimeAsIsoString", ()=>{
    function testDate(s: string|null, y?: number,m?: number,d?: number,hour: number = 0, min: number=0,sec: number=0,millis: number=0) {
        it((s===null ? "NULL" : s), () => {
            let date = FormatUtils.parseDateTimeAsIsoString(s);
    
            if (y!==undefined) {
                expect(date).is.not.null;
    
                if (date!==null) {
                    expect(date.getUTCFullYear()).equals(y);
                    expect(date.getUTCMonth()+1).equals(m);
                    expect(date.getUTCDate()).equals(d);
    
                    expect(date.getUTCHours()).equals(hour);
                    expect(date.getUTCMinutes()).equals(min);
    
                    expect(date.getUTCSeconds()).equals(sec);
                    expect(date.getUTCMilliseconds()).equals(millis);
                }
            }
            else {
                expect(date).is.null;
            }
        });
    }

    testDate("2010-09-09", 2010, 9, 9);    
    testDate("2010-01-31T10:30Z", 2010, 1, 31, 10, 30, 0);    
    testDate("2010-02-28T23:59:59Z", 2010, 2, 28, 23, 59, 59);
    testDate("2010-02-28T23:59:59.481Z", 2010, 2, 28, 23, 59, 59, 481);
    testDate("2010-02-28T23:59:59.312+03:00", 2010, 2, 28, 20, 59, 59, 312);
    testDate("2010-02-28T12:59-06:00", 2010, 2, 28, 18, 59, 0, 0);

    // Strings with date-like formatting, but incorrect data inside
    // Unfortunately, the engine passes dates like 31st April (which gets parsed as 1st May), 30th Febuary (1st or 2nd March) etc.
    testDate("2010-17-28T23:59:59Z");
    testDate("2010-11-28T25:59:59Z");
    testDate("2019-04-32T21:59:59Z");

    testDate("mark2010-02-28T23:59:59Z");
    testDate("Windows VSS-/Chrysler_WIN-2012");
    testDate("ziuu");
    testDate(null);
});

describe("FormatUtils.format", ()=>{
    it("format", ()=> {
        let r = FormatUtils.format("This {0} is awesome {1}.", "text", 2);

        expect(r).equals("This text is awesome 2.");
    })

    it("format - too little values", ()=> {
        let r = FormatUtils.format("This {0} is awesome {1}.", "text");

        expect(r).equals("This text is awesome undefined.");
    })

    it("format - null values", ()=> {
        let r = FormatUtils.format("{0}_{1}_{0}.", null, undefined);

        expect(r).equals("null_undefined_null.");
    })

    it("format - without numbers", ()=> {
        let r = FormatUtils.format("{}_{}_{}.", "foo", 13, "bar");

        expect(r).equals("foo_13_bar.");
    })

    it("format - to many values", ()=> {
        let r = FormatUtils.format("Ju{}{}", "ji", "tsu", "san!");

        expect(r).equals("Jujitsu san!");
    })

    it("format - datetime", ()=> {
        let d = new Date(1565644840750);
        let r = FormatUtils.format("Date is {}", d);
        expect(r).equals("Date is 2019-08-12T21:20:40.750Z");
    })

    it("format - infinity", ()=> {
        let d = Number.POSITIVE_INFINITY;
        let r = FormatUtils.format("Infinity is {}, Negative Infinity is {}", d, -d);

        expect(r).eq("Infinity is Infinity, Negative Infinity is -Infinity")
    })
});

describe("FormatUtils.toCamelCase", () => {
    it("single word", () => {
        expect(FormatUtils.toCamelCase("Marysia")).to.equal("marysia");
    })

    it("two words", () => {
        expect(FormatUtils.toCamelCase("Marysia mala")).to.equal("marysiaMala");
    })

    it("two words with Unit", () => {
        expect(FormatUtils.toCamelCase("Post Capacity (B)")).to.equal("postCapacity_(B)");
    })

    it("two words with long Unit", () => {
        expect(FormatUtils.toCamelCase("Post Capacity (KB)")).to.equal("postCapacity_(KB)");
        expect(FormatUtils.toCamelCase("Post Capacity (KiB)")).to.equal("postCapacity_(KiB)");
    })

    it("duration", () => {
        expect(FormatUtils.toCamelCase("Duration (second)")).to.equal("duration_(second)");
    })

    it("Text Already In Camel Case", () => {
        expect(FormatUtils.toCamelCase("textAlreadyInCamelCase")).to.equal("textAlreadyInCamelCase");
    })

    it("used_capacity_GB", () => {
        expect(FormatUtils.toCamelCase("used_capacity_GB")).to.equal("used_capacity_GB");
    })

    it("with.dot", () => {
        expect(FormatUtils.toCamelCase("with.dot")).to.eq("withDot");
        expect(FormatUtils.toCamelCase('Tier-3 total Anzahl Tapes (1.Kopie)')).to.eq("tier-3TotalAnzahlTapes_(1Kopie)");
        expect(FormatUtils.toCamelCase("tier-3 total (1.Kopie)_GB")).to.equal("tier-3Total_(1Kopie)_GB")
    })

    it("with.$.sign", () => {
        expect(FormatUtils.toCamelCase("with $ sign")).to.eq("withSSign");
    })
})

describe("FormatUtils.fromCamelCase", ()=> {
    it("singleWord", () => {
        expect(FormatUtils.fromCamelCase("sample")).eq("Sample");
    })

    it("twoWords", () => {
        expect(FormatUtils.fromCamelCase("sampleText")).eq("Sample Text");
    })

    it("twoWords, no capitalization", () => {
        expect(FormatUtils.fromCamelCase("sampleText", "no")).eq("sample text");
    })

    it("twoWords, capitalizion leaveAsIs", () => {
        expect(FormatUtils.fromCamelCase("sampleTextTwo_two", "leaveAsIs")).eq("sample Text Two two");
    })

    it("two_words", () => {
        expect(FormatUtils.fromCamelCase("sample_text")).eq("Sample Text");
    })
});

describe("FormatUtils.isStringNumber", () => {
    it("integer", () => {
        expect(FormatUtils.isStringNumber("315")).to.be.true;
    })

    it("negative-integer", () => {
        expect(FormatUtils.isStringNumber("-81315")).to.be.true;
    })

    it("negative float", () => {
        expect(FormatUtils.isStringNumber("-81.315")).to.be.true;
    })

    it("float with padding", () => {
        expect(FormatUtils.isStringNumber("   81.99")).to.be.true;
    })

    it("weird chars", () => {
        expect(FormatUtils.isStringNumber("209-1")).to.be.false;
    })

    it("no digits", () => {
        expect(FormatUtils.isStringNumber("baboo")).to.be.false;
    })

    it("empty string", () => {
        expect(FormatUtils.isStringNumber("")).to.be.false;
    })
})

describe("FormatUtils.formatNumber", () => {
    it("Max precision", () => {
        expect(FormatUtils.formatNumber(3.1415723, 3, 0)).eq("3.141");
    })

    it("Med precision", () => {
        expect(FormatUtils.formatNumber(3.100, 3, 0)).eq("3.1");
    })

    it("Min precision", () => {
        expect(FormatUtils.formatNumber(3, 6, 3)).eq("3.000");
    })

    it("Min precision, remove dot", () => {
        expect(FormatUtils.formatNumber(3, 3, 0)).eq("3");
    })

    it("Spaces-on", () => {
        expect(FormatUtils.formatNumber(1234567, 3, 3, true)).eq("1 234 567.000");
    })

    it("Spaces-off", () => {
        expect(FormatUtils.formatNumber(1234567, 3, 3, false)).eq("1234567.000");
    })

    it("Spaces-auto-yes", () => {
        expect(FormatUtils.formatNumber(12345.123456, 6, 0)).eq("12 345.123456");
    })

    it("Spaces-auto-yes-longer", () => {
        expect(FormatUtils.formatNumber(1234512345.1234567, 5, 0)).eq("1 234 512 345.12345");
    })

    it("Spaces-auto-yes-longest", () => {
        expect(FormatUtils.formatNumber(11234512345.1234567, 5, 0)).eq("11 234 512 345.12345");
    })

    it("Spaces-auto-yes-long", () => {
        expect(FormatUtils.formatNumber(234512345.1, 3, 0)).eq("234 512 345.1");
    })

    it("Spaces-auto-no", () => {
        expect(FormatUtils.formatNumber(1234, 3, 0)).eq("1234");
    })

})

describe("FormatUtils.encodeToCsv", () => {
    it("Simple string", () => {
        expect(FormatUtils.encodeToCsv("abc")).to.equals("abc")
    })

    it("String with comma", () => {
        expect(FormatUtils.encodeToCsv("abc,def")).to.equals('"abc,def"');
    })

    it("String with quote character inside", () => {
        expect(FormatUtils.encodeToCsv('Received header "ERROR"')).to.equals('"Received header ""ERROR"""');
    })
    it("String with new line character and quota", () => {
        expect(FormatUtils.encodeToCsv('Received " header\nFoo')).to.equals('"Received "" header\nFoo"');
    })
    it("String with quota and a come", () => {
        expect(FormatUtils.encodeToCsv('Received ",header')).to.equals('"Received "",header"');
    })
    it("String with new line character", () => {
        expect(FormatUtils.encodeToCsv('Received header\nFoo')).to.equals('"Received header\nFoo"');
    })
    it("Number instead of string", () => {
        expect(FormatUtils.encodeToCsv(0)).to.equals('0');
    })
    it("Null instead of string", () => {
        expect(FormatUtils.encodeToCsv(null)).to.equals('');
    })
    it("Undefined instead of string", () => {
        expect(FormatUtils.encodeToCsv(undefined)).to.equals('');
    })
    it("number", () => {
        expect(FormatUtils.encodeToCsv(1.3, ',')).to.equals('1,3');
    })
    it("germany number", () => {
        expect(FormatUtils.encodeToCsv(1.3, ',')).to.equals('1,3');
    })

} )

describe("FormatUtils.removeStartFromString", () => {
    it("No prefix found", () => {
        expect(FormatUtils.removeStartFromString("abc_defgh", "bcd", "eee", "abd")).to.eq("abc_defgh")
    })

    it("First prefix found", () => {
        expect(FormatUtils.removeStartFromString("sl_volumen_01", "sl_", "buffer_sl_")).to.eq("volumen_01");
    })

    it("Last prefix found", () => {
        expect(FormatUtils.removeStartFromString("buffer_sl_volumen_01", "sl_", "buffer_sl_")).to.eq("volumen_01");
    })
})

describe("FormatUtils.split", () => {
    it("normalSplit", () => {
        expect(FormatUtils.split("a,b,c,d,e", ",")).to.eql(["a", "b", "c", "d", "e"])
    })

    it("splitWithEscapeCharacter", () => {
        expect(FormatUtils.split("a,b\\,c,d,e", ",")).to.eql(["a", "b\\,c", "d", "e"])
    })
})

describe("FormatUtils.splitOnCamelCase", () => {
    it("test", () => {
        expect(FormatUtils.splitOnCamelCase("thisIsTheEnd")).to.eql(['this', 'Is', 'The', "End"]);
    })
})