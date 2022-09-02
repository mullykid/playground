/** 
 * Iterable is a read-only collection. You cannot modify it, you don't even know how many items there are. 
 * You only can iterate over its values
 */
 export interface Iterable<T> {
    forEach( callback:(value:T, index:number) => void ): void;

    reduce<V>( reduceFunction: (accumulator:V, value:T, index: number) => V, init: V ): V;
    map<V>( mapFunction: (value:T, index:number) => V ): List<V>;

    toArray(): T[];

    [Symbol.iterator](): Iterator<T>;
    iterator(): Iterator<T>;

    filter(condition: (v: T)=>boolean): Iterable<T>;

    includes(value: T): boolean;
    includesAll(values: T[]): boolean;
    includesMany(...values: T[]): boolean;
}

export interface Collection<T> extends Iterable<T> {
    add(value: T): boolean;
    addAll(values: T[]): void;
    addMany(...values: T[]): void;

    remove(value: T): boolean;
    removeAll(values: T[]): number;
    removeMany(...values: T[]): number;

    size(): number;
    clear(): void;

    isEmpty(): boolean;
}

/** 
 * List is a collection of items that can be addressed by their indexes. 
 * 
 * There is a guarantee of order, so if you add an item to the list, the order of items already there will not change.  
 */
export interface List<T> extends Collection<T> {
    insert(index: number, value: T): boolean;

    removeAt(index: number): T;
    replace(index: number, value: T): T;
    get(index: number): T;

    iterator(): ListIterator<T>;
}

/**
 * Set is a collection that only holds unique values.
 */
export interface Set<T> extends Collection<T> {
}

export interface ListIterator<T> extends Iterator<T, undefined> {
    hasMore(): boolean;
    value(): T;

    remove(): T;
    insert(value: T): boolean;
    replace(value: T): T;
}

export abstract class AbstractIterable<T> implements Iterable<T> {
    [Symbol.iterator](): Iterator<T> {
        return this.iterator();
    }

    forEach( callback:(value:T, index:number) => void ): void {
        let index = 0;
        for (let v of this) {
            callback(v, index++);
        }
    }

    reduce<V>( reduceFunction: (accumulator:V, value:T, index: number) => V, init: V ): V {
        let result = init;

        this.forEach( (value, index) => (result = reduceFunction(result, value, index)) );

        return result;
    }

    map<V>( mapFunction: (value:T, index:number) => V ): List<V> {
        let result = new LinkedList<V>();

        this.forEach( (value, index) => result.add(mapFunction(value, index)) );

        return result;
    }

    filter(predicate: (value:T) => boolean): Iterable<T> {
        const result = new LinkedList<T>();
        
        for (let v of this) {
            if (predicate(v)) {
                result.add(v);
            }
        }

        return result;
    }

    toArray(): T[] {
        return Array.from(this);
    }

    includes(value: T): boolean {
        return this.reduce( (acc:boolean, v:T) => acc || v===value, false)
    }

    includesAll(values: T[]): boolean {
        return values.reduce( (acc:boolean, value) => acc && this.includes(value), true);
    }

    includesMany(...values: T[]) {
        return this.includesAll(values);
    }

    abstract iterator(): Iterator<T>;
}

export abstract class AbstractCollection<T> extends AbstractIterable<T> implements Collection<T> {
    abstract size(): number;
    abstract remove(value: T): boolean;
    abstract add(value: T): boolean;
    abstract clear(): void;

    removeAll(values: T[]) {
        let result = 0;
        
        for (let value of values) {
            if (this.remove(value)) {
                result++;
            }
        }

        return result;
    }

    removeMany(...values: T[]) {
        return this.removeAll(values);
    }

    addAll(values: T[]): void {
        for (let i=0; i<values.length; i++) {
            this.add(values[i]);
        }
    }

    addMany(...values: T[]){
        return this.addAll(values);
    }

    isEmpty() {
        return (this.size()===0);
    }
}

export abstract class AbstractList<T> extends AbstractCollection<T> implements List<T> {
    abstract insert(index: number, value: T): boolean;
    abstract removeAt(index: number): T;
    abstract get(index: number): T;

    indexOf(value: T) {
        for (let i=0; i<this.size(); i++) {
            if (this.get(i)===value) {
                return i;
            }
        }

        return -1;
    }

    remove(value: T) {
        let i = this.indexOf(value);

        if (i!==-1) {
            this.removeAt(i);

            return true;
        }
        else {
            return false;
        }
    }

    add(value: T) {
        return this.insert(this.size(), value);
    }

    checkBounds(index: number) {
        if (index>=this.size()) {
            throw new RangeError(`OutOfBounds: Size of the collection is ${this.size()}, requested index is ${index}`);
        }

        if (index<0) {
            throw new RangeError(`OutOfBounds: Requested index is ${index}`);
        }
    }

