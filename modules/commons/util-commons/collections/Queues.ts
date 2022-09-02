import { AbstractIterable, Iterable, LinkedList, List } from "./Main";

export interface Queue<T> extends Iterable<T> {
    hasMore(): boolean;
    size(): number;
    push(value: T): boolean;
    pop(): T;
    peek(): T;
}

abstract class AbstractQueue<T, TL extends List<T> = List<T>> extends AbstractIterable<T> implements Queue<T> {
    hasMore(): boolean {
        return this.size()>0;
    }

    size(): number {
        return this.list.size();
    }

    abstract push(elem: T): boolean;

    pop(): T {
        return this.list.removeAt(0);
    }

    peek(): T {
        return this.list.get(0);
    }

    iterator() {
        return this.list.iterator();
    }

    constructor(protected readonly list: TL) {
        super();
    }
}

export class Stack<T> extends AbstractQueue<T> implements Queue<T> {
    push(value: T): boolean {
        return this.list.insert(0, value);
    }

    constructor() {
        super(new LinkedList<T>());
    }
}

export class FifoQueue<T> extends AbstractQueue<T> implements Queue<T> {
    push(value: T): boolean {
        return this.list.add(value);
    }

    constructor() {
        super(new LinkedList<T>());
    }
}

export class PriorityQueue<T> extends AbstractQueue<T, LinkedList<T>> implements Queue<T> {
    private comparator: (a:T, b:T) => number;
    
    iterator() {
        return this.list.iterator();
    }

    push(elem: T): boolean {
        // Point to the previous element
        let iter = this.list.iterator();

        // Going over the list from the end if
        //   * it is not finished 
        //   * and the comparator indicates the element should go before element in list
        let prev = iter.prev();
        let count = 0;
        while ((this.maxDisplacement === null || count++<this.maxDisplacement) && !prev.done && this.comparator(elem, prev.value)<0) {
            prev = iter.prev();
        }
        
        return iter.insertAfter(elem);
    }

    constructor(comparator: (a:T, b:T) => number, readonly maxDisplacement: number | null = null ) {
        super(new LinkedList<T>());
        
        this.comparator = comparator;
    }
}