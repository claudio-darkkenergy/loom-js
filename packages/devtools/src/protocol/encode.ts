import type { Encoded, PathKey } from './types';

/** How deep an encode inlines before leaving parts to path expansion. */
export const INLINE_DEPTH = 2;
/** How many entries a collection inlines. */
export const ENTRY_CAP = 100;
/** How long a string inlines before truncating. */
export const STRING_CAP = 500;

// Recognizes values with a framework meaning (activities, DOM nodes,
// component values) before the generic encoding applies.
export type DescribeSpecial = (value: unknown) => Encoded | undefined;

const encodeNumber = (value: number): Encoded => ({
    t: 'num',
    v: Number.isNaN(value)
        ? 'NaN'
        : value === Infinity
          ? 'Infinity'
          : value === -Infinity
            ? '-Infinity'
            : Object.is(value, -0)
              ? '-0'
              : value
});

const constructorName = (value: object) => {
    const prototype = Object.getPrototypeOf(value);

    return prototype && prototype !== Object.prototype
        ? (prototype.constructor?.name as string | undefined)
        : undefined;
};

/**
 * Encodes a live value as a tagged, JSON-safe descriptor: inlined `depth`
 * levels deep, collections capped at `ENTRY_CAP` entries, strings at
 * `STRING_CAP` characters. Cycles and unreadable values become markers.
 * @param value The live value.
 * @param describeSpecial Recognizes framework values first.
 * @param depth Levels left to inline.
 * @param ancestors The objects on the current path (cycle detection).
 */
export const encodeValue = (
    value: unknown,
    describeSpecial: DescribeSpecial,
    depth = INLINE_DEPTH,
    ancestors: WeakSet<object> = new WeakSet()
): Encoded => {
    try {
        const special = describeSpecial(value);

        if (special) {
            return special;
        }

        switch (typeof value) {
            case 'undefined':
                return { t: 'undefined' };
            case 'boolean':
                return { t: 'bool', v: value };
            case 'number':
                return encodeNumber(value);
            case 'bigint':
                return { t: 'bigint', v: String(value) };
            case 'symbol':
                return { t: 'symbol', v: value.description ?? '' };
            case 'string':
                return value.length > STRING_CAP
                    ? {
                          length: value.length,
                          t: 'str',
                          v: value.slice(0, STRING_CAP)
                      }
                    : { t: 'str', v: value };
            case 'function':
                return { name: value.name || 'anonymous', t: 'fn' };
        }

        if (value === null) {
            return { t: 'null' };
        }

        const object = value as object;

        if (ancestors.has(object)) {
            return { t: 'circular' };
        }

        if (object instanceof Date) {
            return { t: 'date', v: object.toISOString() };
        }

        if (object instanceof Error) {
            return { message: object.message, name: object.name, t: 'error' };
        }

        if (typeof (object as PromiseLike<unknown>).then === 'function') {
            return { t: 'promise' };
        }

        const nested = (child: unknown) =>
            encodeValue(child, describeSpecial, depth - 1, ancestors);
        // A throwing getter marks only its own entry.
        const nestedRead = (read: () => unknown): Encoded => {
            let child: unknown;

            try {
                child = read();
            } catch {
                return { t: 'unserializable' };
            }

            return nested(child);
        };
        const inline = depth > 0;

        ancestors.add(object);

        try {
            if (Array.isArray(object)) {
                return {
                    items: inline
                        ? object.slice(0, ENTRY_CAP).map(nested)
                        : undefined,
                    length: object.length,
                    t: 'array'
                };
            }

            if (object instanceof Map || object instanceof Set) {
                const entries = Array.from(
                    object instanceof Map ? object.entries() : object.values()
                ).slice(0, ENTRY_CAP);

                return {
                    entries: inline
                        ? entries.map((entry): [Encoded, Encoded] =>
                              object instanceof Map
                                  ? [
                                        nested(
                                            (entry as [unknown, unknown])[0]
                                        ),
                                        nested((entry as [unknown, unknown])[1])
                                    ]
                                  : [{ t: 'undefined' }, nested(entry)]
                          )
                        : undefined,
                    size: object.size,
                    t: object instanceof Map ? 'map' : 'set'
                };
            }

            const keys = Object.keys(object);

            return {
                ctor: constructorName(object),
                entries: inline
                    ? keys
                          .slice(0, ENTRY_CAP)
                          .map((key): [string, Encoded] => [
                              key,
                              nestedRead(
                                  () => (object as Record<string, unknown>)[key]
                              )
                          ])
                    : undefined,
                size: keys.length,
                t: 'object'
            };
        } finally {
            ancestors.delete(object);
        }
    } catch {
        return { t: 'unserializable' };
    }
};

/** Marks a path that leads nowhere in the live value. */
export const MISSING = Symbol('loom-devtools.missing');

/**
 * Follows a path of keys/indices into a live value: object keys, array
 * indices, and entry indices for maps (the value) and sets.
 * @param value The live root value.
 * @param path The keys to follow.
 * @returns The value at the path, or `MISSING`.
 */
export const resolvePath = (
    value: unknown,
    path: PathKey[]
): unknown | typeof MISSING =>
    path.reduce<unknown>((current, key) => {
        if (
            current === MISSING ||
            current === null ||
            typeof current !== 'object'
        ) {
            return MISSING;
        }

        if (current instanceof Map || current instanceof Set) {
            const entry = Array.from(current.values())[Number(key)];

            return entry === undefined && Number(key) >= current.size
                ? MISSING
                : entry;
        }

        return key in current
            ? (current as Record<PathKey, unknown>)[key]
            : MISSING;
    }, value);
