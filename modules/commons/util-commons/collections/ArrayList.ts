import { AbstractList, List } from "../Collections";

const AL_REALLOCATE_THRESHOLD = 1000; // If the indexStart goes above this, the array will be reallocated.
const AL_REALLOCATE_GAP = 50;          // When starting fresh, how many empty records we'll leaving at the begining to facilitate inserting at the beggining 

export class ArrayList<T> extends AbstractList<T> implements List<T> {
    private data: T[] = [];
    private indexStart: number = AL_REALLOCATE_GAP; // First index that holds the data. If equal to indexEnd, there is no data.

    add(value: T): boolean {
        this.data.push(value);

        return true;
    }

    insert(index: number, value: T) {
        if (index<0 || index>this.size()) {
            throw new RangeError(`Cannot insert at position ${index}, when list has ${this.size()} elements`);
        }
        
        if (this.indexStart>0 && index===0) {
            this.data[--this.indexStart] = value;
        }
        else {
            this.data.splice(index+this.indexStart, 0, value);
        }

        return true;
    }

    removeAt(index: number): T {
        this.checkBounds(index);

        // Remove first item
        if (index === 0) {
            const result = this.data[this.indexStart];

            // Remove the reference for GC
            delete this.data[this.indexStart++];

            // If there is big leading hole at the beggining of the array, let's reallocate... 
            if (this.indexStart>AL_REALLOCATE_THRESHOLD) {
                this.data.splice(AL_REALLOCATE_GAP, this.indexStart-AL_REALLOCATE_GAP);
                this.indexStart = AL_REALLOCATE_GAP;
            }

            return result;
        }
        // Last item
        else if (index === this.size()-1) {
            return this.data.pop() as T;
        }
        else {
            return this.data.splice(this.indexStart+index, 1)[0];
        }
    }
    
    get(index: number): T {
        this.checkBounds(index);

        return this.data[index+this.indexStart];
    }

    clear() {
        this.data = new Array(AL_REALLOCATE_GAP)
        this.indexStart = AL_REALLOCATE_GAP;
    }

    replace(index: number, value: T): T {
        this.checkBounds(index);
        
        let result = this.data[index+this.indexStart];
        this.data[index+this.indexStart] = value;

        return result;
    }

    size(): number {
        return this.data.length - this.indexStart;
    }

    toArray(): T[] {
        return this.data.slice(this.indexStart);
    }

    /**
     * Initializes the arrayList with given size. This size will change if the array grows. 
     */
    constructor() {
        super();

        this.clear();
    }
}