    iterator(): ListIterator<T> {
        return new IndexBasedListIterator(this);
    }

    clear() {
        while (this.size()>0) {
            this.removeAt(0);
        }
    }

    replace(index: number, value: T) {
        this.checkBounds(index);
        
        let result = this.get(index);
        this.insert(index, value);
        return result;
    }
}

class IndexBasedListIterator<T> implements ListIterator<T> {
    private list: List<T>;
    
    // The index the cursor points to
    private cursorPos = -1;

    private checkCursorState() {
        if (this.cursorPos===-1) {
            throw new RangeError("Cursor is not initialized yet. You need to call next() at least once");
        }
    }

    hasMore(): boolean {
        return this.cursorPos+1<this.list.size();
    }

    next(): IteratorResult<T> {
        if (this.cursorPos<this.list.size()-1) {
            return {
                done: false,
                value: this.list.get(++this.cursorPos)
            }
        }
        else {
            if (this.cursorPos<this.list.size()) {
                this.cursorPos++
            }

            return ITERATOR_END;
        }
    }

    insert(value: T) {
        this.checkCursorState();

        return this.list.insert(this.cursorPos++, value);
    }

    replace(value: T): T {
        return this.list.replace(this.cursorPos, value);
    }

    remove(): T {
        this.checkCursorState();

        return this.list.removeAt(this.cursorPos);
    }

    value(): T {
        this.checkCursorState();

        return this.list.get(this.cursorPos);
    }

    constructor(list: List<T>) {
        this.list = list;
    }
}

export class LinkedList<T> extends AbstractList<T> {
    sizeInt = 0;
    elems = new LinkedListWrapper<T>();

    size() {
        return this.sizeInt;
    }

    clear() {
        this.elems.next = this.elems;
        this.elems.prev = this.elems;
        this.sizeInt = 0;
    }

    add(value: T): boolean {
        let toInsert = new LinkedListWrapper<T>(value);

        //Inserting at the end of the list - same as inserting before this.elems
        let insertAfter = this.elems.prev;
        let insertBefore = this.elems;
        
        toInsert.prev = insertAfter;
        toInsert.next = insertBefore;

        insertAfter.next = toInsert;
        insertBefore.prev = toInsert;

        ++this.sizeInt;
        return true;
    }

    insert(index: number, value: T) {
        if (index<0 || index>this.sizeInt) {
            throw new RangeError(`Cannot insert at position ${index}, when list has ${this.sizeInt} elements`);
        }
        
        let toInsert = new LinkedListWrapper<T>(value);

        let insertAfter = this.elems;
        while (index-->0) {
            insertAfter = insertAfter.next;
        }
        let insertBefore = insertAfter.next;

        toInsert.prev = insertAfter;
        toInsert.next = insertBefore;

        insertAfter.next = toInsert;
        insertBefore.prev = toInsert;

        ++this.sizeInt;
        return true;
    }

    get(index: number): T {
        this.checkBounds(index);
        
        // A wild guess - are you trying to access last element?
        if (index==this.sizeInt-1) {
            return this.elems.prev.getPayload();
        }

        // Setting the cursor to the first actual value of the List
        let cursor = this.elems.next;
        while (index-->0) {
            cursor = cursor.next;
        }

        return cursor.getPayload();
    }

    forEach( callback:(value:T, index:number) => void ): void {
        let cursor = this.elems.next;
        let index = 0;
        while (cursor != this.elems) {
            callback(cursor.getPayload(), index++);

            cursor = cursor.next;
        }
    }

    // We're overriding the implementaiton from AbstractList. 
    // While a IndexListIterator would work, it will be much slower
    iterator(): LinkedListIterator<T> {
        return new LinkedListIterator<T>(this);
    }

    replace(index: number, value: T): T {
        this.checkBounds(index);
        
        // Setting the cursor to the first actual value of the List
        let cursor = this.elems.next;
        while (index-->0) {
            cursor = cursor.next;
        }

        let result = cursor.getPayload();

        cursor.payload = value;

        return result;
    }

    removeAt(index: number): T {
        this.checkBounds(index);
        
        // Setting the cursor to the first actual value of the List
        let cursor = this.elems.next;
        // A wild guess - are you trying to access last element?
        if (index==this.sizeInt-1) {
            cursor = this.elems.prev;
        }
        else {
            while (index-->0) {
                cursor = cursor.next;
            }
        }

        // Removing the value at cursor
        let prev = cursor.prev;
        let next = cursor.next;

        prev.next = next;
        next.prev = prev;

        this.sizeInt--;

        return cursor.getPayload();
    }
}

class LinkedListIterator<T> implements ListIterator<T> {
    private parentList: LinkedList<T>;
    
    private cursor: LinkedListWrapper<T>;
    private finished = false;

