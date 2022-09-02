import { should, expect } from 'chai';

import * as Tested from "../QueryParametersEnconding";
import { parseDateTimeAsIsoString } from "../FormatUtils";
import { ObjectId } from 'bson';

describe("QueryParameters", () => {
    function testEncodeToSimpleValue(value: any, valueName?: string) {
        it("Testing for value " + (valueName || value), () => {
            let str = Tested.QueryParameters.encodeQueryParameterToSingleString(value);
            //console.log("Object", value, "encoded as", str);

            let value1 = Tested.QueryParameters.decodeQueryParameterSingleValue(str);
            // console.log("Object deoced as", value1);
            expect(value1).eql(value, `Object ${JSON.stringify(value)} was encoded as ${str}, but failed to properly decode.`);
            expect(typeof value).eql(typeof value1);
        })
    }

    testEncodeToSimpleValue(null);
    testEncodeToSimpleValue("NULL");
    testEncodeToSimpleValue(undefined);
    testEncodeToSimpleValue("UNDEF");
    testEncodeToSimpleValue("myValue");
    testEncodeToSimpleValue("str_myValue");
    testEncodeToSimpleValue("[myValue]");
    testEncodeToSimpleValue("(myValue)");
    testEncodeToSimpleValue("_myValue");
    testEncodeToSimpleValue("/myValue");
    testEncodeToSimpleValue('~this~is~path', 'String that starts with Encoding character')
    testEncodeToSimpleValue("3-1");
    testEncodeToSimpleValue("15");
    testEncodeToSimpleValue("15.17");
    testEncodeToSimpleValue("2019-01-03T12:21:51.091Z");
    testEncodeToSimpleValue("2019-17-03T12:21:51.091Z");
    testEncodeToSimpleValue(new Date());
    testEncodeToSimpleValue(parseDateTimeAsIsoString("2019-11-03T00:00:00.000Z"));
    testEncodeToSimpleValue("[bracketsInTheString]");
    testEncodeToSimpleValue(["myValue", "mySecondValue"], "Simple Array with elements ");
    testEncodeToSimpleValue(["my,Value", "~mySecondValue", "thi/rd", "for]th", "six]", "fi[fth", "[seven"], "Simple Array with elements that contain funky characters");
    testEncodeToSimpleValue(["my,Value", "~mySecondValue", "thi/rd", "for)th", "six)", "fi(fth", "(seven"], "Simple Array with elements that contain round brackets characters");
    testEncodeToSimpleValue(["myValue", [13, null, [1, 3, 5], "mySecondValue"]], "Complex Array");
    testEncodeToSimpleValue(["myValue", ["my[SecondValue", [13, null, [1, 3, null, undefined, "a[c]d[s//df5]", "my~Se[condValue"]], "mythirdVa]]lue"]], "Complex Array with funky characters");
    testEncodeToSimpleValue(["myValue", ["my(SecondValue", [13, null, [1, 3, null, undefined, "a(c)d(s//df5)", "my~Se(condValue"]], "mythirdVa))lue"]], "Complex Array with funky characters");
    testEncodeToSimpleValue([ {a: "myValue", b:"sss"}, {c: 141}, null ], "Array contains object");
    testEncodeToSimpleValue(17.12);
    testEncodeToSimpleValue(true);
    testEncodeToSimpleValue(false);
    testEncodeToSimpleValue('true');
    testEncodeToSimpleValue("false");

    testEncodeToSimpleValue(4/0, '+Infinity');
    testEncodeToSimpleValue(-4/0, '-Infinity');

    it("BSON.ObjectId", ()=> {
        const src = new ObjectId();
        const str = Tested.QueryParameters.encodeQueryParameterToSingleString(src);
        const dest = Tested.QueryParameters.decodeQueryParameterSingleValue(str);

        expect(src.toHexString()).to.eql(dest.toHexString());
    })

    testEncodeToSimpleValue({b: 'string', c: -150, d: [ 0, 2 ]}, 'Easy objects')
    
    testEncodeToSimpleValue({a: new Date(), b: 'string', c: -150, d: [ 0, 2 ], e: {e1: "eee", e2: "/ee~ee"}, f: "Funky~String"}, 'Object with different objects')
    testEncodeToSimpleValue({a: 'this/is/path', b:'/tmp'}, 'Object with strings that contain slash')
    testEncodeToSimpleValue({a: 'this~is~path', b:'aaa~tmp'}, 'Object with strings that contain pipe')
    
    // No intention of implementing this.
    // testEncodeToSimpleValue({"a/b": 'this/is~path', "c[d]e": "aa", "~efg": 13}, 'Object with weird properties')

    it("check short datetime encoding", () => {
        let d = parseDateTimeAsIsoString("2019-10-12T00:00:00.000Z") as Date;
        let x = Tested.QueryParameters.encodeQueryParameterToSingleString(d);

        expect(x).eql("2019-10-12");

        let dd = Tested.QueryParameters.decodeQueryParameterSingleValue(x) as Date;

        expect(dd.getTime()).eql(d.getTime());
    })

    it("decodeArray - decodeUnopenedBracket", ()=> {
        expect(Tested.QueryParameters.decodeQueryParameterSingleValue("(a,b,(13,d,NULL)))") ).to.eql( ["a", "b", "(13","d", "NULL))"]);
        expect(Tested.QueryParameters.decodeQueryParameterSingleValue("(a,(13,(null,c))")).to.eql( ["a", "(13", "(null", "c)"]);
    })

    it("decodeArray - incorrect encoding of objects inside (too much or too little data)", ()=> {
        expect( () => Tested.QueryParameters.decodeQueryParameterSingleValue("(~6_tested,test)")).to.throw();
        expect( () => Tested.QueryParameters.decodeQueryParameterSingleValue("(~8_tested,test)")).to.throw();
        expect( () => Tested.QueryParameters.decodeQueryParameterSingleValue("(~91_tested,test)")).to.throw();
    });

    it("decodeObject - incorrect encoding of objects inside (too much or too little data)", ()=>{
        expect( () => Tested.QueryParameters.decodeQueryParameterSingleValue("~10/a/string") ).to.throw();
        expect( () => Tested.QueryParameters.decodeQueryParameterSingleValue("~8_a/string") ).to.throw();
    })
})

