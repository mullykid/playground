import { should, expect } from 'chai';

import * as EJSON from "../EjsonParser";
import * as Bson from "bson";

import * as FormatUtils from "../FormatUtils";

import * as MongoDb from "mongodb";

describe("Test ejson parser", () => {
    it("Test objectId", () => {
        let x = EJSON.deserializeValue( "_id", {$oid: "5b83cdbe5658a8321a61e150"} )

        expect(x instanceof Bson.ObjectID).true;
    });

    it("Test numberInt", () => {
        let x = EJSON.deserializeValue( "num", {$numberInt: "5012"} )

        expect(x).eq(5012);;
    });

    it("Test numberInt (as number)", () => {
        let x = EJSON.deserializeValue( "num", {$numberInt: 5012} )

        expect(x).eq(5012);;
    });

    it("Test numberDouble", () => {
        let x = EJSON.deserializeValue( "num", {$numberDouble: "60.12"} )

        expect(x).eq(60.12);;
    });

    it("Test complete parse", () => {
        let x = EJSON.parse( '{"data":[{"_id":{"$oid":"5b83cdbe5658a8321a61e150"},"a":{"$date":{"$numberLong":"1538739900320"}}, "null": null, "location":"Exhibition St","versionNo":{"$numberInt":"180821"},"changeDate":"21-Aug-18","incTicket":"INC000029137440","crqNo":"","client":"Power Equipment Pty Ltd","action":"Full decommission","designer":"VG","peerReviewer":"RR","reviewer":"KV","arrayName":"clay-ncs-vnx8023","ultraTier":"","perfTier":{"$numberInt":"-600"},"activeTier":{"$numberDouble":"-6100.003"},"date":"180821"}]}' )

        expect(x.data[0].null).null;
        expect(x.data[0].versionNo).eq(180821);
        expect(x.data[0].activeTier).eq(-6100.003);
        expect(x.data[0].a.getTime()).eq((FormatUtils.parseDateTimeAsIsoString("2018-10-05T11:45:00.320Z") as Date).getTime());
    })
})

describe("stringify", () => {
    it("Date", () => {
        let d = EJSON.stringify( { myTimestamp: FormatUtils.parseDateTimeAsIsoString("2018-05-18T03:12:34.381Z")});

        expect(d).eq('{"myTimestamp":{"$date":"2018-05-18T03:12:34.381Z"}}');
    })

    it("ObjectID", () => {
        let d = EJSON.stringify( { _id: new Bson.ObjectID("5b83cdbf5658a8321a61e264")});

        expect(d).eq('{"_id":{"$oid":"5b83cdbf5658a8321a61e264"}}');
    })

    it("null", () => {
        let d = EJSON.stringify( { a: "abc", null: null, undef: undefined } );

        expect(d).eq('{"a":"abc","null":null}');
    })

    it("complexObject", () => {
        let d = EJSON.stringify( { a: "abc", arr:[{n:1},{n:2}],b: { ba: "ba", bd: FormatUtils.parseDateTimeAsIsoString("2018-05-18T03:12:34.381Z")}})

        expect(d).eq('{"a":"abc","arr":[{"n":1},{"n":2}],"b":{"ba":"ba","bd":{"$date":"2018-05-18T03:12:34.381Z"}}}')
    })
});