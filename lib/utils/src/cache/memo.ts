export type CacheKeyPurger = () => void;

export const memo = <T extends (clean: CacheKeyPurger, ...args: any) => any>(
    fn: T
) => {
    const cache: { [key: symbol]: unknown } = {};

    return (...args: Omit<Parameters<T>, '0'>) => {
        const argsKey = JSON.stringify(args, (_, val) =>
            // Replace function args w/ a stringified version of the function.
            typeof val === 'function' ? String(val) : val
        ) as unknown as symbol;
        const purgeKeyFromCache: CacheKeyPurger = () => {
            delete cache[argsKey];
        };

        if (argsKey in cache) {
            return cache[argsKey];
        }

        cache[argsKey] = fn(purgeKeyFromCache, ...args);
        return cache[argsKey];
    };
};