/** 
 * This is a function that breaks the URL into list of string arguemnts. 
 * 
 * Typically this is done by express, but for some testing we needed to write out own implementation 
 */
 function deconstructUrlParameters(url: string) {
    const pos = url.indexOf("?");
    const result: { _BASE_URL: string, [name: string]: string|string[]} = { _BASE_URL: pos>-1 ? url.substr(0, pos) : url };

    if (pos>-1) {
        let queryParamsString = url.substring(pos+1);

        let pairs = queryParamsString.split("&");

        for (let pair of pairs) {
            const pos = pair.indexOf('=');
            const name =  decodeURIComponent(pair.substr(0, pos));
            const value = decodeURIComponent(pair.substr(pos+1));

            if (result[name]===undefined) {
                result[name] = value;
            }
            else if (Array.isArray(result[name])) {
                (result[name] as string[]).push(value);
            }
            else {
                result[name] = [ result[name] as string, value ];
            }
        }
    }

    return result;
}

// Let's test our own implementation here... 
describe("deconstructUrlParameters", ()=> {
    let r = deconstructUrlParameters("http://www.foo.bar/flsf?a=5&b=3&a=8&c=1&a=77&c=9&d=e=f&e=a%26b%26c");

    expect(r._BASE_URL).eql("http://www.foo.bar/flsf")
    expect(r.a).eql(['5','8','77']);
    expect(r.b).eql('3');
    expect(r.c).eql(['1','9'])
    expect(r.d).eql("e=f");
    expect(r.e).eql("a&b&c")
})

