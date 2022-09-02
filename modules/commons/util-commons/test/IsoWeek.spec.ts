import { should, expect } from 'chai';
import { getIsoWeek, getIsoWeekYear } from '../ObjectUtils';
import { parseDateTimeAsIsoString } from '../FormatUtils';

describe("IsoWeek", ()=> {
    function doTest(date: string, expWeek: number, expYear: number) {
        it(date, () => {
            expect(getIsoWeek(parseDateTimeAsIsoString(date + "T00:00:00Z") as Date)).equals(expWeek);
            expect(getIsoWeekYear(parseDateTimeAsIsoString(date + "T00:00:00Z") as Date)).equals(expYear);
        })
    }

    doTest("2018-01-01", 1, 2018);
    doTest("2018-12-25", 52, 2018);
    doTest("2018-12-31", 1, 2019);
    
    doTest("2017-01-01", 52, 2016);
    doTest("2017-12-31", 52, 2017);

    doTest("2015-12-27", 52, 2015);
    doTest("2015-12-28", 53, 2015);
    doTest("2016-01-01", 53, 2015);
})

