import { exec } from 'child_process';
import * as Collections from '../Collections';
import { SimpleSet, SmartSet } from '../Collections';

const REPEAT_COUNT = 1;
const INSERT_COUNT = 50000;
const DELETE_COUNT = 10000;

const SET_REPEAT_COUNT = 1;
const SET_INSERT_COUNT = 10000;
const SET_DELETE_COUNT = 1000;

function execTest( testName: string, testFn: ()=>void, setupFn?: ()=>void) {
    const start = Date.now();
    let count = 0;
    let duration = 0;

    while (duration<2000 && count<10) {
        count++;
        setupFn && setupFn();
        const start = Date.now();
        testFn();
        duration += Date.now()-start;
    }

    console.log(testName, "took", (duration/count).toFixed(1)," ms");
}

function doTestList(className: string, createListInstance: ()=>Collections.List<string>) {
    const testedList = createListInstance();

    const initList = () => {
        testedList.clear();
        for (let i=0; i<INSERT_COUNT; i++) {
            testedList.add("s" + i);
        }
    }
    
    execTest( className + ": Add & clear", () => {
        for (let i=0; i<INSERT_COUNT; i++) {
            testedList.add("s" + i);
        }

        testedList.clear();
    })

    execTest( className + ": Insert(0)", () => {
        for (let i=0; i<INSERT_COUNT; i++) {
            testedList.insert(0, "s" + i);
        }
    }, initList)

    execTest( className + ": Insert(3)", () => {
        for (let i=0; i<INSERT_COUNT; i++) {
            testedList.insert(3, "s" + i);
        }
    }, initList)

    execTest( className + ": Removal (last item)", () => {
        for (let i=0; i<DELETE_COUNT; i++) {
            if (testedList.size()>0) testedList.removeAt(testedList.size()-1);
        }
    }, initList);

    execTest( className + ": Removal (random items)", () => {
        for (let i=0; i*1000<testedList.size(); i++) {
            testedList.removeAt(i);
        }
    }, initList);

    execTest( className + ": Removal (index 0)", () => {
        for (let i=0; i<DELETE_COUNT; i++) {
            testedList.removeAt(0);
            testedList.add("s" + i);
        }
    }, initList);

    execTest(className + ":Random Access", () => {
        for (let i=0; i*10<testedList.size(); i++) {
            testedList.get(i*10);
        }
    }, initList)

    execTest(className + ":Iteration", () => {
        let i = 0;
        for (let x of testedList) {
            i++;
        }
    }, initList)
        
    execTest(className + ":Iteration_index_based", () => {
        for (let i=0; i<testedList.size(); i++) {
            const x = testedList.get(i);
        }
    }, initList)
};

const doTestSet = (className: string,  fn: ()=>Collections.Set<string>) => {
    let testedSet = fn();

    execTest(className + ": Insert", () => {
        testedSet.clear();

        for (let i=0; i<SET_INSERT_COUNT; i++) {
            testedSet.add("s" + i);
        }

        for (let i=0; i<SET_INSERT_COUNT; i++) {
            testedSet.add("s" + i*2);
        }
    })

    // console.log(className, ": After", SET_INSERT_COUNT*2, "inserts set has ", testedSet.size(), "elemnts. Expected ", SET_INSERT_COUNT * 1.5)

    // Testing how fast can the set locate elements
    execTest(className + ": Random Access", 
        () => {
            for (let i=0; i<SET_INSERT_COUNT; i++) {
                testedSet.includes("s" + i*2);
            }
        }, 
        () => {
            testedSet.clear();
            for (let i=0; i<SET_INSERT_COUNT; i++) {
                testedSet.add("s" + i);
            }
        }
    )

    execTest(className + ": Iteration", () => {
        let i=0;
        for (let j=0; j<10; j++) {
            for (let x of testedSet) {
                i++;
            }
        }
    })
}

doTestList("SimpleArrayList", ()=>new Collections.SimpleArrayList());
doTestList("ArrayList", ()=>new Collections.ArrayList());
doTestList("LinkedList", ()=>new Collections.LinkedList());

// doTestSet("SimpleSet", () => new SimpleSet<string>((a,b) => a===b))
// doTestSet("SmartSet", () => new SmartSet<string>())

