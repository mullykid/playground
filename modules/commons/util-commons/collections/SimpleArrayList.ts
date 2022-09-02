import { AbstractList } from "../Collections";

export class SimpleArrayList<T> extends AbstractList<T> {
    private data: T[] = [];

    public get(index: number) {
        this.checkBounds(index);

        return this.data[index]
    }

    public removeAt(index: number) {
        this.checkBounds(index);

        if (index===0) {
            return this.data.shift() as T;
        }

        if (index===this.data.length-1) {
            return this.data.pop() as T;
        }

        return this.data.splice(index, 1)[0];
    }

    public insert(index: number, value: T) {
        if (index===0) {
            this.data.unshift(value);
        }
        if (index===this.data.length) {
            this.data.push(value);
        }
        else {
            this.checkBounds(index);
            this.data.splice(index, 0, value);
        }

        return true;
    }

    public size() {
        return this.data.length;
    }

    public replace(index: number, value: T) {
        this.checkBounds(index);
        let result = this.data.splice(index, 1, value)[0];

        return result;
    }

    public add(value: T) {
        this.data.push(value);

        return true;
    }

    public clear() {
        this.data = [];
    }
}

