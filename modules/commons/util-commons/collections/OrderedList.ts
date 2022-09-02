import { ArrayList } from "./ArrayList";
import { LinkedList } from "./Main";

export class OrderedLinkedList<T = number> extends LinkedList<T> {
    insert(index: number, value: T): boolean {
        throw "Inserting into OrderedList is not allowed.";
    }
    
    add(value: T): boolean {
        // Point to the previous element
        const iter = this.iterator();

        // Going over the list from the end if
        //   * it is not finished 
        //   * and the comparator indicates the element should go before element in list
        let prev = iter.prev();
        while (!prev.done && this.comp(value, prev.value)<0) {
            prev = iter.prev();
        }
        
        return iter.insertAfter(value);
    }

    indexOf(value: T, allowSimilar = false): number {
        const iter = this.iterator();
        let i = 0;
        let cmp = undefined;

        while (iter.hasMore() && (cmp ?? 1)>=0) {
            const v = iter.next().value;
            
            if (value===v || (cmp = this.comp(value, v))===0 && allowSimilar) {
                return i;
            } 
            
            i++;
        }

        return -1;
    }

    constructor(private comp: (a:T, b:T) => number) {
        super();
    }
}

export class OrderedList<T = number> extends ArrayList<T> {
    insert(index: number, value: T): boolean {
        throw "Inserting into OrderedList is not allowed.";
    }
    
    add(value: T): boolean {
        let l = 0, r = this.size();
        let mv: T, m: number;
        let cmp: number; 

        while (l<r) {
            m = (l+r) >> 1;
            mv = this.get(m);
            cmp = this.comp(mv, value);

            if (cmp>0) {
                r = m;
            }
            else if (cmp<=0) {
                l = m+1;
            }
        }

        return super.insert(l, value);
    }

    indexOf(v: T, allowSimilar = false) {
        let l = 0, r = this.size();
        let mv: T, m: number;
        let cmp: number; 

        while (l<r) {
            m = (l+r) >> 1;
            mv = this.get(m);
            cmp = this.comp(mv, v);

            if (cmp>0) {
                r = m;
            }
            else if (cmp<0) {
                l = m+1;
            }
            else {
                if (allowSimilar || mv===v) {
                    return m;
                }

                // Remembering where we will be coming back when we dont find the element going left
                const mbak = m;
                
                // We'll start by going back
                let direction = -1;

                while (true) {
                    m += direction;

                    if (m<0 || m>=this.size()) {
                        cmp = -1;
                    }
                    else {
                        mv = this.get(m);
                        cmp = this.comp(mv, v);
                    }

                    if (cmp!==0) {
                        if (direction>0) {
                            return -1;
                        }
                        else {
                            direction = 1;
                            m = mbak;
                        }
                    }
                    else {
                        if (mv === v) {
                            return m;
                        }
                    }
                }
            }
        }

        return -1;
    }

    constructor(private comp: (a:T, b:T) => number, stable = false) {
        super();
    }
}