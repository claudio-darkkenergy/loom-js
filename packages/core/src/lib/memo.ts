export interface MemoFunc<T extends unknown[], R> {
    (cacheClean: () => boolean, ...args: T): R;
}

export const memo = <T extends unknown[], R = unknown>(
    cachedProcess: MemoFunc<T, R>,
    cacheKey: (...args: T) => unknown = (...args) => JSON.stringify(args)
) => {
    const cache = new Map<unknown, ReturnType<typeof cachedProcess>>();

    // Memoized Function.
    return (...args: T) => {
        const sig = cacheKey(...args);

        if (!cache.has(sig)) {
            // The request is not pending execution and/or resolution.
            // Not yet cached.
            const cacheClean = () => cache.delete(sig);
            const pendingValue = cachedProcess(cacheClean, ...args);

            pendingValue && cache.set(sig, pendingValue);
            return pendingValue;
        }

        return cache.get(sig) as R;
    };
};
