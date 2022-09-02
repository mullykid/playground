import * as Collections from '../Collections';

import { should, expect } from 'chai';

let testCollection = function(createCollectionInstance: () => Collections.Collection<string>) {
    it(".toArray", () => {
        let testedCollection = createCollectionInstance();

        testedCollection.add("aaa");
        testedCollection.add("bbb");

        expect(testedCollection.toArray()).eql(["aaa", "bbb"]);
    })

    it(".toArray empty", () => {
        let testedCollection = createCollectionInstance();

        expect(testedCollection.toArray()).eql([]);
    })

    it(".clear()", () => {
        let testedList = createCollectionInstance();

        for (let i=0; i<20; i++) {
            testedList.add("s" + i);
        }

        testedList.clear();
        expect(testedList.size()).eq(0);

        let array = testedList.toArray();
        expect(array.length).eq(0);
    })

    it(".add, .addAll, .size and .includes & .includesAll", () => {
        let testedList = createCollectionInstance();
        expect(testedList.size()).eq(0);
        
        testedList.add('stringOne');
        expect(testedList.size()).eq(1);
        expect(testedList.includes('stringOne')).true;
        expect(testedList.includes('stringTwo')).false;

        testedList.add('stringTwo');
        expect(testedList.size()).eq(2);
        expect(testedList.includes('stringOne')).true;
        expect(testedList.includes('stringTwo')).true;

        testedList.add('stringThree');
        expect(testedList.size()).eq(3);
        expect(testedList.includes('stringOne')).true;
        expect(testedList.includes('stringThree')).true;
    });

    it(".addAll & .includesAll", () => {
        let testedList = createCollectionInstance();
        expect(testedList.size()).eq(0);
        
        testedList.addAll([ 'stringFour', 'stringFive', 'stringSix' ])
        expect(testedList.size()).eq(3);
        expect(testedList.includes('stringFour')).true;
        expect(testedList.includes('stringSix')).true;

        expect(testedList.includesAll( ['stringFour', 'stringFive'] )).true;
        expect(testedList.includesAll( ['stringFour', 'stringSeeeeven'] )).false;
    });

    it(".forEach()", () => {
        let testedList = createCollectionInstance();

        for (let i=0; i<4; i++) {
            testedList.add("s" + i);
        }

        let ss = "";
        testedList.forEach((v, i) => ss += v + "_" + i + ";");

        expect(ss).equals("s0_0;s1_1;s2_2;s3_3;");
    });

    it(".reduce()", () => {
        let testedList = createCollectionInstance();
        for (let i=1; i<5; i++) {
            testedList.add("s" + i);
        }

        expect(testedList.reduce( (acc, v) => acc + v + ";", "")).eq("s1;s2;s3;s4;")
    })

    it(".filter()", () => {
        let testedList = createCollectionInstance();
        for (let i=1; i<10; i++) {
            testedList.add("s" + i);
        }

        let filtered = testedList.filter( (v)=> v==='s1' || v==='s9');

        expect(filtered.toArray()).eql(['s1', 's9']);
    })

    it("for (x of list)", () => {
        let testedList = createCollectionInstance();
        for (let i=0; i<4; i++) {
            testedList.add("s" + i);
        }

        let ss = "";
        for (let v of testedList) {
            ss += v + ";";
        }

        expect(ss).equals("s0;s1;s2;s3;");
    });

    it("iterator - after finishing", ()=>{
        let testedList = createCollectionInstance();
        testedList.addMany( "s1", "s2", "s3", "s4" );

        let iterator = testedList[Symbol.iterator]();

        expect(iterator.next().value).equals("s1");
        expect(iterator.next().value).equals("s2");
        expect(iterator.next().value).equals("s3");
        expect(iterator.next().value).equals("s4");
        expect(iterator.next().done).equals(true);
        expect(iterator.next().done).equals(true);
        expect(iterator.next().done).equals(true);
        expect(iterator.next().done).equals(true);
    });

    it("iterator - empty list", ()=>{
        let testedList = createCollectionInstance();

        let iterator = testedList[Symbol.iterator]();

        expect(iterator.next().done).equals(true);
        expect(iterator.next().done).equals(true);
        expect(iterator.next().done).equals(true);
        expect(iterator.next().done).equals(true);
    });

    
    it("iterator - list with undefined elements", ()=>{
        let testedList = createCollectionInstance();

        testedList.add(undefined as any);
        testedList.add(null as any);

        let iterator = testedList[Symbol.iterator]();

        let v1 = iterator.next();
        expect(v1.value).undefined;
        expect(v1.done).false;

        let v2 = iterator.next();
        expect(v2.value).null;
        expect(v2.done).false;

        let v3 = iterator.next();
        expect(v3.value).undefined;
        expect(v3.done).true;
    });
}


