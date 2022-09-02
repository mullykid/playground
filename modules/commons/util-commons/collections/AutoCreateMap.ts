import { HashMap } from "./Main";

export class AutoCreateMap<K, T> extends HashMap<K, T> {
    private readonly createFnc: (key: K)=>T;

    get(key: K): T {
        let result = super.get(key);

        if (result===undefined) {
            this.set(key, result = this.createFnc(key));
        }

        return result;
    }

    find(key: K): T | undefined {
        return super.get(key);
    }

    remove(key: K): T {
        let result = this.get(key);
        super.delete(key);
        
        return result;
    }

    constructor(createFnc: (key: K)=>T) {
        super();

        this.createFnc = createFnc;
    }
}
