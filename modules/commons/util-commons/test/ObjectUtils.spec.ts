import { should, expect } from 'chai';
import { getPropValue, defValue, setPropValue, deepCopy, bindHandlers, arraysEqual } from '../ObjectUtils';

describe("ObjectUtils.arraysEquals", () => {
    it("Same Array", () => {
        let x = [3, 5]
        
        expect(arraysEqual(x,x)).true
    })

    it("Different array, same contents", () => {
        let x = [3, 5];
        let y = [3, 5];

        expect(arraysEqual(x,y)).true
    })
})


describe("ObjectUtils", () => {
    it("setPropValue", () => {
        let a: any = {
            prop1: "post",
            prop2: {
                foo: {
                    bar: 17
                },
                boo: undefined
            }
        }

        // Test setting a simple, level-1 property
        setPropValue(a, "182", "prop3");
        expect(a.prop3).to.eq("182");

        // Test setting a nested property
        setPropValue(a, 17, "prop4.prop41");
        expect(a.prop4.prop41).to.eq(17);

        // Test overwritting existing properties
        setPropValue(a, { a: "b" }, "prop4.prop41");
        expect(a.prop4.prop41.a).to.eq("b");
    })

    it("setPropValue_removeProp", () => {
        let a: any = {
            prop1: "post",
            prop2: {
                foo: {
                    bar: 17
                },
                boo: undefined
            }
        }

        setPropValue(a, undefined, "prop2");
        expect(a.prop2).to.undefined;
    })



    it("getPropValue", () => {
        let a = {
            prop1: "post",
            prop2: {
                foo: {
                    bar: 17
                },
                boo: undefined
            },
            propArr: [ 3, { name: 'x', value: 'v'}],
            propNull: null
        }

        expect(getPropValue(a, "prop1")).equals("post");
        expect(getPropValue(a, "prop2.foo.bar")).equals(17);
        expect(getPropValue(a, "propNull")).is.null;
        expect(getPropValue(a, "propNull.a")).is.undefined;

        // There is explicitly given a value of undefined in the object - it should return it regardless of the defValue given
        expect(getPropValue(a, "prop2.boo")).is.undefined;
        expect(getPropValue(a, "prop2.boo", "def")).is.undefined;
        expect(getPropValue(a, ["prop2", "boo"])).is.undefined;
        expect(getPropValue(a, ["prop2", "boo"], "def")).is.undefined;

        expect(getPropValue(a, [ "prop2", "foo", "bar" ])).equals(17);
        expect(getPropValue(a, "prop2.foo.bar", "foooo")).equals(17);

        expect(getPropValue(a, "roman.maria.jan", "foooo")).equals("foooo");
        expect(getPropValue(a, "prop2.foos.bar", "foooo")).equals("foooo");

        expect(getPropValue(a, [ "prop2", "foos", "bar" ], "defaultProp3")).equals("defaultProp3")
        expect(getPropValue(a, "prop3")).is.undefined;
        expect(getPropValue(a, "prop3", "defaultProp3")).equals("defaultProp3")
        expect(getPropValue(a, [ "prop3" ])).is.undefined;
        expect(getPropValue(a, [ "prop3" ], "defaultProp3")).equals("defaultProp3")

        expect(getPropValue(a, "propArr.0")).equals(3);
        expect(getPropValue(a, "propArr.1.value")).equals('v');
    })
});

describe("ObjectUtils.defValue_twoParams", () => {
    it("undefined", () => {
        expect(defValue(undefined, "aaa")).eq("aaa");
    })

    it("null", () => {
        expect(defValue(null, 572)).eq(572);
    })

    it("emptyString", () => {
        expect(defValue<string>("", "foo")).eq("");
    })

    it("zero", () => {
        expect(defValue<number>(0, 17)).eq(0);
    })

    it("non-emptyString", () => {
        expect(defValue<string>("boo", "foo")).eq("boo");
    })
})

describe("ObjectUtils.defValue_threeParams", () => {
    it("first-param-catches", () => {
        expect(defValue<string>("boo", undefined, "woo")).eq("boo");
    })

    it("second-param-catches", () => {
        expect(defValue(undefined, "aaa", "bbb")).eq("aaa");
    })

    it("third-param-catches", () => {
        expect(defValue(null, undefined, 572)).eq(572);
    })

    it("emptyString", () => {
        expect(defValue<string>(undefined, "", "foo")).eq("");
    })

    it("zero", () => {
        expect(defValue<number>(null, 0, 17)).eq(0);
    })
})


describe("ObjectUtils.deepCopy", () => {
    it("Simple flat copy", () => {
        let t = {
            id: "TestID",
            n: 17,
            f: 19.18,
            null: null,
            undef: undefined
        }

        let tc = deepCopy(t);

        expect(tc.id).to.eq("TestID");
        expect(tc.n).to.eq(17);
        expect(tc.f).to.eq(19.18);
        expect(tc.null).to.be.null;
        expect(tc.undef).to.be.undefined;
    })

    it("Array copy", () => {
        let t = {
            id: "TestID",
            ar: [ "a", "b", { a: "c" } ]
        } as any;

        let tc = deepCopy(t);

        expect(tc.ar[0]).to.eq("a");
        expect(tc.ar[1]).to.eq("b");
        expect(tc.ar[2].a).to.eq("c");
        expect(t.id).to.eq(tc.id);

        tc.ar.push("d");
        expect(t.ar.length).to.eq(3);

        tc.ar[2].b = "d"
        expect(t.ar[2].b).undefined;
    })

    it("DateTime copy", () => {
        let t = {
            id: "TestID",
            date: new Date()
        }

        let tc = deepCopy(t);
        expect(t.date.getTime()).to.eq(tc.date.getTime());
        expect(t.id).to.eq(tc.id);

        tc.date.setFullYear(1000);

        expect(t.date.getFullYear()).to.be.greaterThan(2000);
    })


    it("Nested object copy", () => {
        let t = {
            id: "TestID",
            nest: {
                id: "TestNestId",
                date: new Date()
            }
        }

        let tc = deepCopy(t);

        tc.nest.id = "NewID";
        tc.nest.date.setFullYear(1222);

        expect(tc.nest.id).to.eq("NewID");
        expect(t.nest.id).to.eq("TestNestId");
        expect(t.nest.date.getFullYear()).to.be.greaterThan(2018);
    })
})

describe("ObjectUtils.bindHandlers", () => {
    it("Bind Simple", () => {
        class A {
            name = "A";

            getName() { 
                return this.name 
            }

            onGetName() {
                return this.name
            }

            constructor() {
                bindHandlers(this);
            }
        }

        let a = new A();

        let f = a.getName;
        let of = a.onGetName;

        expect(f).to.throw;
        expect(of()).to.eq("A");
    });

    it("Bind Inherited", () => {
        class B {
            baseName = "B";

            getBase() { return this.baseName; } 
            onGetBase() { return this.baseName; }
        }
        
        class A extends B {
            name = "A";

            getName() { return this.name }
            onGetName() { return this.name }

            constructor() {
                super();

                bindHandlers(this);
            }
        }

        let a = new A();

        let f = a.getBase;
        let of = a.onGetBase;

        expect(f).to.throw;
        expect(of()).to.eq("B");
    });

})