let testList = function(createListInstance: () => Collections.List<any | null | undefined>) {
    testCollection(createListInstance);
    
    it(".get()", () => {
        let testedList = createListInstance();

        testedList.add('stringOne');
        testedList.add('stringTwo');
        testedList.add('stringThree');
        
        expect(testedList.size()).eq(3);
        expect(testedList.get(0)).eq('stringOne');
        expect(testedList.get(1)).eq('stringTwo');
        expect(testedList.get(2)).eq('stringThree');

        let array = testedList.toArray();
        expect(array.length).eq(3);

        expect(testedList.size()).eq(3);
        expect(testedList.get(0)).eq('stringOne');
        expect(testedList.get(1)).eq('stringTwo');
        expect(testedList.get(2)).eq('stringThree');
    });

    it(".get() outOfBounds", () => {
        let testedList = createListInstance();

        expect(()=> {testedList.get(0)}).to.throw()

        testedList.add('stringOne');
        testedList.add('stringTwo');
        testedList.add('stringThree');
        
        expect(()=> {testedList.get(3)}).to.throw()
        expect(()=> {testedList.get(-1)}).to.throw()
    })

    it(".toArray after removals", ()=> {
        let testedCollection = createListInstance();

        testedCollection.add("zoo");
        testedCollection.add("aaa");
        testedCollection.add("eee");
        testedCollection.add("bbb");
        testedCollection.add("ccc");

        testedCollection.removeAt(4);
        testedCollection.removeAt(0);
        testedCollection.removeAt(1);

        expect(testedCollection.toArray()).eql(['aaa', 'bbb'])
    });

    it(".insert()", () => {
        let testedList = createListInstance();

        for (let i=0; i<20; i++) {
            testedList.add("s" + i);
        }

        expect(testedList.insert(5, "s5.1")).eq(true);
        expect(testedList.size()).eq(21);
        expect(testedList.get(4)).eq("s4");
        expect(testedList.get(5)).eq("s5.1");
        expect(testedList.get(6)).eq("s5");
    })

    it(".insert(0, ...) after .removeAt(0)", ()=> {
        let testedList = createListInstance();

        for (let i=0; i<20; i++) {
            testedList.add("s" + i);
        }

        expect(testedList.removeAt(0)).eq("s0");
        expect(testedList.insert(0, "s0.0"));

        expect(testedList.size()).eq(20);
        expect(testedList.get(0)).eq("s0.0");
        expect(testedList.get(1)).eq("s1");
        expect(testedList.get(19)).eq("s19");
    })

    it(".insert(0, ...) to empty List", ()=> {
        let testedList = createListInstance();
        expect(testedList.insert(0, "s3.5")).to.true;
        expect(testedList.size()).to.eq(1);
        expect(testedList.get(0)).to.eq("s3.5");
    })

    it(".insert(...) to end of list", ()=> {
        let testedList = createListInstance();
        expect(testedList.add("s0")).to.true;
        expect(testedList.add("s1")).to.true;
        expect(testedList.add("s2")).to.true;
        expect(testedList.add("s3")).to.true;
        expect(testedList.add("s4")).to.true;
        
        expect(testedList.insert(5, "s5")).to.true;
        expect(testedList.get(5)).to.eq("s5")
        expect(testedList.get(0)).to.eq("s0");
    })


    it(".insert(3, ...) after .removeAt(0)", ()=> {
        let testedList = createListInstance();

        for (let i=0; i<20; i++) {
            testedList.add("s" + i);
        }

        expect(testedList.removeAt(0)).eq("s0");
        expect(testedList.insert(3, "s3.5"));

        expect(testedList.size()).eq(20);
        expect(testedList.get(0)).eq("s1");
        expect(testedList.get(1)).eq("s2");
        expect(testedList.get(2)).eq("s3");
        expect(testedList.get(3)).eq("s3.5");
        expect(testedList.get(4)).eq("s4");
    })

    it(".add after .removeAt(0)", () => {
        let testedList = createListInstance();
        for (let i=0; i<50; i++) {
            testedList.add("s" + i);
        }
        
        expect(testedList.size()).eq(50);
        expect(testedList.get(0)).eq("s0");
        expect(testedList.get(49)).eq("s49");

        for (let i=0; i<2500; i++) {
            testedList.removeAt(0);
            testedList.add("i" + i);
        }

        expect(testedList.size()).eq(50);
        expect(testedList.get(49)).eq("i2499");
        expect(testedList.get(0)).eq("i2450");
    })

    it(".replace() after .removeAt(0)", () => {
        let testedList = createListInstance();

        testedList.add("s000");
        testedList.removeAt(0);

        for (let i=0; i<20; i++) {
            testedList.add("s" + i);
        }

        expect(testedList.replace(5, "s5.1")).eq("s5");
        expect(testedList.size()).eq(20);
        expect(testedList.get(4)).eq("s4");
        expect(testedList.get(5)).eq("s5.1");
        expect(testedList.get(6)).eq("s6");

        expect(testedList.replace(19, "s19.1")).eq("s19");
        expect(testedList.size()).eq(20);
        expect(testedList.get(19)).eq("s19.1");
        expect(testedList.get(18)).eq("s18");
    })

    it(".removeAt()", () => {
        let testedList = createListInstance();

        for (let i=0; i<20; i++) {
            testedList.add("s" + i);
        }

        expect(testedList.removeAt(0), "removeAt(0) returns the correct element").equals("s0");
        expect(testedList.size(), "Size after removal index-0 wrong").equals(19);
        expect(testedList.get(0), "First element after removal index-0").equals("s1");
        expect(testedList.get(18), "Last element after removal index-0").equals("s19");

        expect(testedList.removeAt(18), "removeAt(18) returns a removed element").eq("s19");
        expect(testedList.size(), "Size after removal index-0 wrong").equals(18);
        expect(testedList.get(0), "First element after removal index-18").equals("s1");
        expect(testedList.get(17), "Last element after removal index-18").equals("s18");

        expect(testedList.removeAt(10), "removeAt(10) returns a removed element").eq("s11");
        expect(testedList.size(), "Size after removal index-0 wrong").equals(17);
        expect(testedList.get(0), "First element after removal index-10").equals("s1");
        expect(testedList.get(16), "Last element after removal index-10").equals("s18");

        while (testedList.size()>0) {
            testedList.removeAt(0);
        }

        expect(testedList.size()).equals(0);

        let array = testedList.toArray();
        expect(array.length).eq(0);
    });

    it("removeAt() outOfBounds", () => {
        let testedList = createListInstance();

        expect( ()=> { testedList.removeAt(0)} ).to.throw()

        for (let i=0; i<20; i++) {
            testedList.add("s" + i);
        }

        expect( () => { testedList.removeAt(-1) }).to.throw()
        expect( () => { testedList.removeAt(20) }).to.throw()  
    })

    it("iterator.insert", () => {
        let list = createListInstance();

        list.add("e1");
        list.add("e2");
        list.add("e3");
        list.add("e4");

        let iter = list.iterator();

        iter.next(); //Now pointing to e1
        iter.insert("e0"); // Inserting before e1
        iter.next(); // Pointing to e2
        iter.next(); // Pointing to e3
        iter.insert("e2.5"); // Inserting before e3
        iter.insert("e2.6"); // Inserting before e3
        
        expect(iter.next().done).eq(false);
        expect(iter.next().done).eq(true);

        expect(list.size(), "The size of the list after iterator insertions is not correct").equals(7);

        expect(JSON.stringify(list.toArray())).equals('["e0","e1","e2","e2.5","e2.6","e3","e4"]');
    })

    it("iterator.insert after finishing", () => {
        let list = createListInstance();

        list.add("e1");
        list.add("e2");
        list.add("e3");
        list.add("e4");

        let iter = list.iterator();

        while (!iter.next().done) { }

        iter.insert("e5"); // Instered after last element. The cursor still should point to the end of the list, because we are always inserting BEFORE current elem
        iter.insert("e6");

        expect(list.size(), "The size of the list after iterator insertions is not correct").equals(6);

        expect(JSON.stringify(list.toArray())).equals('["e1","e2","e3","e4","e5","e6"]');
    })

    it("iterator.replace", () => {
        let list = createListInstance();

        list.add("e1");
        list.add("e2");
        list.add("e3");
        list.add("e4");

        let iter = list.iterator();

        iter.next(); //Now pointing to e1
        iter.next(); // Pointing to e2

        expect(iter.replace("e2v1")).eq("e2");
        expect(JSON.stringify(list.toArray())).equals('["e1","e2v1","e3","e4"]');
    })

    it("iterator.remove", () => {
        let list = createListInstance();

        list.add("e1");
        list.add("e2");
        list.add("e3");
        list.add("e4");

        let iter = list.iterator();

        iter.next(); //Now pointing to e1
        iter.next(); // Pointing to e2

        expect(iter.remove()).eq("e2");
        expect(JSON.stringify(list.toArray())).equals('["e1","e3","e4"]');
    })

}

