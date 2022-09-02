import { HashMap } from "../Collections";

export function mapById<T extends { id: string }>(data: Iterable<T>) : Map<string, T>;
export function mapById<T>(data: Iterable<T>, fn?: (o: T) => string) : Map<string, T>;

export function mapById<T>(data: Iterable<T>, fn?: (o: T) => string) : Map<string, T> {
    const result = new HashMap<string, T>();

    for (const o of data) {
        result.set(fn ? fn(o) : (o as any).id, o);
    }

    return result;
}