describe("UrlBuilder.pathParameters", ()=>{
    function testUrlBuilder(testName: string, pathParams: any[], baseUrl: string, expected: string) {
        it(testName, ()=> {
            const ub = Tested.UrlBuilder.getBuilder(baseUrl);
            
            for (let pathParam of pathParams) {
                ub.addPathParameter(pathParam);
            }
            
            let url = ub.build();

            expect(url).to.eql(expected);

            expect(url.indexOf("%2F")).eql(-1);
            expect(url.indexOf("%5C")).eql(-1);
        })
    }

    testUrlBuilder("simple string", [ "testedParam" ], "http://www.foo.bar/path", "http://www.foo.bar/path/testedParam")
    testUrlBuilder("simple string slash", [ "testedParm", "testedParm2" ], "http://www.foo.bar/path/", "http://www.foo.bar/path/testedParm/testedParm2")
    testUrlBuilder("simple number", [ 17 ], "http://www.foo.bar/path", "http://www.foo.bar/path/17")
    testUrlBuilder("simple number slash", [ 17 ], "http://www.foo.bar/path/", "http://www.foo.bar/path/17")
    testUrlBuilder("multiple values", [ "path1", "path2", 3 ], "http://www.foo.bar/path/", "http://www.foo.bar/path/path1/path2/3")
})

describe("UrlBuilder.queryParameters", ()=>{
    testUrlBuilder("EmptyParams", {})
    testUrlBuilder("StringParamUrlWithParams", { param: "stringValue" })
    testUrlBuilder("StringParamWithSpace", { param: "this is" })
    testUrlBuilder("StringParamWithPlus", {param: "3+5" })
    testUrlBuilder("StringParam", {param: "stringValue"})
    testUrlBuilder("DateParam", {param: parseDateTimeAsIsoString("2018-09-30T17:03:12.922Z")})
    testUrlBuilder("DateParamAsString", {param: "2018-09-30T17:03:12.922Z"})
    testUrlBuilder("NumberParam", { myParam: 17.31 });
    testUrlBuilder("NumberParamAsString", { myParam: "17.31" });
    testUrlBuilder("SimpleArray", { ar: ["a", "b", "c"] })
    testUrlBuilder("OneElemenArray", { myParam: [ "17.31" ] })
    testUrlBuilder("ComplexArray", { ar: ["a", "b", 18.1, "ziomal dobry", ["c d", null]] })
    testUrlBuilder("MultipleParams", { myParam: 17.31, 'second=Pa&ram': "foo=ba&r" })
    testUrlBuilder("ComplexObject", { myParam: 17.31, obj: { from: new Date(), to: new Date(), data: { a: 5, b: "555"}}})
    testUrlBuilder("SimpleObjectWithFunkyString", { myParam: 17.31, str: "/a|b~c_d\\e[f]g{sdf},/" })
    testUrlBuilder("BooleanTrueParam", { myParam: true });
    testUrlBuilder("BooleanFalseParam", { myParam: false });
    
    function testUrlBuilder(testName: string, queryParams: any, baseUrl = "http://www.foo.bar/path") {
        it(testName, ()=> {
            let ub = Tested.UrlBuilder.getBuilder(baseUrl);
            let count = 0;
            for (let queryParamName in queryParams) {
                ub.addQueryParameter(queryParamName, queryParams[queryParamName]);
                count++;
            }

            let url = ub.build();
            let decodedQueryParams = deconstructUrlParameters(url);
            
            expect(url.startsWith(baseUrl + (count>0 ? '?' : ""))).true;

            for (let queryParamName in queryParams) {
                expect(Tested.QueryParameters.decodeQueryParameterValue(decodedQueryParams[queryParamName])).eql(queryParams[queryParamName])
            }

            expect(url.indexOf("%2F")).eql(-1, `Encoded URL ${url} should not contain any encoded / characters (%2F)`);
            expect(url.indexOf("%5C")).eql(-1, `Encoded URL ${url} should not contain any encoded \\ characters (%5C)`);

            expect(url.indexOf("[")).eql(-1, `Encoded URL ${url} should not contain any unencoded [ character`);
            expect(url.indexOf("]")).eql(-1, `Encoded URL ${url} should not contain any unencoded ] character`);
            expect(url.indexOf("{")).eql(-1, `Encoded URL ${url} should not contain any unencoded { character`);
            expect(url.indexOf("}")).eql(-1, `Encoded URL ${url} should not contain any unencoded } character`);
        })
    }

    it("testForDuplicates", () => {
        expect( () => Tested.UrlBuilder.getBuilder("http://aaaa").addQueryParameter("a", 13).addQueryParameter("a", 15)).to.throw();
    })
})