const testSet = ( createSet: () => Collections.Set<string> ) => {
    testCollection(createSet);
    
    it(".add with duplicates", () => {
        const tested = createSet();

        expect(tested.add("aaa")).true;
        expect(tested.add("bbb")).true;
        expect(tested.size()).eq(2);
        expect(tested.includes("aaa")).true;
        expect(tested.includes("bbb")).true;
        expect(tested.includes("ccc")).false;

        expect(tested.add("aaa")).false;
        expect(tested.add("bbb")).false;
        expect(tested.add("ccc")).true;
        expect(tested.size()).eq(3);        
        expect(tested.includes("aaa")).true;
        expect(tested.includes("bbb")).true;
        expect(tested.includes("ccc")).true;
        expect(tested.includes("ddd")).false;
    })
}

describe("ArrayList", () => {
    testList(() => new Collections.ArrayList<any>());
})

describe("LinkedList", () => {
    testList(() => new Collections.LinkedList<any>())

    it("LinkedListReverseIterator", () => {
        const a = new Collections.LinkedList<string>();

        a.add("aaa");
        a.add('bbb');
        a.addMany("ccc", "ddd", "eee");

        const iter = a.iterator();
        let result = "";
        while (true) {
            const ir = iter.prev();

            if (ir.done) {
                break;
            }

            result += ir.value + ";"
        }

        expect(result).eq("eee;ddd;ccc;bbb;aaa;");
    })
});

