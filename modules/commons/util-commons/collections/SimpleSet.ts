import { AbstractCollection, ArrayList, Set } from "../Collections";

/**
 * A naïve implementation of the Set. 
 *  
 * Use this class only if you need a custom comparator. Otherwise SmartSet is much faster 
 */
 export class SimpleSet<T> extends AbstractCollection<T> implements Set<T> {
    private readonly comparator: (a:T, b:T)=>boolean;
    private data: ArrayList<T> = new ArrayList<T>();
    
    public iterator(): Iterator<T> {
        return this.data.iterator();
    }

    public clear() {
        this.data.clear();
    }

    public add(value: T): boolean {
        for (let o of this.data) {
            if (this.comparator(o, value)) {
                return false;
            }
        }

        this.data.add(value);
        return true;
    }
    
    public size() {
        return this.data.size();
    }

    public isEmpty() {
        return this.data.size() === 0;
    }

    public remove(value: T) {
        return this.data.remove(value);
    }

    public constructor(comparator: (a: T, b: T) => boolean) {
        super();
        
        this.comparator = comparator;
    }
}
