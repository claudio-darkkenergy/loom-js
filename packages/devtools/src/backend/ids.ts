/**
 * Session-scoped numeric ids for live objects (contexts, activities):
 * assigned on first sight, stable for the object's lifetime, never reused,
 * and never keeping the object alive.
 */
export const createIdRegistry = () => {
    const ids = new WeakMap<object, number>();
    const objects = new Map<number, WeakRef<object>>();
    let lastId = 0;

    return {
        idOf(object: object) {
            let id = ids.get(object);

            if (id === undefined) {
                id = ++lastId;
                ids.set(object, id);
                objects.set(id, new WeakRef(object));
            }

            return id;
        },
        // The object behind an id, or `undefined` when unknown or collected.
        objectOf<T extends object>(id: number) {
            const object = objects.get(id)?.deref();

            object || objects.delete(id);

            return object as T | undefined;
        }
    };
};

export type IdRegistry = ReturnType<typeof createIdRegistry>;