describe("SimpleSet", () => {
    testSet(() => new Collections.SimpleSet<string>( (a, b) => a===b));
})

describe("SmartSet", () => {
    testSet(() => new Collections.SmartSet<string>());
})

describe("Queue", () => {
    it("Adding elements", () => {
        let queue = new Collections.FifoQueue<string>();

        queue.push('stringOne');
        queue.push('stringTwo');
        queue.push('stringThree');
        
        expect(queue.peek(), "Peek value").equals('stringOne');
        expect(queue.hasMore()).equals(true);
        expect(queue.size()).equals(3);

        expect(queue.pop(), "Pop value").equals('stringOne');
        expect(queue.hasMore()).equals(true);
        expect(queue.size()).equals(2);

        expect(queue.pop(), "Pop value").equals('stringTwo');
        expect(queue.hasMore()).equals(true);
        expect(queue.size()).equals(1);

        expect(queue.push('stringFour')).equals(true);
        expect(queue.hasMore()).equals(true);
        expect(queue.size()).equals(2);

        expect(queue.pop(), "Pop value").equals('stringThree');
        expect(queue.hasMore()).equals(true);
        expect(queue.size()).equals(1);

        expect(queue.pop(), "Pop value").equals('stringFour');
        expect(queue.hasMore()).equals(false);
        expect(queue.size()).equals(0);
    });
})

describe("PriorityQueues", () => {
    const doTest = (testName: string, queue: Collections.Queue<any>) => {
        it(testName, ()=> {
            queue.push({name: "c", priority: 3});
            queue.push({name: "C", priority: 3});
            queue.push({name: "e", priority: 5});
            queue.push({name: "a", priority: 1});
            queue.push({name: "b", priority: 3});
            queue.push({name: "E", priority: 5});
            queue.push({name: "g", priority: 7});
    
            let result = "";
            while (queue.hasMore()) {
                result += queue.pop().name;
            }
    
            expect(result).eq("acCbeEg");
        })
    }
    
    doTest("ListBased-PriorityQueue", new Collections.PriorityQueue((a:any, b:any) => a.priority-b.priority));
})

describe("Stack", () => {
    it("Push and Pop", () => {
        let s = new Collections.Stack();

        s.push('a');
        s.push('b');
        expect(s.size()).eq(2);

        expect(s.pop()).eq('b');
        expect(s.size()).eq(1);

        s.push('c');
        expect(s.size()).eq(2);
        expect(s.pop()).eq('c');
        expect(s.pop()).eq('a');
        expect(s.size()).eq(0);
    })
})
