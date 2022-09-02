import { should, expect } from 'chai';
import { OrderedLinkedList, OrderedList } from './OrderedList';

describe("OrderedLIst", () => {
    const doTest = (name: string, createCollection: (cmp: any)=>any) => {
        it(`${name}: Numbered list`, () => {
            let s = createCollection((a:number,b:number) => a-b)
    
            s.add(5)
            s.add(9)
            s.add(1)
            s.add(4)
            s.add(9)
            s.add(4)

            let ss = s.reduce((a: string, v: number) => a += v + ":", "");
    
            expect(ss).eq("1:4:4:5:9:9:");
        })
    
        it(`${name}: IndexOf (allowSimilar)`, () => {
            let s = createCollection((a:any,b:any) => a.p-b.p);
    
            s.add({p:5, v:"5"})
            s.add({p:7, v:"7"})
            s.add({p:7, v:"7.1"})
            s.add({p:7, v:"7.2"})
            s.add({p:7, v:"7.3"})
            s.add({p:7, v:"7.4"})
            s.add({p:3, v:"3"})
            s.add({p:11, v:"11"})
            s.add({p:2, v:"2"})
            s.add({p:51, v:"51"})
    
            expect(s.indexOf({p:5}, true)).eq(2);
            expect(s.indexOf({p:7}, true)).not.eq(-1);
            expect(s.indexOf({p:7, v:"sdfsfsdf"}, true)).not.eq(-1);
            expect(s.indexOf({p:0}, true)).eq(-1);
        })

        it(`${name}: IndexOf (don't allowSimilar)`, () => {
            let s = createCollection((a:any,b:any) => a.p-b.p);
    
            s.add({p:5, v:"5"})
            s.add({p:5, v:"6"})
            s.add({p:5, v:"7"})
            s.add({p:5, v:"8"})
            s.add({p:5, v:"9"})
            s.add({p:5, v:"10"})
            s.add({p:5, v:"11"})
            s.add({p:7, v:"12"})
            
            s.add({p:3, v:"3"})
            s.add({p:11, v:"11"})
            s.add({p:2, v:"2"})
            s.add({p:51, v:"51"})
    
            for (let i=0; i<s.size(); i++) {
                expect(s.indexOf(s.get(i))).to.eq(i);
            }

            expect(s.indexOf({p:5})).to.equal(-1);
        })

    }

    doTest("OrderedList", (cmp) => new OrderedList(cmp));
    doTest("OrderedLinkList", (cmp) => new OrderedLinkedList(cmp))
})