    constructor(parentList: LinkedList<T>) {
        this.parentList = parentList;

        this.cursor = parentList.elems;
    }

    hasMore(): boolean {
        return this.cursor.next !== this.parentList.elems 
    }

    hasPrev(): boolean {
        return this.cursor.prev !== this.parentList.elems
    }

    prev(): IteratorResult<T> {
        if (!this.finished) {
            this.cursor = this.cursor.prev;
        }

        // The cursor points on the element that is not part of the list. Cannot go further - finishing
        if (this.cursor === this.parentList.elems || this.finished) {
            this.finished = true;
            
            return ITERATOR_END;
        }

        return {
            done: false,
            value: this.cursor.getPayload()
        }
    }

    next(): IteratorResult<T> {
        if (!this.finished) {
            this.cursor = this.cursor.next;
        }

        // The cursor points on the element that is not part of the list. Cannot go further - finishing
        if (this.cursor === this.parentList.elems || this.finished) {
            this.finished = true;
            
            return ITERATOR_END;
        }

        return {
            done: false,
            value: this.cursor.getPayload()
        }
    }

    value(): T {
        if (this.cursor === this.parentList.elems) {
            throw new RangeError("Cursor is not pointing at list element.")
        }

        return this.cursor.getPayload();
    }

    _insert(elem: T, insertAfter: LinkedListWrapper<T>, insertBefore: LinkedListWrapper<T>) {
        let toInsert = new LinkedListWrapper<T>(elem);

        toInsert.prev = insertAfter;
        toInsert.next = insertBefore;

        insertAfter.next = toInsert;
        insertBefore.prev = toInsert;

        this.parentList.sizeInt++;
        
        return true;
    }

    insertAfter(elem: T) {
        //Inserting after this.cursor
        return this._insert(elem, this.cursor, this.cursor.next);
    }

    insert(elem: T) {
        //Inserting before this.cursor
        return this._insert(elem, this.cursor.prev, this.cursor);
    }

    remove(): T {
        //Removing the item the cursor points to
        if (this.cursor === this.parentList.elems) {
            throw new Error("Cursor is not properly initialized. Did you call next() ?!")
        }

        let result = this.cursor.getPayload();

        this.cursor.next.prev = this.cursor.prev;
        this.cursor.prev.next = this.cursor.next;
        
        // And moving cursor to the next item
        this.cursor = this.cursor.next;
        
        return result;
    }

    replace(elem: T): T {
        //Removing the item the cursor points to
        if (this.cursor === this.parentList.elems) {
            throw new Error("Cursor is not properly initialized. Did you call next() ?!")
        }

        let result = this.cursor.getPayload();

        this.cursor.payload = elem;

        return result;
    }
}

class LinkedListWrapper<T> {
    next: LinkedListWrapper<T>;
    prev: LinkedListWrapper<T>;
    payload?: T;

    constructor(value?: T) {
        this.payload = value;

        this.next = this;
        this.prev = this;
    }

    // The below should be getPayload(): T, but this gets complicated when T also includes undefined.
    // We cannot know if the undefined is a valid value stored in the list or simply unset value in the wrapper.  
    getPayload(): any {
        return this.payload;
    }
}

export class SmartSet<T> extends AbstractCollection<T> implements Set<T> {
    private readonly data = new Set<T>();
    
    public iterator(): Iterator<T> {
        return new IterableFromIterator(this.data.values())
    }

    public clear() {
        this.data.clear();
    }

    public add(value: T): boolean {
        let size = this.data.size;
        this.data.add(value);

        return this.data.size > size;
    }
    
    public includes(value: T): boolean {
        return this.data.has(value);
    }

    public size() {
        return this.data.size;
    }

    public remove(value: T): boolean {
        return this.data.delete(value);
    }

    public constructor(data?: T[] | Iterable<T>) {
        super();

        for (let t of data ?? []) {
            this.add(t);
        }
    }
}





class IterableFromIterator<T, I extends Iterator<T> = Iterator<T>> extends AbstractIterable<T> implements Iterable<T> {
    constructor(private readonly data: I) {
        super();
    }

    [Symbol.iterator](): I {
        return this.data;
    }

    iterator(): I {
        return this.data;
    }

    // Here to satisfy the Map interface. This should not really be ever used.  
    next() { 
        return this.data.next();
    }
}

export class HashMap<K, T> extends Map<K, T> {
    remove(key: K): T | undefined {
        let result = this.get(key);
        super.delete(key);
        
        return result;
    }

    values() {
        return new IterableFromIterator<T, IterableIterator<T>>(super.values())
    }

    keys() {
        return new IterableFromIterator<K, IterableIterator<K>>(super.keys());
    }
}

export const ITERATOR_END = {
    done: true as true,
    value: undefined as any
}